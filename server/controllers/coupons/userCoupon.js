const UserCoupon = require("../../models/coupons/userCoupon");
const cron = require("node-cron");
const moment = require("moment-timezone");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

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

const resolveCouponUserId = async (coupon) => {
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
      assignedTo,
      userId,
    } = req.body;
    const createdCoupon = await UserCoupon.create({
      couponName,
      discountPrice,
      validity,
      quantity,
      assignedTo,
      userId,
    });

    const targetUserId = await resolveCouponUserId(createdCoupon);
    if (targetUserId && !createdCoupon.userId) {
      createdCoupon.userId = targetUserId;
      await createdCoupon.save();
    }

    if (targetUserId) {
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
        userIds: [targetUserId],
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

    // Fetch coupon by couponCode
    const coupon = await UserCoupon.findOne({ couponCode });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const currentIST = moment().tz("Asia/Kolkata");
    const couponExpiry = moment(coupon.validity);

    if (currentIST.isAfter(couponExpiry) || coupon.expired === true) {
      return res.status(400).json({ message: "Coupon has expired or already used" });
    }

    // Ensure user hasn't used the coupon before
    if (coupon.userId) {
      return res.status(400).json({ message: "Coupon already used by this user" });
    }

    // Find hotel by hotelId
    const hotel = await hotelModel.findOne({ hotelId: String(hotelId) });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Find the specific room
    const selectedRoom = hotel.rooms.find(
      room => String(room.roomId) === String(roomId)
    );

    if (!selectedRoom) {
      return res.status(404).json({ message: "Room not found in the specified hotel" });
    }

    if (selectedRoom.countRooms <= 0) {
      return res.status(400).json({ message: "Room is not available (sold out)" });
    }

    const originalPrice = selectedRoom.price;
    const discountPrice = coupon.discountPrice;
    const finalPrice = originalPrice - discountPrice;

    // Update coupon details
    coupon.userId = (String(userId));
    coupon.hotelId = String(hotelId);
    coupon.roomId = String(roomId);
    coupon.expired = true;

    await coupon.save();

    return res.status(200).json({
      hotelId: String(hotelId),
      roomId: String(roomId),
      userId: String(userId),
      originalPrice,
      discountPrice,
      finalPrice
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
      expired: false,
      validity: { $lte: now, $ne: null },
    });

    for (const coupon of couponsToExpire) {
      const targetUserId = await resolveCouponUserId(coupon);

      coupon.expired = true;
      if (targetUserId && !coupon.userId) {
        coupon.userId = targetUserId;
      }
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
      $or: [
        { assignedTo: email },
        { assignedTo: { $regex: `\\(${email}\\)$`, $options: "i" } }
      ]
    });

    if (findData.length > 0) {
      return res.status(200).json(findData);
    } else {
      return res.status(404).json({ message: "No coupon found" });
    }
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
