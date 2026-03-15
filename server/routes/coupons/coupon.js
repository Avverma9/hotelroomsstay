const express = require("express");
const router = express.Router();
const {
  createCoupon,
  applyCoupon,
  getCoupons,
  getUserDefaultCoupon,
} = require("../../controllers/coupons/coupon");

router.post("/coupon", createCoupon);
router.patch("/coupon/apply", applyCoupon);
router.get("/coupon", getCoupons);
router.post("/coupon/user-default", getUserDefaultCoupon);

module.exports = router;
