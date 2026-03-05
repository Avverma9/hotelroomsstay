const PartnerCoupon = require("../../models/coupons/coupon");
const hotelModel = require("../../models/hotel/basicDetails");
const cron = require("node-cron");
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

const COUPON_TYPE = "partner";

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

const newPartnerCoupon = async (req, res) => {
  try {
    const { couponName, discountPrice, validity, quantity, maxUsage } = req.body;
    const createdCoupon = await PartnerCoupon.create({
      type: COUPON_TYPE,
      couponName,
      discountPrice,
      validity,
      quantity,
      maxUsage: maxUsage || quantity,
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

    const coupon = await PartnerCoupon.findOne({
      couponCode,
      type: COUPON_TYPE,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }
    if (isCouponExpired(coupon)) {
      coupon.expired = true;
      await coupon.save();
      return res.status(400).json({ message: "Coupon code has expired" });
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
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const expirePartnerCouponsAutomatically = async () => {
  try {
    await PartnerCoupon.updateMany(
      {
        type: COUPON_TYPE,
        expired: false,
        validity: { $lte: new Date() },
      },
      {
        $set: { expired: true },
      },
    );
  } catch (error) {
    console.error("Error expiring partner coupons:", error);
  }
};

cron.schedule("* * * * *", async () => {
  await expirePartnerCouponsAutomatically();
});

const GetAllPartnerCoupons = async (req, res) => {
  try {
    const coupons = await PartnerCoupon.find({
      type: COUPON_TYPE,
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
};
