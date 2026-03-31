const express = require("express");
const router = express.Router();
const {
  createCoupon,
  applyCoupon,
  getCoupons,
  getUserDefaultCoupon,
  registerCouponUsageOnBooking,
} = require("../../controllers/coupons/coupon");

router.post("/coupon", createCoupon);
router.patch("/coupon/apply", applyCoupon);
router.get("/coupon", getCoupons);
router.post("/coupon/user-default", getUserDefaultCoupon);
router.post("/coupon/register-usage", registerCouponUsageOnBooking);

module.exports = router;
