//CREATE COUPON
const PartnerCoupon = require("../../models/coupons/partnerCoupon");
const hotelModel = require("../../models/hotel/basicDetails");
const cron = require("node-cron");
const moment = require("moment-timezone");
const rooms = require("../../models/hotel/rooms");

const newPartnerCoupon = async (req, res) => {
  try {
    const { couponName, discountPrice, validity, quantity } = req.body;
    const createdCoupon = await PartnerCoupon.create({
      couponName,
      discountPrice,
      validity,
      quantity,
    });

    res
      .status(201)
      .json({ message: "Coupon code created", coupon: createdCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//VALIDATE AND APPLY COUPON
const ApplyPartnerCoupon = async (req, res) => {
  try {
    const { hotelIds, roomIds = [], couponCode, userIds = [] } = req.body;

    const coupon = await PartnerCoupon.findOne({ couponCode });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }

    const currentIST = moment.tz("Asia/Kolkata");
    const currentUTC = currentIST.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

    if (currentUTC > coupon.validity) {
      return res.status(400).json({ message: "Coupon code has expired" });
    }

    // ❌ Check room-based coupon usage limit
    const totalUsedRooms = coupon.roomId?.length || 0;
    if (totalUsedRooms + roomIds.length > coupon.quantity) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    let discountDetails = [];
    let allRoomIds = [];
    let allHotelIds = [];

    for (const hotelId of hotelIds) {
      const hotel = await hotelModel.findOne({ hotelId });
      if (!hotel) continue;

      for (const roomId of roomIds) {
        const selectedRoom = hotel.rooms.find((room) => room.roomId === roomId && room.countRooms > 0);
        if (!selectedRoom) continue;

        const discountedPrice = selectedRoom.price - coupon.discountPrice;

        discountDetails.push({
          hotelId,
          roomId: selectedRoom.roomId,
          originalPrice: selectedRoom.price,
          discountPrice: coupon.discountPrice,
          finalPrice: discountedPrice,
        });

        allRoomIds.push(selectedRoom.roomId);
        allHotelIds.push(hotelId);
      }
    }

    if (discountDetails.length === 0) {
      return res
        .status(400)
        .json({ message: "No eligible rooms found for discount" });
    }

    // ✅ Save only new unique user IDs
    const existingUserIds = coupon.userIds?.map((id) => Number(id)) || [];
    const newUserIds = userIds
      .map((id) => Number(id))
      .filter((id) => !existingUserIds.includes(id));

    coupon.userIds = [...existingUserIds, ...newUserIds];
    coupon.roomId = [...(coupon.roomId || []), ...allRoomIds];
    coupon.hotelId = [...(coupon.hotelId || []), ...allHotelIds];

    await coupon.save();

    return res.status(200).json(discountDetails);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//===============================delete coupon automatically=================================
const deleteCouponAutomatically = async () => {
  try {
    const moment = require("moment-timezone");

    const currentIST = moment.tz("Asia/Kolkata");
    const formattedIST = currentIST.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    const utcFormatted = formattedIST.slice(0, -6) + "+00:00";

    const result = await PartnerCoupon.deleteMany({
      expired: false,
      validity: { $lte: utcFormatted },
    });
  } catch (error) {
    console.error("Error deleting expired coupons:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await deleteCouponAutomatically();
});
//================================== remove offer from hotel automatically=========================
const removeOffersAutomatically = async () => {
  try {
    const currentIST = moment.tz("Asia/Kolkata");
    const formattedIST = currentIST.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    const currentDate = formattedIST.slice(0, -6) + "+00:00";

    const hotels = await hotelModel.find();
    const hotelIdsWithExpiredOffers = [];

    for (const hotel of hotels) {
      const hasExpiredOffer = hotel.rooms.some(
        (room) =>
          room.isOffer === true &&
          new Date(room.offerExp) <= new Date(currentDate),
      );
      if (hasExpiredOffer) {
        hotelIdsWithExpiredOffers.push(hotel.hotelId.toString());
      }
    }

    const hotelsToBeFind = await hotelModel.find({
      hotelId: { $in: hotelIdsWithExpiredOffers },
    });

    if (hotelsToBeFind.length === 0) {
      return;
    }

    const bulkRoomUpdates = [];
    for (const hotel of hotelsToBeFind) {
      if (hotel.rooms && hotel.rooms.length > 0) {
        const updates = hotel.rooms
          .filter((room) => room.isOffer)
          .map((room) => ({
            updateOne: {
              filter: { hotelId: hotel.hotelId, "rooms.roomId": room.roomId },
              update: {
                $set: {
                  "rooms.$.isOffer": false,
                  "rooms.$.offerPriceLess": 0,
                  "rooms.$.offerExp": "",
                  "rooms.$.offerName": "",
                  "rooms.$.price": room.price + room.offerPriceLess,
                },
              },
            },
          }));
        bulkRoomUpdates.push(...updates);
      }
    }

    if (bulkRoomUpdates.length > 0) {
      await hotelModel.bulkWrite(bulkRoomUpdates);
    }
  } catch (error) {
    console.error("Error in removeOffersAutomatically:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await removeOffersAutomatically();
});

//================================== get all coupons =========================================
const GetAllPartnerCoupons = async (req, res) => {
  try {
    // Get the current date in IST timezone
    const currentDate = new Date();
    const currentDateIST = currentDate.getTime() + 5.5 * 60 * 60 * 1000; // Convert to IST
    const coupons = await PartnerCoupon.find({
      validity: { $gte: currentDateIST },
    }).sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  newPartnerCoupon,
  ApplyPartnerCoupon,
  GetAllPartnerCoupons,
  removeOffersAutomatically,
};
