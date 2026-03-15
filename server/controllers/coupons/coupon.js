const Coupon = require("../../models/coupons/coupon");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const cron = require("node-cron");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");
const {
  getRoomBasePrice,
  toNumber,
} = require("../hotel/offerUtils");
const {
  normalizeIdList,
  isCouponExpired,
  getRemainingQuota,
  registerCouponUsage,
} = require("./couponUtils");

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [String(value)];
};

const uniqueMerge = (existing, incoming) => {
  return [...new Set([...toArray(existing), ...toArray(incoming)])];
};

const resolveCouponUserId = async (coupon) => {
  if (coupon.targetUserId) {
    return String(coupon.targetUserId);
  }
  if (coupon.userId) {
    return String(coupon.userId);
  }

  const assignedTo = String(coupon.assignedTo || "").trim();
  if (!assignedTo) {
    return null;
  }

  const user = await userModel.findOne({
    email: { $regex: `^${assignedTo}$`, $options: "i" },
  });

  return user?.userId ? String(user.userId) : null;
};

const createCoupon = async (req, res) => {
  try {
    const {
      type, // 'partner' or 'user'
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
      userId, // keep backward compatibility
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

    res
      .status(201)
      .json({ message: "Coupon code created", coupon: createdCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, hotelId, roomId, userId, userIds, hotelIds } = req.body;
    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }
    if (isCouponExpired(coupon)) {
      coupon.expired = true;
      await coupon.save();
      return res.status(400).json({ message: "Coupon code has expired" });
    }

    if (coupon.type === "partner") {
      return applyPartnerCoupon(req, res, coupon);
    } else if (coupon.type === "user") {
      return applyUserCoupon(req, res, coupon);
    } else {
      return res.status(400).json({ message: "Invalid coupon type" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const applyPartnerCoupon = async (req, res, coupon) => {
    const hotelIds = normalizeIdList(req.body.hotelIds);
    const roomIds = normalizeIdList(req.body.roomIds || []);
    const userIds = normalizeIdList(req.body.userIds || []);

    if (hotelIds.length === 0) {
      return res.status(400).json({
        message: "At least one hotelId is required for partner coupons",
      });
    }
    
    let remainingQuota = getRemainingQuota(coupon);
    if (remainingQuota <= 0) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    const hotels = await hotelModel.find({ hotelId: { $in: hotelIds } });
    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found for provided hotelIds" });
    }

    const roomFilterSet = new Set(roomIds);
    const discount = Math.max(0, toNumber(coupon.discountPrice) ?? 0);
    const discountDetails = [];
    const appliedRoomIds = [];
    const appliedHotelIds = [];

    for (const hotel of hotels) {
      const eligibleRooms = (hotel.rooms || []).filter((room) => {
        const roomId = String(room.roomId || "").trim();
        if (!roomId) {
          return false;
        }
        if (roomFilterSet.size > 0 && !roomFilterSet.has(roomId)) {
          return false;
        }
        if (room.isOffer === true) {
          return false;
        }
        return Number(room.countRooms || 0) > 0;
      });

      for (const room of eligibleRooms) {
        if (remainingQuota <= 0) {
          break;
        }

        const roomId = String(room.roomId).trim();
        const basePrice = getRoomBasePrice(room);
        const finalPrice = Math.max(0, basePrice - discount);

        const updateResult = await hotelModel.updateOne(
          {
            hotelId: hotel.hotelId,
            rooms: {
              $elemMatch: {
                roomId,
                isOffer: { $ne: true },
                countRooms: { $gt: 0 },
              },
            },
          },
          {
            $set: {
              "rooms.$.offerName": coupon.couponName,
              "rooms.$.offerPriceLess": discount,
              "rooms.$.offerExp": coupon.validity,
              "rooms.$.isOffer": true,
              "rooms.$.price": basePrice,
              "rooms.$.originalPrice": basePrice,
            },
          },
        );

        if (updateResult.modifiedCount <= 0) {
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
        remainingQuota -= 1;
      }
    }

    if (discountDetails.length === 0) {
      return res.status(400).json({ message: "No eligible rooms found for discount" });
    }

    coupon.userIds = uniqueMerge(coupon.userIds, userIds);
    coupon.roomId = uniqueMerge(coupon.roomId, appliedRoomIds);
    coupon.hotelId = uniqueMerge(coupon.hotelId, appliedHotelIds);
    remainingQuota = registerCouponUsage({
      coupon,
      usageCount: appliedRoomIds.length,
      usageEntries: discountDetails.map((item) => ({
        hotelId: item.hotelId,
        roomId: item.roomId,
        discountPrice: item.discountPrice,
        finalPrice: item.finalPrice,
      })),
    });

    await coupon.save();

    return res.status(200).json({
      message: "Partner coupon applied successfully.",
      couponType: coupon.type,
      data: discountDetails,
      usage: {
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota,
      },
    });
}

const applyUserCoupon = async (req, res, coupon) => {
    const { hotelId, roomId, userId } = req.body;

    if (!hotelId || !roomId || !userId) {
      return res.status(400).json({ message: "Missing required fields for user coupon" });
    }

    const currentUserId = String(userId);
    const targetUserId = String(coupon.targetUserId || coupon.userId || "");
    if (targetUserId && targetUserId !== currentUserId) {
      return res.status(403).json({ message: "Coupon is assigned to another user" });
    }

    const hotel = await hotelModel.findOne({ hotelId: String(hotelId) });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const selectedRoom = hotel.rooms.find(
      (room) => String(room.roomId) === String(roomId),
    );

    if (!selectedRoom) {
      return res.status(404).json({ message: "Room not found in the specified hotel" });
    }

    if (selectedRoom.countRooms <= 0) {
      return res.status(400).json({ message: "Room is not available (sold out)" });
    }

    const originalPrice = selectedRoom.price;
    const discountPrice = coupon.discountPrice;
    const finalPrice = Math.max(0, originalPrice - discountPrice);

    coupon.targetUserId = targetUserId || currentUserId;
    coupon.userId = coupon.targetUserId;
    coupon.hotelId = uniqueMerge(coupon.hotelId, [String(hotelId)]);
    coupon.roomId = uniqueMerge(coupon.roomId, [String(roomId)]);
    const remainingQuota = registerCouponUsage({
      coupon,
      usageCount: 1,
      usageEntries: [
        {
          userId: currentUserId,
          hotelId: String(hotelId),
          roomId: String(roomId),
          discountPrice,
          finalPrice,
        },
      ],
    });
    await coupon.save();

    return res.status(200).json({
      hotelId: String(hotelId),
      roomId: String(roomId),
      userId: currentUserId,
      originalPrice,
      discountPrice,
      finalPrice,
      usage: {
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota,
      },
    });
}

const expireCouponsAutomatically = async () => {
  try {
    const now = new Date();
    const couponsToExpire = await Coupon.find({
      expired: false,
      validity: { $lte: now, $ne: null },
    });

    for (const coupon of couponsToExpire) {
      coupon.expired = true;
      await coupon.save();
      
      if(coupon.type === 'user'){
          const targetUserId = await resolveCouponUserId(coupon);
          if (targetUserId) {
            await createUserNotificationSafe({
              name: "Coupon Expired",
              message: `Your coupon ${coupon.couponCode} has expired on ${formatDate(coupon.validity)}.`,
              path: "/app/coupons",
              eventType: "coupon_expired",
              metadata: {
                couponCode: coupon.couponCode,
                validity: coupon.validity,
              },
              userIds: [targetUserId],
            });
          }
      }
    }
  } catch (error) {
    console.error("Error expiring coupons:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await expireCouponsAutomatically();
});

const getCoupons = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {
      expired: false,
      validity: { $gte: new Date() },
    };
    if (type) {
      filter.type = type;
    }
    const coupons = await Coupon.find(filter).sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserDefaultCoupon = async (req, res) => {
  try {
    const { email } = req.body;

    const findData = await Coupon.find({
      type: "user",
      $or: [
        { assignedTo: email },
        { assignedTo: { $regex: `\(${email}\)$`, $options: "i" } },
      ],
      expired: false,
      validity: { $gte: new Date() },
    });

    if (findData.length > 0) {
      return res.status(200).json(findData);
    }

    return res.status(404).json({ message: "No coupon found" });
  } catch (error) {
    console.error("Error fetching user coupon:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCoupons,
  applyCoupon,
  createCoupon,
  getUserDefaultCoupon,
};
