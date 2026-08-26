const mongoose = require("mongoose");
const Coupon = require("../../models/coupons/coupon");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const cron = require("node-cron");
const { createUserNotificationSafe } = require("../notification/helpers");
const { getRoomBasePrice } = require("../hotel/offerUtils");
const {
  normalizeIdList,
  isCouponExpired,
  getRemainingQuota,
  registerCouponUsage,
  hasCouponBeenRedeemedByUser,
} = require("./couponUtils");
const { normalizeValidityToEndOfDayIST } = require("./couponUtils");

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
};

const uniqueMerge = (existing, incoming) => {
  return [...new Set([...toArray(existing), ...toArray(incoming)])];
};

const toSafeNumber = (val) => Number(val) || 0;

const normalizeUserId = (value) => String(value || "").trim();

const couponAllowsBooking = (coupon, { userId, hotelId, roomId }) => {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedHotelId = normalizeUserId(hotelId);
  const normalizedRoomId = normalizeUserId(roomId);

  if (!normalizedUserId) return { ok: false, message: "Authenticated user required" };
  if (hasCouponBeenRedeemedByUser(coupon, normalizedUserId)) {
    return { ok: false, message: "You have already used this coupon" };
  }

  const targetUserId = normalizeUserId(coupon.targetUserId || coupon.userId);
  if (coupon.type === "user" && targetUserId && targetUserId !== normalizedUserId) {
    return { ok: false, message: "Coupon assigned to another user" };
  }

  const hotelIds = normalizeIdList(coupon.hotelId);
  const roomIds = normalizeIdList(coupon.roomId);
  if (coupon.type === "partner" && hotelIds.length && !hotelIds.includes(normalizedHotelId)) {
    return { ok: false, message: "Coupon is not valid for this hotel" };
  }
  if (coupon.type === "partner" && roomIds.length && !roomIds.includes(normalizedRoomId)) {
    return { ok: false, message: "Coupon is not valid for this room" };
  }

  return { ok: true };
};

// Reserve quota only after the booking payload has been validated. The query
// makes the quota and one-user-one-use check atomic under concurrent requests.
const redeemCouponForBooking = async ({ couponCode, userId, bookingId, hotelId, roomId, discountPrice }) => {
  const normalizedCode = String(couponCode || "").trim();
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedCode || !normalizedUserId || !bookingId) {
    return { ok: false, status: 400, message: "couponCode, userId and bookingId required" };
  }

  const now = new Date();
  const coupon = await Coupon.findOneAndUpdate(
    {
      couponCode: normalizedCode,
      expired: false,
      validity: { $gte: now },
      $expr: { $lt: [{ $ifNull: ["$usedCount", 0] }, { $ifNull: ["$maxUsage", { $ifNull: ["$quantity", 1] }] }] },
      $nor: [
        { "redemptions.userId": normalizedUserId },
        { "usageHistory.userId": normalizedUserId },
      ],
    },
    {
      $inc: { usedCount: 1 },
      $push: {
        redemptions: {
          userId: normalizedUserId,
          bookingId: String(bookingId),
          hotelId: String(hotelId || ""),
          roomId: String(roomId || ""),
          discountPrice: Number(discountPrice || 0),
          redeemedAt: now,
        },
      },
    },
    { new: true },
  );

  if (!coupon) {
    const existing = await Coupon.findOne({ couponCode: normalizedCode }).lean();
    if (!existing) return { ok: false, status: 404, message: "Coupon code not found" };
    if (isCouponExpired(existing)) return { ok: false, status: 400, message: "Coupon usage limit reached or coupon expired" };
    if (hasCouponBeenRedeemedByUser(existing, normalizedUserId)) return { ok: false, status: 409, message: "You have already used this coupon" };
    return { ok: false, status: 400, message: "Coupon is not valid for this booking" };
  }

  const usageLimit = getRemainingQuota(coupon) === 0 ? Number(coupon.usedCount || 0) : null;
  if (usageLimit !== null) {
    await Coupon.updateOne({ _id: coupon._id }, { $set: { expired: true } });
  }
  return { ok: true, coupon };
};

const resolveCouponUserId = async (coupon) => {
  if (coupon.targetUserId) return String(coupon.targetUserId);
  if (coupon.userId) return String(coupon.userId);

  const assignedTo = String(coupon.assignedTo || "").trim();
  if (!assignedTo) return null;

  const user = await userModel.findOne({
    email: { $regex: `^${assignedTo}$`, $options: "i" },
  });

  return user?.userId ? String(user.userId) : null;
};

const createCoupon = async (req, res) => {
  try {
    const {
      type,
      couponName,
      discountPrice,
      validity,
      quantity,
      maxUsage,
      assignedTo,
      userId,
    } = req.body;

    if (!["partner", "user"].includes(type)) {
      return res.status(400).json({ success: false, error: "Invalid coupon type" });
    }

    const usageLimit = Number(maxUsage || quantity || 1);

    const couponValidity = normalizeValidityToEndOfDayIST(validity) || validity;

    const createdCoupon = await Coupon.create({
      type,
      couponName,
      discountPrice,
      validity: couponValidity,
      quantity: usageLimit,
      maxUsage: usageLimit,
      assignedTo,
      targetUserId: userId,
      userId,
    });

    // Ensure `expired` flag is set consistently on creation using server time.
    try {
      const now = new Date();
      const expiryDate = createdCoupon.validity ? new Date(createdCoupon.validity) : null;
      createdCoupon.expired = expiryDate ? expiryDate < now : false;
      await createdCoupon.save();
    } catch (err) {
      // non-fatal - continue
    }

    if (type === "user") {
      const resolvedUserId = await resolveCouponUserId(createdCoupon);
      if (resolvedUserId) {
        createdCoupon.targetUserId = createdCoupon.targetUserId || resolvedUserId;
        createdCoupon.userId = createdCoupon.userId || resolvedUserId;
        await createdCoupon.save();

        await createUserNotificationSafe({
          name: "Coupon Received",
          message: `A new coupon ${createdCoupon.couponCode} worth Rs ${createdCoupon.discountPrice} is added to your account. Valid till ${formatDate(createdCoupon.validity)}.`,
          path: "/app/coupons",
          eventType: "coupon_assigned",
          metadata: {
            couponCode: createdCoupon.couponCode,
            discountPrice: createdCoupon.discountPrice,
            validity: createdCoupon.validity,
          },
          userIds: [resolvedUserId],
        });
      }
    }

    res.status(201).json({ message: "Coupon code created", coupon: createdCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    let { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code required" });
    }

    couponCode = String(couponCode).trim();

    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }

    if (isCouponExpired(coupon)) {
      coupon.expired = true;
      await coupon.save();
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.type === "partner") {
      return applyPartnerCoupon(req, res, coupon);
    }

    if (coupon.type === "user") {
      return applyUserCoupon(req, res, coupon);
    }

    return res.status(400).json({ message: "Invalid coupon type" });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const applyPartnerCoupon = async (req, res, coupon) => {
  try {
    const hotelIds = normalizeIdList(
      req.body.hotelIds || req.body.hotelId
    );
    const roomIds = normalizeIdList(req.body.roomIds || req.body.roomId || []).map(String);
    const userIds = normalizeIdList(req.body.userIds || req.body.userId || []).map(String);

    undefined;

    if (!hotelIds.length) {
      return res.status(400).json({ message: "hotelIds required" });
    }

    // App/web user flow: partner coupon is already a promotion configured by
    // the panel. Do not try to configure the room again. In particular, an
    // already-promoted room has isOffer=true and must still be redeemable.
    if (userIds.length) {
      return applyPartnerCouponForUser({
        res,
        coupon,
        hotelId: hotelIds[0],
        roomId: roomIds[0],
        userId: userIds[0],
      });
    }

    const remainingQuota = getRemainingQuota(coupon);
    if (remainingQuota <= 0) {
      return res.status(400).json({ message: "Coupon limit reached" });
    }

    const hotels = await hotelModel.find({
      hotelId: { $in: hotelIds },
    });

    if (!hotels.length) {
      return res.status(404).json({ message: "No hotels found" });
    }

    const roomFilterSet = new Set(roomIds);
    const discount = Math.max(0, toSafeNumber(coupon.discountPrice));

    const discountDetails = [];
    const appliedRoomIds = [];
    const appliedHotelIds = [];

    for (const hotel of hotels) {
      undefined;
      
      // Debug: Print all rooms for this hotel
      if (hotel.rooms && hotel.rooms.length > 0) {
        undefined;
      }
      
      for (const room of hotel.rooms || []) {
        const roomId = String(room.roomId || "").trim();
        undefined;

        // Enhanced room eligibility checks with detailed logging
        if (!roomId) {
          undefined;
          continue;
        }
        
        if (roomFilterSet.size && !roomFilterSet.has(roomId)) {
          undefined;
          continue;
        }
        
        if (room.isOffer === true) {
          undefined;
          continue;
        }
        
        const availableCount = Number(room.countRooms || 0);
        if (availableCount <= 0) {
          undefined;
          continue;
        }

        undefined;

        const basePrice = toSafeNumber(getRoomBasePrice(room));
        const finalPrice = Math.max(0, basePrice - discount);

        undefined;

        // Simplified update query - remove redundant conditions
        const updateResult = await hotelModel.updateOne(
          {
            hotelId: String(hotel.hotelId),
            "rooms.roomId": roomId,
          },
          {
            $set: {
              "rooms.$.offerName": coupon.couponName,
              "rooms.$.offerPriceLess": discount,
              "rooms.$.offerExp": coupon.validity,
              "rooms.$.isOffer": true,
              "rooms.$.price": finalPrice,
              "rooms.$.originalPrice": basePrice,
            },
          }
        );

        undefined;

        if (!updateResult.modifiedCount) {
          undefined;
          continue;
        }

        appliedRoomIds.push(roomId);
        appliedHotelIds.push(String(hotel.hotelId));

        discountDetails.push({
          hotelId: String(hotel.hotelId),
          roomId,
          originalPrice: basePrice,
          discountPrice: discount,
          finalPrice,
        });

      }
    }

    if (!discountDetails.length) {
      return res.status(400).json({ message: "No eligible rooms found" });
    }

    // ✅ IMPORTANT: Don't increment used count on apply, only on actual booking
    // Just store which rooms/hotels are eligible for this coupon
    coupon.userIds = uniqueMerge(coupon.userIds || [], userIds);
    coupon.roomId = uniqueMerge(coupon.roomId || [], appliedRoomIds);
    coupon.hotelId = uniqueMerge(coupon.hotelId || [], appliedHotelIds);

    // ✅ Store eligible rooms for future booking validation
    coupon.eligibleRooms = discountDetails;

    const requestedUserId = String(userIds[0] || "").trim();
    if (requestedUserId && hasCouponBeenRedeemedByUser(coupon, requestedUserId)) {
      return res.status(409).json({ message: "You have already used this coupon" });
    }

    // ❌ DON'T register usage or increment used count here
    // Usage will be registered only when actual booking is made
    // remainingQuota = registerCouponUsage({...});

    await coupon.save();

    return res.status(200).json({
      message: "Partner coupon applied successfully - ready for booking",
      data: discountDetails,
      couponCode: coupon.couponCode,
      // Keep a simple shape for older web clients while retaining the
      // detailed room-wise response used by the panel/app.
      discountPrice: discount,
      discountAmount: discount,
      eligibleRooms: discountDetails.length,
      usage: {
        usedCount: coupon.usedCount || 0,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota: getRemainingQuota(coupon), // Show current remaining without decrementing
        note: "Usage count will increment only on actual booking"
      },
    });

  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const applyUserCoupon = async (req, res, coupon) => {
  try {
    let { hotelId, roomId, userId } = req.body;

    // Accept either singular fields or arrays coming from frontend
    if ((!hotelId || hotelId === "") && Array.isArray(req.body.hotelIds) && req.body.hotelIds.length) {
      hotelId = req.body.hotelIds[0];
    }
    if ((!roomId || roomId === "") && Array.isArray(req.body.roomIds) && req.body.roomIds.length) {
      roomId = req.body.roomIds[0];
    }
    if ((!userId || userId === "") && Array.isArray(req.body.userIds) && req.body.userIds.length) {
      userId = req.body.userIds[0];
    }

    hotelId = String(hotelId || "").trim();
    roomId = String(roomId || "").trim();
    userId = String(userId || "").trim();

    if (!hotelId || !roomId || !userId) {
      return res.status(400).json({ message: "hotelId, roomId, userId required" });
    }

    // Resolve _id → numeric userId for coupon ownership comparison
    if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
      const userDoc = await userModel.findOne({ $or: [{ _id: userId }, { userId }] }).select("userId").lean();
      if (userDoc) userId = String(userDoc.userId);
    }

    const targetUserId = String(coupon.targetUserId || coupon.userId || "");

    if (targetUserId && targetUserId !== userId) {
      return res.status(403).json({ message: "Coupon assigned to another user" });
    }

    if (hasCouponBeenRedeemedByUser(coupon, userId)) {
      return res.status(409).json({ message: "You have already used this coupon" });
    }

    const hotel = await hotelModel.findOne({ hotelId });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

    const selectedRoom = (hotel.rooms || []).find((room) => {
      const candidates = [
        room.roomId,
        room._id,
        room.id,
        room.roomID,
        room.typeId,
        room.roomTypeID,
        room.room_type_id,
        room.roomType?.id,
        room.roomType?._id,
        room.hotelRoomId,
        room.roomIdString,
      ];
      return candidates.map(normalize).some((c) => c && c === roomId);
    });

    if (!selectedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (Number(selectedRoom.countRooms || 0) <= 0) {
      return res.status(400).json({ message: "Room sold out" });
    }

    const originalPrice = toSafeNumber(selectedRoom.price);
    const discountPrice = toSafeNumber(coupon.discountPrice);
    const finalPrice = Math.max(0, originalPrice - discountPrice);

    // ✅ IMPORTANT: Don't increment used count on apply, only on actual booking
    coupon.targetUserId = targetUserId || userId;
    coupon.userId = coupon.targetUserId;

    coupon.hotelId = uniqueMerge(coupon.hotelId || [], [hotelId]);
    coupon.roomId = uniqueMerge(coupon.roomId || [], [roomId]);

    // ✅ Store eligible room for future booking validation
    const eligibleRoom = {
      hotelId,
      roomId,
      userId,
      originalPrice,
      discountPrice,
      finalPrice,
    };
    coupon.eligibleRooms = [eligibleRoom];

    // ❌ DON'T register usage or increment used count here
    // Usage will be registered only when actual booking is made
    /*
    const remainingQuota = registerCouponUsage({
      coupon,
      usageCount: 1,
      usageEntries: [
        { userId, hotelId, roomId, discountPrice, finalPrice },
      ],
    });
    */

    await coupon.save();

    return res.status(200).json({
      message: "User coupon applied successfully - ready for booking",
      hotelId,
      roomId,
      userId,
      originalPrice,
      discountPrice,
      finalPrice,
      couponCode: coupon.couponCode,
      usage: {
        usedCount: coupon.usedCount || 0,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota: getRemainingQuota(coupon), // Show current remaining without decrementing
        note: "Usage count will increment only on actual booking"
      },
    });

  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const restoreIncorrectlyExpiredCoupons = async (filter = {}) => {
  const now = new Date();

  return Coupon.updateMany(
    {
      ...filter,
      expired: true,
      validity: { $gt: now },
      $expr: {
        $lt: [
          { $ifNull: ["$usedCount", 0] },
          { $ifNull: ["$maxUsage", { $ifNull: ["$quantity", 1] }] },
        ],
      },
    },
    { $set: { expired: false } },
  );
};

const expireCouponsAutomatically = async () => {
  try {
    const now = new Date();

    await restoreIncorrectlyExpiredCoupons();

    const coupons = await Coupon.find({
      expired: false,
      validity: { $lte: now, $ne: null },
    });

    for (const coupon of coupons) {
      coupon.expired = true;
      await coupon.save();

      if (coupon.type === "user") {
        const userId = await resolveCouponUserId(coupon);
        if (userId) {
          await createUserNotificationSafe({
            name: "Coupon Expired",
            message: `Your coupon ${coupon.couponCode} expired on ${formatDate(coupon.validity)}.`,
            path: "/app/coupons",
            eventType: "coupon_expired",
            metadata: {
              couponCode: coupon.couponCode,
              validity: coupon.validity,
            },
            userIds: [userId],
          });
        }
      }
    }
  } catch { }
};

cron.schedule("* * * * *", expireCouponsAutomatically);

const getCoupons = async (req, res) => {
  try {
    const { type } = req.query;

    await restoreIncorrectlyExpiredCoupons(type ? { type } : {});

    const filter = {
      expired: false,
      validity: { $gte: new Date() },
    };

    if (type) filter.type = type;

    const coupons = await Coupon.find(filter).sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserDefaultCoupon = async (req, res) => {
  try {
    const { email } = req.body;

    await restoreIncorrectlyExpiredCoupons({
      type: "user",
      assignedTo: { $regex: `^${String(email || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    const coupons = await Coupon.find({
      type: "user",
      $or: [
        { assignedTo: email },
        { assignedTo: { $regex: `\\(${email}\\)$`, $options: "i" } },
      ],
      expired: false,
      validity: { $gte: new Date() },
    });

    if (coupons.length) {
      return res.status(200).json(coupons);
    }

    return res.status(404).json({ message: "No coupon found" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ NEW FUNCTION: Register coupon usage on actual booking
const registerCouponUsageOnBooking = async (req, res) => {
  try {
    const { couponCode, hotelId, roomId, userId, bookingId } = req.body;

    if (!couponCode || !hotelId || !roomId || !userId) {
      return res.status(400).json({ 
        message: "couponCode, hotelId, roomId, userId required" 
      });
    }

    const coupon = await Coupon.findOne({ couponCode: String(couponCode).trim() });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const eligibility = couponAllowsBooking(coupon, { userId, hotelId, roomId });
    if (!eligibility.ok) return res.status(eligibility.status || 400).json({ message: eligibility.message });

    const result = await redeemCouponForBooking({
      couponCode,
      userId,
      bookingId,
      hotelId,
      roomId,
      discountPrice: coupon.discountPrice,
    });
    if (!result.ok) return res.status(result.status || 400).json({ message: result.message });

    const newRemainingQuota = getRemainingQuota(result.coupon);

    return res.status(200).json({
      message: "Coupon usage registered successfully",
      couponCode,
      bookingId,
      usage: {
        usedCount: result.coupon.usedCount,
        maxUsage: result.coupon.maxUsage || result.coupon.quantity,
        remainingQuota: newRemainingQuota,
      },
      discountApplied: result.coupon.discountPrice,
    });

  } catch (error) {
    console.error("Error registering coupon usage:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCoupons,
  applyCoupon,
  createCoupon,
  getUserDefaultCoupon,
  registerCouponUsageOnBooking,
  redeemCouponForBooking,
  couponAllowsBooking,
};

const applyPartnerCouponForUser = async ({ res, coupon, hotelId, roomId, userId }) => {
  if (!hotelId || !roomId || !userId) {
    return res.status(400).json({ message: "hotelId, roomId and userId required" });
  }

  if (hasCouponBeenRedeemedByUser(coupon, userId)) {
    return res.status(409).json({ message: "You have already used this coupon" });
  }

  const couponHotelIds = normalizeIdList(coupon.hotelId);
  const couponRoomIds = normalizeIdList(coupon.roomId);
  if (couponHotelIds.length && !couponHotelIds.includes(String(hotelId))) {
    return res.status(400).json({ message: "Coupon is not valid for this hotel" });
  }

  const hotel = await hotelModel.findOne({ hotelId: String(hotelId) }).lean();
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });

  const normalize = (value) => String(value ?? "").trim();
  const requestedRoomId = normalize(roomId);
  const room = (hotel.rooms || []).find((candidate) => {
    const candidates = [
      candidate?.roomId,
      candidate?._id,
      candidate?.id,
      candidate?.roomID,
      candidate?.hotelRoomId,
      candidate?.typeId,
      candidate?.roomTypeID,
      candidate?.room_type_id,
      candidate?.roomTypeId,
      candidate?.roomType?._id,
      candidate?.roomType?.id,
    ].map(normalize);
    return candidates.includes(requestedRoomId);
  });
  if (!room) return res.status(404).json({ message: "Room not found" });

  const roomAliases = [
    room.roomId,
    room._id,
    room.id,
    room.roomID,
    room.hotelRoomId,
    room.typeId,
    room.roomTypeID,
    room.room_type_id,
    room.roomTypeId,
    room.roomType?._id,
    room.roomType?.id,
  ].map(normalize);
  if (couponRoomIds.length && !couponRoomIds.some((id) => roomAliases.includes(String(id)))) {
    return res.status(400).json({ message: "Coupon is not valid for this room" });
  }
  if (Number(room.countRooms || 0) <= 0) {
    return res.status(400).json({ message: "Room sold out" });
  }

  // User redemption must use the room's current payable price. If a hotel
  // offer is already active, getRoomBasePrice() would return the pre-offer
  // list price and the apply screen would disagree with booking pricing.
  const originalPrice = toSafeNumber(room.price);
  const discountPrice = Math.max(0, toSafeNumber(coupon.discountPrice));
  const finalPrice = Math.max(0, originalPrice - discountPrice);
  const canonicalRoomId = normalize(room.roomId || room._id || room.id || roomId);
  const detail = {
    hotelId: String(hotelId),
    roomId: canonicalRoomId,
    originalPrice,
    discountPrice,
    finalPrice,
  };

  return res.status(200).json({
    message: "Partner coupon applied successfully - ready for booking",
    couponType: "partner",
    data: [detail],
    couponCode: coupon.couponCode,
    discountPrice,
    discountAmount: discountPrice,
    eligibleRooms: 1,
    usage: {
      usedCount: coupon.usedCount || 0,
      maxUsage: coupon.maxUsage || coupon.quantity,
      remainingQuota: getRemainingQuota(coupon),
      note: "Usage count will increment only on actual booking",
    },
  });
};
