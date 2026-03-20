const month = require("../../models/booking/monthly");
const basicDetails = require("../../models/hotel/basicDetails");
const cron = require('node-cron');

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

  try {
    const monthlyPrices = await month.find({ hotelId }).exec();

    if (!monthlyPrices || monthlyPrices.length === 0) {
      return res.status(404).json({ error: "No monthly prices found for the specified hotelId" });
    }

    const roomIds = monthlyPrices.map(price => price.roomId);
    const hotel = await basicDetails.findOne({ hotelId });

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const matchedRooms = hotel.rooms.filter(room => roomIds.includes(room.roomId));

    const combinedData = monthlyPrices.map(price => {
      // FIX: roomInfo?.type — prevents crash if room was deleted from hotel
      const roomInfo = matchedRooms.find(room => room.roomId === price.roomId);
      return {
        ...price.toObject(),
        roomType: roomInfo?.type || null,
        roomBedType: roomInfo?.bedTypes || null,
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
    console.log(`[cron] autoDelete: removed ${count} expired monthly price entries.`);
  } catch (error) {
    console.error('[cron] autoDelete failed:', error.message);
  }
});

module.exports = { newMonth, getPriceByHotelId, updateMonth, deleteMonthById, deleteMonth };
