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
} = require("./couponUtils");

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

    const createdCoupon = await Coupon.create({
      type,
      couponName,
      discountPrice,
      validity,
      quantity: usageLimit,
      maxUsage: usageLimit,
      assignedTo,
      targetUserId: userId,
      userId,
    });

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
    const userIds = normalizeIdList(req.body.userIds || []).map(String);

    console.log("Partner Coupon Request:", {
      hotelIds,
      roomIds,
      userIds,
      body: req.body
    });

    if (!hotelIds.length) {
      return res.status(400).json({ message: "hotelIds required" });
    }

    let remainingQuota = getRemainingQuota(coupon);
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
      console.log(`Checking hotel: ${hotel.hotelId}, total rooms: ${hotel.rooms?.length || 0}`);
      
      // Debug: Print all rooms for this hotel
      if (hotel.rooms && hotel.rooms.length > 0) {
        console.log("Available rooms:", hotel.rooms.map(r => ({
          roomId: r.roomId,
          countRooms: r.countRooms,
          isOffer: r.isOffer,
          price: r.price
        })));
      }
      
      for (const room of hotel.rooms || []) {
        if (remainingQuota <= 0) break;

        const roomId = String(room.roomId || "").trim();
        console.log(`Processing room: ${roomId}, requested: ${roomIds.join(', ')}`);

        // Enhanced room eligibility checks with detailed logging
        if (!roomId) {
          console.log("❌ Room ID is empty");
          continue;
        }
        
        if (roomFilterSet.size && !roomFilterSet.has(roomId)) {
          console.log(`❌ Room ${roomId} not in filter set`);
          continue;
        }
        
        if (room.isOffer === true) {
          console.log(`❌ Room ${roomId} is already on offer`);
          continue;
        }
        
        const availableCount = Number(room.countRooms || 0);
        if (availableCount <= 0) {
          console.log(`❌ Room ${roomId} has no availability (countRooms: ${availableCount})`);
          continue;
        }

        console.log(`✅ Found eligible room: ${roomId}, countRooms: ${availableCount}, price: ${room.price}`);

        const basePrice = toSafeNumber(getRoomBasePrice(room));
        const finalPrice = Math.max(0, basePrice - discount);

        console.log(`💰 Pricing: base=${basePrice}, discount=${discount}, final=${finalPrice}`);

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

        console.log(`📝 Update result: modifiedCount=${updateResult.modifiedCount}`);

        if (!updateResult.modifiedCount) {
          console.log(`❌ Failed to update room ${roomId}`);
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

        remainingQuota--;
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

    // ❌ DON'T register usage or increment used count here
    // Usage will be registered only when actual booking is made
    // remainingQuota = registerCouponUsage({...});

    await coupon.save();

    return res.status(200).json({
      message: "Partner coupon applied successfully - ready for booking",
      data: discountDetails,
      couponCode: coupon.couponCode,
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

    hotelId = String(hotelId || "").trim();
    roomId = String(roomId || "").trim();
    userId = String(userId || "").trim();

    if (!hotelId || !roomId || !userId) {
      return res.status(400).json({ message: "hotelId, roomId, userId required" });
    }

    const targetUserId = String(coupon.targetUserId || coupon.userId || "");

    if (targetUserId && targetUserId !== userId) {
      return res.status(403).json({ message: "Coupon assigned to another user" });
    }

    const hotel = await hotelModel.findOne({ hotelId });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const selectedRoom = hotel.rooms.find(
      (room) => String(room.roomId).trim() === roomId
    );

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

const expireCouponsAutomatically = async () => {
  try {
    const now = new Date();
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

    const coupon = await Coupon.findOne({ 
      couponCode: String(couponCode).trim() 
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (isCouponExpired(coupon)) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    // Check if this booking combination is eligible
    const eligibleRoom = coupon.eligibleRooms?.find(room => 
      room.hotelId === hotelId && room.roomId === roomId
    );

    if (!eligibleRoom) {
      return res.status(400).json({ 
        message: "This coupon is not eligible for the selected room" 
      });
    }

    // Check remaining quota
    const remainingQuota = getRemainingQuota(coupon);
    if (remainingQuota <= 0) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Register the usage
    const usageEntry = {
      userId,
      hotelId,
      roomId,
      bookingId,
      discountPrice: eligibleRoom.discountPrice,
      finalPrice: eligibleRoom.finalPrice,
      usedAt: new Date()
    };

    const newRemainingQuota = registerCouponUsage({
      coupon,
      usageCount: 1,
      usageEntries: [usageEntry],
    });

    await coupon.save();

    console.log(`✅ Coupon ${couponCode} used for booking ${bookingId}`);

    return res.status(200).json({
      message: "Coupon usage registered successfully",
      couponCode,
      bookingId,
      usage: {
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota: newRemainingQuota,
      },
      discountApplied: eligibleRoom.discountPrice,
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
};