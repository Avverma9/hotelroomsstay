const UserCoupon = require("../../models/coupons/coupon");
const cron = require("node-cron");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");
const {
  isCouponExpired,
  getRemainingQuota,
  registerCouponUsage,
} = require("./couponUtils");

const COUPON_TYPE = "user";

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

const newUserCoupon = async (req, res) => {
  try {
    const {
      couponName,
      discountPrice,
      validity,
      quantity,
      maxUsage,
      assignedTo,
      userId,
    } = req.body;

    const targetUserId = userId ? String(userId) : undefined;
    const usageLimit = Number(maxUsage || quantity || 1);

    const createdCoupon = await UserCoupon.create({
      type: COUPON_TYPE,
      couponName,
      discountPrice,
      validity,
      quantity: usageLimit,
      maxUsage: usageLimit,
      assignedTo,
      targetUserId,
      userId: targetUserId, // keep backward compatibility
    });

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

    res
      .status(201)
      .json({ message: "Coupon code created", coupon: createdCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const ApplyUserCoupon = async (req, res) => {
  try {
    const { hotelId, roomId, couponCode, userId } = req.body;

    if (!hotelId || !roomId || !couponCode || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const coupon = await UserCoupon.findOne({
      couponCode,
      type: COUPON_TYPE,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (isCouponExpired(coupon)) {
      coupon.expired = true;
      await coupon.save();
      return res.status(400).json({ message: "Coupon has expired or usage limit reached" });
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
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const expireUserCouponAutomatically = async () => {
  try {
    const now = new Date();
    const couponsToExpire = await UserCoupon.find({
      type: COUPON_TYPE,
      expired: false,
      validity: { $lte: now, $ne: null },
    });

    for (const coupon of couponsToExpire) {
      const targetUserId = await resolveCouponUserId(coupon);
      coupon.expired = true;
      await coupon.save();

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
  } catch (error) {
    console.error("Error expiring coupons:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await expireUserCouponAutomatically();
});

const GetAllUserCoupons = async (req, res) => {
  try {
    const currentDate = new Date();
    const coupons = await UserCoupon.find({
      type: COUPON_TYPE,
      validity: { $gte: currentDate },
      expired: false,
    }).sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserDefaultCoupon = async (req, res) => {
  try {
    const { email } = req.body;

    const findData = await UserCoupon.find({
      type: COUPON_TYPE,
      $or: [
        { assignedTo: email },
        { assignedTo: { $regex: `\\(${email}\\)$`, $options: "i" } },
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
  GetAllUserCoupons,
  ApplyUserCoupon,
  newUserCoupon,
  getUserDefaultCoupon,
};
