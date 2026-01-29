const mongoose = require("mongoose");
const moment = require("moment");

// Function to generate a random 6-digit coupon code
const generateCouponCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    unique: true,
    length: 6,
  },
  quantity: Number,
  validity: {
    type: Date,
    required: true,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  couponName: {
    type: String,
    required: true,
  },
  discountPrice: {
    type: Number,
    required: true,
  },
  roomId: [String],
  hotelId: [String],
});

// Middleware to generate a coupon code before saving
couponSchema.pre("save", function (next) {
  if (!this.couponCode) {
    this.couponCode = generateCouponCode();
  }
  next();
});

// Method to check if the coupon is still valid
couponSchema.methods.isValid = function () {
  return moment().isBefore(moment(this.validity));
};

// Create the model
const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
