const express = require("express");
const router = express.Router();
const {
  newUserCoupon,
  ApplyUserCoupon,
  GetAllUserCoupons,
  getUserDefaultCoupon,
} = require("../../controllers/coupons/userCoupon");
//=====================================Customer/User coupon==================================

router.post("/coupon/create-a-new/coupon/user", newUserCoupon); // on panel
router.patch(
  "/apply/a/coupon-to-room/user",
  ApplyUserCoupon, // on panel
);
router.get("/coupon/get/all/user", GetAllUserCoupons); // on panel
router.post("/get-default-coupon/user", getUserDefaultCoupon); // on panel

module.exports = router;
