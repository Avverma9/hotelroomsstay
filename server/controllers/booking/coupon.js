const couponModel = require("../../models/coupons/coupon");
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
} = require("../coupons/couponUtils");

const COUPON_TYPE = "hotel";

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

const newCoupon = async (req, res) => {
  try {
    const { couponName, discountPrice, validity, quantity, maxUsage } = req.body;
    const createdCoupon = await couponModel.create({
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

const ApplyCoupon = async (req, res) => {
  try {
    const hotelIds = normalizeIdList(req.body.hotelIds);
    const roomIds = normalizeIdList(req.body.roomIds || []);
    const couponCode = String(req.body.couponCode || "").trim();

    if (!couponCode || hotelIds.length === 0) {
      return res.status(400).json({
        message: "couponCode and at least one hotelId are required",
      });
    }

    const coupon = await couponModel.findOne({ couponCode, type: COUPON_TYPE });
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
    const appliedRoomIds = [];
    const appliedHotelIds = [];
    const appliedDetails = [];
    const discount = Math.max(0, toNumber(coupon.discountPrice) ?? 0);

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
        appliedDetails.push({
          hotelId: String(hotel.hotelId),
          roomId,
          originalPrice: basePrice,
          discountPrice: discount,
          finalPrice,
        });
        remainingQuota -= 1;
      }
    }

    if (appliedRoomIds.length === 0) {
      return res.status(400).json({
        message: "No eligible rooms found for this coupon",
      });
    }

    coupon.roomId = uniqueMerge(coupon.roomId, appliedRoomIds);
    coupon.hotelId = uniqueMerge(coupon.hotelId, appliedHotelIds);
    remainingQuota = registerCouponUsage({
      coupon,
      usageCount: appliedRoomIds.length,
      usageEntries: appliedDetails.map((item) => ({
        hotelId: item.hotelId,
        roomId: item.roomId,
        discountPrice: item.discountPrice,
        finalPrice: item.finalPrice,
      })),
    });

    await coupon.save();

    res.status(200).json({
      message: "Coupon applied successfully.",
      couponType: coupon.type,
      appliedRoomIds,
      appliedHotelIds,
      appliedDetails,
      usage: {
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage || coupon.quantity,
        remainingQuota,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const expireCouponsAutomatically = async () => {
  try {
    await couponModel.updateMany(
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
    console.error("Error expiring coupons:", error);
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
  await expireCouponsAutomatically();
});

cron.schedule("* * * * *", async () => {
  await removeOffersAutomatically();
});

const GetAllCoupons = async (req, res) => {
  try {
    const coupons = await couponModel
      .find({
        type: COUPON_TYPE,
        expired: false,
        validity: { $gte: new Date() },
      })
      .sort({ validity: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetValidCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({
      type: COUPON_TYPE,
      roomId: { $exists: true, $ne: [] },
      expired: false,
      validity: { $gte: new Date() },
    });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetCouponsByType = async (req, res) => {
  try {
    const { type = COUPON_TYPE, status = "active", search } = req.query;
    const allowedTypes = new Set(["hotel", "partner", "user"]);
    if (!allowedTypes.has(type)) {
      return res.status(400).json({ message: "type must be hotel, partner or user" });
    }

    const query = { type };
    if (status === "active") {
      query.expired = false;
      query.validity = { $gte: new Date() };
    } else if (status === "expired") {
      query.$or = [{ expired: true }, { validity: { $lt: new Date() } }];
    }

    if (search) {
      const pattern = new RegExp(String(search).trim(), "i");
      query.$or = [...(query.$or || []), { couponCode: pattern }, { couponName: pattern }];
    }

    const coupons = await couponModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Coupons fetched successfully",
      data: coupons,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  newCoupon,
  ApplyCoupon,
  GetValidCoupons,
  GetAllCoupons,
  GetCouponsByType,
  removeOffersAutomatically,
};
