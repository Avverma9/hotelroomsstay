const UserCoupon = require("../../models/coupons/userCoupon");
const cron = require("node-cron");
const moment = require("moment-timezone");
const hotelModel = require("../../models/hotel/basicDetails");

const newUserCoupon = async (req, res) => {
  try {
    const { couponName, discountPrice, validity, quantity, assignedTo } = req.body;
    const createdCoupon = await UserCoupon.create({
      couponName,
      discountPrice,
      validity,
      quantity,
      assignedTo,
    });

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


const deleteUserCouponAutomatically = async () => {
  try {
    const moment = require("moment-timezone");

    const currentIST = moment.tz("Asia/Kolkata");
    const formattedIST = currentIST.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    const utcFormatted = formattedIST.slice(0, -6) + "+00:00";

    const result = await UserCoupon.deleteMany({
      expired: false,
      validity: { $lte: utcFormatted },
    });
  } catch (error) {
    console.error("Error deleting expired coupons:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await deleteUserCouponAutomatically();
});

const GetAllUserCoupons = async (req, res) => {
  try {
    // Get the current date in IST timezone
    const currentDate = new Date();
    const currentDateIST = currentDate.getTime() + 5.5 * 60 * 60 * 1000; // Convert to IST
    const coupons = await UserCoupon.find({
      validity: { $gte: currentDateIST },
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
