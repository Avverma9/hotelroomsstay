const mongoose = require("mongoose");
const moment = require("moment");

// Function to generate a random 6-digit coupon code
const generateCouponCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const partnerCouponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    unique: true,
    length: 6,
  },
  quantity: Number,
  userIds: [String],
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
  roomId: [String],
  hotelId: [String],
});

// Middleware to generate a coupon code before saving
partnerCouponSchema.pre("save", function (next) {
  if (!this.couponCode) {
    this.couponCode = generateCouponCode();
  }
  next();
});

// Method to check if the coupon is still valid
partnerCouponSchema.methods.isValid = function () {
  return moment().isBefore(moment(this.validity));
};

// Create the model
const PartnerCoupon = mongoose.model("PartnerCoupon", partnerCouponSchema);

module.exports = PartnerCoupon;
