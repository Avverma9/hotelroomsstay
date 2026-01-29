const mongoose = require("mongoose");
const moment = require("moment");

// Function to generate a random 6-digit coupon code
const generateCouponCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const userCouponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    unique: true,
    length: 6,
  },
  quantity: Number,
  userId: String,
  assignedTo: String,
  validity: {
    type: Date,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  couponName: {
    type: String,
  },
  discountPrice: {
    type: Number,
  },
  roomId: String,
  hotelId: String,
});

// Middleware to generate a coupon code before saving
userCouponSchema.pre("save", function (next) {
  if (!this.couponCode) {
    this.couponCode = generateCouponCode();
  }
  next();
});

// Method to check if the coupon is still valid
userCouponSchema.methods.isValid = function () {
  return moment().isBefore(moment(this.validity));
};

// Create the model
const UserCoupon = mongoose.model("UserCoupon", userCouponSchema);

module.exports = UserCoupon;
