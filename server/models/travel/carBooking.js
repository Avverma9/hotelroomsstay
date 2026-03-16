const mongoose = require("mongoose");

const generateBookingId = () => {
  return [...Array(8)]
    .map(() => Math.random().toString(36).charAt(2).toUpperCase())
    .join("");
};

const travelBookingSchema = new mongoose.Schema(
  {
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
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Passenger Info
    passengerName: {
      type: String,
      default: "",
    },
    customerMobile: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    bookedBy: {
      type: String,
      default: "",
    },

    // Vehicle Info
    vehicleType: String,
    sharingType: String,
    vehicleNumber: {
      type: String,
      required: true,
    },
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    color: { type: String, default: "" },

    // Trip Info
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

    // Seats
    seats: [
      {
        type: String,
      },
    ],
    totalSeatsBooked: {
      type: Number,
      default: 0,
    },

    // Pricing
    basePrice: { type: Number, default: 0 },   // price before GST
    gstRate: { type: Number, default: 0 },      // GST % (renamed from gstPrice for clarity — gstPrice kept for backward compat)
    gstPrice: { type: Number, default: 0 },     // GST % (backward compat)
    gstAmount: { type: Number, default: 0 },    // actual GST in INR
    price: { type: Number, default: 0 },        // final price (base + gst)

    // Payment
    paymentMethod: {
      type: String,
      enum: ["Online", "Offline", "Cash", "UPI", "Card"],
      default: "Online",
    },
    paymentId: { type: String, default: "" },
    isPaid: { type: Boolean, default: false },

    // Status
    bookingStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Confirmed", "Cancelled", "Failed"],
    },
    cancellationReason: { type: String, default: "" },
    cancelledAt: { type: Date },

    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
const CarBooking = mongoose.model("CarBooking", travelBookingSchema);
module.exports = CarBooking;
