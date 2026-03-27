const mongoose = require("mongoose");

const BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Failed",
];

const RIDE_STATUSES = [
  "AwaitingConfirmation",
  "AwaitingPickup",
  "InProgress",
  "Completed",
  "Cancelled",
  "Failed",
];

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
    paymentConfirmedAt: { type: Date },

    // Status
    bookingStatus: {
      type: String,
      default: "Pending",
      enum: BOOKING_STATUSES,
    },
    rideStatus: {
      type: String,
      default: "AwaitingConfirmation",
      enum: RIDE_STATUSES,
    },
    confirmedAt: { type: Date },
    cancellationReason: { type: String, default: "" },
    cancelledAt: { type: Date },
    rideStartedAt: { type: Date },
    rideCompletedAt: { type: Date },

    assignedDriverId: {
      type: String,
      default: "",
      trim: true,
    },
    assignedDriverName: {
      type: String,
      default: "",
      trim: true,
    },

    pickupCode: {
      type: String,
      required: true,
    },
    dropCode: {
      type: String,
      required: true,
    },
    pickupCodeVerifiedAt: { type: Date },
    dropCodeVerifiedAt: { type: Date },

    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
const CarBooking = mongoose.model("CarBooking", travelBookingSchema);
module.exports = CarBooking;
