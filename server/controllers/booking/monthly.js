const month = require("../../models/booking/monthly");
const basicDetails = require("../../models/hotel/basicDetails");
const cron = require('node-cron');

const getRoomKeys = (room) => [room?.roomId, room?._id, room?.id]
  .filter((value) => value !== undefined && value !== null && String(value).trim())
  .map((value) => String(value).trim());
const getRoomType = (room) => room?.type || room?.roomType || room?.name || room?.roomCategory || null;
const getRoomBedType = (room) => room?.bedTypes || room?.bedType || room?.beds || null;

/* =========================================================
   CREATE MONTHLY PRICE
   POST /monthly-set-room-price/:hotelId/:roomId
========================================================= */
const newMonth = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { startDate, endDate, monthPrice } = req.body;

    // FIX: validate required fields
    if (!startDate || !endDate || monthPrice === undefined) {
      return res.status(400).json({ error: "startDate, endDate and monthPrice are required." });
    }
    if (isNaN(Number(monthPrice)) || Number(monthPrice) < 0) {
      return res.status(400).json({ error: "monthPrice must be a non-negative number." });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: "endDate must be after startDate." });
    }

    const duplicate = await month.findOne({
      hotelId,
      roomId,
      startDate: { $lte: String(endDate) },
      endDate: { $gte: String(startDate) },
    }).lean();
    if (duplicate) {
      return res.status(409).json({
        error: "This room already has a monthly price for the selected date range. Please choose another room or dates.",
      });
    }

    const createdPrice = await month.create({
      hotelId,
      roomId,
      startDate,
      endDate,
      monthPrice: Number(monthPrice),
    });

    return res.status(201).json({ success: true, data: createdPrice });
  } catch (error) {
    console.error("newMonth error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* =========================================================
   GET MONTHLY PRICES BY HOTEL ID
   GET /monthly-set-room-price/get/by/:hotelId
========================================================= */
const getPriceByHotelId = async function (req, res) {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  try {
    const query = { hotelId };
    // Return entries that overlap the selected stay when the mobile app
    // supplies dates. The app sends local calendar dates through ISO/UTC,
    // which can arrive one day earlier in India; overlap keeps the matching
    // entry available and the client performs the final local-date check.
    if (checkInDate && checkOutDate) {
      query.startDate = { $lte: checkOutDate };
      query.endDate = { $gte: checkInDate };
    }
    const monthlyPrices = await month.find(query).exec();

    // A newly selected hotel has no entries yet; return an empty list so the
    // admin can immediately add its first monthly price.
    if (!monthlyPrices || monthlyPrices.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const roomIds = monthlyPrices.map(price => price.roomId);
    const hotel = await basicDetails.findOne({ hotelId });

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const matchedRooms = hotel.rooms.filter(room =>
      roomIds.some((roomId) =>
        getRoomKeys(room).includes(String(roomId))
      )
    );

    const combinedData = monthlyPrices.map(price => {
      // FIX: roomInfo?.type — prevents crash if room was deleted from hotel
      const roomInfo = matchedRooms.find(room =>
        getRoomKeys(room).includes(String(price.roomId))
      );
      return {
        ...price.toObject(),
        roomType: getRoomType(roomInfo),
        roomBedType: getRoomBedType(roomInfo),
      };
    });

    return res.status(200).json({ success: true, data: combinedData });
  } catch (error) {
    console.error("getPriceByHotelId error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   UPDATE MONTHLY PRICE BY ID
   PATCH /monthly-set-room-price/update/:id
========================================================= */
const updateMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, monthPrice } = req.body;

    if (monthPrice !== undefined && (isNaN(Number(monthPrice)) || Number(monthPrice) < 0)) {
      return res.status(400).json({ error: "monthPrice must be a non-negative number." });
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: "endDate must be after startDate." });
    }

    const current = await month.findById(id).lean();
    if (!current) {
      return res.status(404).json({ error: "Monthly price entry not found." });
    }
    const nextStartDate = String(startDate || current.startDate);
    const nextEndDate = String(endDate || current.endDate);
    const duplicate = await month.findOne({
      _id: { $ne: id },
      hotelId: current.hotelId,
      roomId: current.roomId,
      startDate: { $lte: nextEndDate },
      endDate: { $gte: nextStartDate },
    }).lean();
    if (duplicate) {
      return res.status(409).json({
        error: "This room already has a monthly price for the selected date range. Please choose another room or dates.",
      });
    }

    const updateFields = {};
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;
    if (monthPrice !== undefined) updateFields.monthPrice = Number(monthPrice);

    const updated = await month.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Monthly price entry not found." });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateMonth error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE BY ID (single entry)
   DELETE /monthly-set-room-price/delete/by-id/:id
========================================================= */
const deleteMonthById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await month.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Monthly price entry not found." });
    }
    return res.status(200).json({ success: true, message: "Deleted successfully", data: deleted });
  } catch (error) {
    console.error("deleteMonthById error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE ALL PRICES FOR A HOTEL
   DELETE /monthly-set-room-price/delete/price/by/:hotelId
========================================================= */
const deleteMonth = async (req, res) => {
  try {
    const { hotelId } = req.params;
    // FIX: deleteMany instead of findOneAndDelete (was silently deleting only 1)
    const result = await month.deleteMany({ hotelId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No monthly price entries found for this hotel." });
    }
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} price entries for hotel ${hotelId}`,
    });
  } catch (error) {
    // FIX: was missing error response in catch
    console.error("deleteMonth error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* =========================================================
   INTERNAL: auto-delete expired entries (used by cron)
========================================================= */
// FIX: separated internal logic from HTTP handler — cron was calling with undefined req/res
const _autoDeleteExpired = async () => {
  const result = await month.deleteMany({ endDate: { $lt: new Date().toISOString() } });
  return result.deletedCount;
};

cron.schedule('0 0 * * *', async () => {
  try {
    const count = await _autoDeleteExpired();
    undefined;
  } catch (error) {
    console.error('[cron] autoDelete failed:', error.message);
  }
});

module.exports = { newMonth, getPriceByHotelId, updateMonth, deleteMonthById, deleteMonth };
