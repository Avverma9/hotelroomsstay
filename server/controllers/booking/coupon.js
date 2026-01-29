//CREATE COUPON
const couponModel = require("../../models/booking/coupon");
const hotelModel = require("../../models/hotel/basicDetails");
const cron = require("node-cron");
const moment = require("moment-timezone");
const rooms = require("../../models/hotel/rooms");

const newCoupon = async (req, res) => {
  try {
    const { couponName, discountPrice, validity } = req.body;
    const createdCoupon = await couponModel.create({
      couponName,
      discountPrice,
      validity,
    });

    res
      .status(201)
      .json({ message: "Coupon code created", coupon: createdCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//VALIDATE AND APPLY COUPON
const ApplyCoupon = async (req, res) => {
  try {
    const { hotelIds, roomIds = [], couponCode } = req.body;

    const coupon = await couponModel.findOne({ couponCode });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }
    const currentIST = moment.tz("Asia/Kolkata");
    const formattedIST = currentIST.format("YYYY-MM-DDTHH:mm:ss.SSSZ");

    const currentDate = formattedIST.slice(0, -6) + "+00:00";

    const validityDate = coupon.validity;

    if (currentDate > validityDate) {
      return res.status(400).json({ message: "Coupon code has expired" });
    }

    let finalAppliedRoomIds = [];
    let finalAppliedHotelIds = [];

    for (const hotelId of hotelIds) {
      const hotel = await hotelModel.findOne({ hotelId });
      if (!hotel) continue;

      let applicableRooms = [];

      if (roomIds.length > 0) {
        // Filter only user-provided roomIds with isOffer !== true
        applicableRooms = hotel.rooms.filter(
          (room) => roomIds.includes(room.roomId) && room.isOffer !== true && room.countRooms > 0,
        );
      } else {
        // Get all rooms without offer
        applicableRooms = hotel.rooms.filter((room) => room.isOffer !== true && room.countRooms > 0);
      }

      if (applicableRooms.length === 0) continue;

      // Select only the first applicable room for each hotel
      const selectedRoom = applicableRooms[0];
      const newPrice = selectedRoom.price - coupon.discountPrice;

      await hotelModel.findOneAndUpdate(
        { "rooms.roomId": selectedRoom.roomId, hotelId },
        {
          $set: {
            "rooms.$.offerName": coupon.couponName,
            "rooms.$.offerPriceLess": coupon.discountPrice,
            "rooms.$.offerExp": coupon.validity,
            "rooms.$.isOffer": true,
            "rooms.$.price": newPrice,
          },
        },
      );

      finalAppliedRoomIds.push(selectedRoom.roomId);
      finalAppliedHotelIds.push(hotelId);
    }

    if (finalAppliedRoomIds.length === 0) {
      return res.status(400).json({
        message:
          "Coupon has already been applied to all eligible rooms in the selected hotels",
      });
    }

    // Update coupon document
    coupon.roomId = [
      ...new Set([...(coupon.roomId || []), ...finalAppliedRoomIds]),
    ];
    coupon.hotelId = [
      ...new Set([...(coupon.hotelId || []), ...finalAppliedHotelIds]),
    ];
    await coupon.save();

    res.status(200).json({
      message: "Coupon applied successfully to one room per eligible hotel.",
      appliedRoomIds: finalAppliedRoomIds,
      appliedHotelIds: finalAppliedHotelIds,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
//===============================delete coupon automatically=================================
const deleteCouponAutomatically = async () => {
  try {
    const moment = require("moment-timezone");

    const currentIST = moment.tz("Asia/Kolkata");
    const formattedIST = currentIST.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    const utcFormatted = formattedIST.slice(0, -6) + "+00:00";

    const result = await couponModel?.deleteMany({
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
const GetAllCoupons = async (req, res) => {
  try {
    // Get the current date in IST timezone
    const currentDate = new Date();
    const currentDateIST = currentDate.getTime() + 5.5 * 60 * 60 * 1000; // Convert to IST
    const coupons = await couponModel
      .find({
        expired: false, // Ensure expired is false
        validity: { $gte: currentDateIST },
      })
      .sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
//================================== get valid coupons =========================================
const GetValidCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({
      roomId: { $exists: true },
      expired: false, // Ensure expired is false
    });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  newCoupon,
  ApplyCoupon,
  GetValidCoupons,
  GetAllCoupons,
  removeOffersAutomatically
};
