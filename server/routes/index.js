const express = require('express');

// Import routers
const bookingRouter = require('./booking/booking');
const dashboardRouter = require('./dashboardUser/dashboardUser');
const hotelRouter = require('./hotel/hotel');
const reviewRouter = require('./review');
const userRouter = require('./user');
const carouselRouter = require('./carousel');
const couponRouter = require('./booking/coupon');
const complaintRouter = require('./complaints/complaint');
const monthlyRouter = require('./booking/monthly');
const travelRouter = require('./headerTravel');
const foodRouter = require('./hotel/food');
const roomRouter = require('./hotel/room');
const globalNotificationRouter = require('./notification/global');
const userNotificationRouter = require('./notification/user');
const policyRouter = require('./hotel/policy');
const amenitiesRouter = require('./hotel/amenities');
const bulkRouter = require('./bulkOperation');
const availability = require('./hotel/availability');
const tourRouter = require('./tour/tour');
const carRouter = require('./travel/car');
const carOwnerRouter = require('./travel/carOwner');
const additionalSettings =require("./additional/additional")
const GSTRouter = require('./GST/gst');
const travelBookings = require('./travel/booking');
const couponRouterV2 = require('./coupons/coupon');
const statistics = require("./statistics");
const paymentRouter = require('./payment/payment');
const router = express.Router();

// Define routes with root paths
router.use('/', bookingRouter);
router.use('/', dashboardRouter);
router.use('/', hotelRouter);
router.use('/', reviewRouter);
router.use('/', userRouter);
router.use('/', carouselRouter);
router.use('/', couponRouter);
router.use('/', monthlyRouter);
router.use('/', complaintRouter);
router.use('/', roomRouter);
router.use('/', foodRouter);
router.use('/', travelRouter);
router.use('/', globalNotificationRouter);
router.use('/', userNotificationRouter);
router.use('/', policyRouter);
router.use('/', amenitiesRouter);
router.use('/', bulkRouter);
router.use('/', availability);
router.use('/', tourRouter);
router.use('/gst', GSTRouter);
router.use('/travel', carOwnerRouter);
router.use('/travel', carRouter);
router.use('/travel', travelBookings);
router.use('/coupons', couponRouterV2);
router.use('/additional', additionalSettings);
router.use("/statistics", statistics);
router.use("/payment", paymentRouter);
// router.use('/chatApp',chatApp)

module.exports = router;
