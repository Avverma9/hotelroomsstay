const express = require('express')
const router = express.Router();
const couponController = require('../../controllers/booking/coupon')
router.post("/coupon/create-a-new/coupon", couponController.newCoupon);           // on panel
router.patch(
  "/apply/a/coupon-to-room",
  couponController.ApplyCoupon // on panel
);
router.get("/coupon/get/all", couponController.GetAllCoupons); // on panel
router.get("/valid-coupons",couponController.GetValidCoupons) // on panel
 
router.patch(
  "/remove/coupon/from/hotel-automatically",
  couponController.removeOffersAutomatically // on panel
);

module.exports = router