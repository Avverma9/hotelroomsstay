const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: false,
      unique: true,
    },
    userId: {
      type: String,
      required: false,
    },
    isPartialBooking: {
      type: Boolean,
      default: false,
    },
    partialAmount: {
      type: Number,
      default: 0,
    },
    gstPrice: Number,
    user: {
      type: Object,
      required: false,
    },
    createdBy: {
      type: Object,
      required: false,
    },
    hotelDetails: {
      type: Object,
      required: false,
    },
    checkInDate: {
      type: String,
    },
    checkOutDate: {
      type: String,
    },
    checkInTime: {
      type: String,
    },
    checkOutTime: {
      type: String,
    },
    pm: String,
    bookingSource: String,
    guests: {
      type: Number,
      required: false,
    },
    guestDetails: 
      {
        fullName: String,
        mobile: String,
        email: String,
      },

    foodDetails: [
      {
        foodId: String,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    roomDetails: [
      {
        roomId: String,
        type: { type: String },
        bedTypes: { type: String },
        price: { type: Number },
      },
    ],
    numRooms: {
      type: Number,
      required: false,
    },
    couponCode: String,
    discountPrice: Number,
    price: {
      type: Number,
      required: false,
    },
    bookingStatus: {
      type: String,
      enum: [
        "Confirmed",
        "Failed",
        "Cancelled",
        "Checked-in",
        "Checked-out",
        "No-Show",
        "Pending",
      ],
      default: "Confirmed",
    },
    cancellationReason: String,
    cardDetails: {
      type: String,
      default: null,
    },
    upiId: {
      type: String,
      default: null,
    },
    destination: {
      type: String,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    // Review tracking
    hasReview: {
      type: Boolean,
      default: false,
    },
    reviewId: {
      type: String,
      default: null,
    },
    reviewGivenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      currentTime: () => {
        const currentDate = new Date();
        const offset = 330 * 60 * 1000; // 5 hours 30 minutes
        return new Date(currentDate.getTime() + offset);
      },
    },
  },
);

// Add indexes for performance optimization
bookingSchema.index({ bookingStatus: 1, createdAt: 1 }); // For auto-cancel query
bookingSchema.index({ hotelId: 1, checkInDate: 1, checkOutDate: 1 }); // For availability check
bookingSchema.index({ userId: 1 }); // For user bookings
bookingSchema.index({ bookingStatus: 1 }); // For status filtering

module.exports = mongoose.model("Booking", bookingSchema);
