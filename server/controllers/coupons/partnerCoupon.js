const PartnerCoupon = require("../../models/coupons/partnerCoupon");
const hotelModel = require("../../models/hotel/basicDetails");
const cron = require("node-cron");
const {
  getRoomBasePrice,
  toNumber,
} = require("../hotel/offerUtils");

const normalizeIdList = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(normalized)];
};

const isCouponExpired = (coupon) => {
  if (!coupon || !coupon.validity) {
    return true;
  }
  if (coupon.expired === true) {
    return true;
  }

  const validity = new Date(coupon.validity);
  if (Number.isNaN(validity.getTime())) {
    return true;
  }

  return validity < new Date();
};

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

const ApplyPartnerCoupon = async (req, res) => {
  try {
    const hotelIds = normalizeIdList(req.body.hotelIds);
    const roomIds = normalizeIdList(req.body.roomIds || []);
    const userIds = normalizeIdList(req.body.userIds || []);
    const couponCode = String(req.body.couponCode || "").trim();

    if (!couponCode || hotelIds.length === 0) {
      return res.status(400).json({
        message: "couponCode and at least one hotelId are required",
      });
    }

    const coupon = await PartnerCoupon.findOne({ couponCode });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }
    if (isCouponExpired(coupon)) {
      coupon.expired = true;
      await coupon.save();
      return res.status(400).json({ message: "Coupon code has expired" });
    }

    const quantityLimit = toNumber(coupon.quantity);
    const hasLimit = quantityLimit !== null && quantityLimit > 0;
    const alreadyAppliedCount = Array.isArray(coupon.roomId)
      ? coupon.roomId.length
      : 0;
    let remainingQuota = hasLimit
      ? Math.max(0, quantityLimit - alreadyAppliedCount)
      : Infinity;

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
          }
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

    const existingUserIds = normalizeIdList(coupon.userIds || []);
    coupon.userIds = [...new Set([...existingUserIds, ...userIds])];
    coupon.roomId = [...new Set([...(coupon.roomId || []), ...appliedRoomIds])];
    coupon.hotelId = [...new Set([...(coupon.hotelId || []), ...appliedHotelIds])];
    if (hasLimit && remainingQuota === 0) {
      coupon.expired = true;
    }

    await coupon.save();

    return res.status(200).json({
      message: "Partner coupon applied successfully.",
      data: discountDetails,
      remainingQuota: hasLimit ? remainingQuota : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const expirePartnerCouponsAutomatically = async () => {
  try {
    await PartnerCoupon.updateMany(
      {
        expired: false,
        validity: { $lte: new Date() },
      },
      {
        $set: { expired: true },
      }
    );
  } catch (error) {
    console.error("Error expiring partner coupons:", error);
  }
};

const removeOffersAutomatically = async () => {
  try {
    const now = new Date();
    const hotels = await hotelModel.find({ "rooms.isOffer": true });
    const bulkRoomUpdates = [];

    for (const hotel of hotels) {
      for (const room of hotel.rooms || []) {
        if (!room.isOffer || !room.offerExp) {
          continue;
        }

        const offerExpDate = new Date(room.offerExp);
        if (Number.isNaN(offerExpDate.getTime()) || offerExpDate > now) {
          continue;
        }

        const restoredPrice = getRoomBasePrice(room);
        bulkRoomUpdates.push({
          updateOne: {
            filter: { hotelId: hotel.hotelId, "rooms.roomId": room.roomId },
            update: {
              $set: {
                "rooms.$.isOffer": false,
                "rooms.$.offerPriceLess": 0,
                "rooms.$.offerExp": null,
                "rooms.$.offerName": "N/A",
                "rooms.$.price": restoredPrice,
                "rooms.$.originalPrice": restoredPrice,
              },
            },
          },
        });
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
  await expirePartnerCouponsAutomatically();
});

cron.schedule("* * * * *", async () => {
  await removeOffersAutomatically();
});

const GetAllPartnerCoupons = async (req, res) => {
  try {
    const coupons = await PartnerCoupon.find({
      expired: false,
      validity: { $gte: new Date() },
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
