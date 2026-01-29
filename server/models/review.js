const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userName: String,
  userImage: String,
  hotelName: String,
  hotelImage: String,
  userId: String,
  hotelId: String,
  bookingId: String, // Link to booking
  comment: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Detailed ratings (optional)
  cleanliness: { type: Number, min: 1, max: 5 },
  service: { type: Number, min: 1, max: 5 },
  valueForMoney: { type: Number, min: 1, max: 5 },
  location: { type: Number, min: 1, max: 5 },
  
  isVerifiedBooking: {
    type: Boolean,
    default: false, // true if user actually booked
  },
  adminResponse: String, // Hotel can respond
  adminResponseDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
reviewSchema.index({ hotelId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
