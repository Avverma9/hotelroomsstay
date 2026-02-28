const express = require('express');
const {
    newPartnerCoupon,
    ApplyPartnerCoupon,
    GetAllPartnerCoupons,
} = require('../../controllers/coupons/partnerCoupon');
const router = express.Router()



//===============================Partner coupon=============================================
router.post("/coupon/create-a-new/coupon",newPartnerCoupon );           // on panel
router.patch(
    "/apply/a/coupon-to-room", ApplyPartnerCoupon // on panel
);
router.patch(
    "/coupon/apply-to-hotel-rooms",
    ApplyPartnerCoupon
);
router.get("/coupon/get/all", GetAllPartnerCoupons); // on panel
router.get("/coupon/get/active", GetAllPartnerCoupons);


module.exports = router
