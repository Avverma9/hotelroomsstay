const mongoose = require("mongoose");

const generateBookingId = () => {
  return [...Array(8)]
    .map(() => Math.random().toString(36).charAt(2).toUpperCase())
    .join("");
};

const travelBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: generateBookingId,
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true,
  },
  price: Number,
  gstPrice: Number,
  vehicleType: String,
  sharingType: String,
  bookingStatus: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Confirmed", "Cancelled", "Failed"],
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  pickupP: {
    type: String,
    required: true,
  },
  dropP: {
    type: String,
    required: true,
  },
  pickupD: {
    type: Date,
    required: true,
  },
  dropD: {
    type: Date,
    required: true,
  },
  seats: [
    {
      type: String,
      required: true,
    },
  ],
  bookedBy: {
    type: String,
  },
  customerMobile: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
});
const CarBooking = mongoose.model("CarBooking", travelBookingSchema);
module.exports = CarBooking;
