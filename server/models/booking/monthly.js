const mongoose = require("mongoose");

const monthlyPriceSchema = new mongoose.Schema({
  hotelId: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  monthPrice: {
    type: Number,
    required: true,
  },
});

// Add indexes for performance
monthlyPriceSchema.index({ hotelId: 1, roomId: 1 }); // For room price lookup
monthlyPriceSchema.index({ hotelId: 1, roomId: 1, startDate: 1, endDate: 1 }); // For date range queries
monthlyPriceSchema.index({ endDate: 1 }); // For auto-delete old records

module.exports = mongoose.model("MonthlyPrice", monthlyPriceSchema);
