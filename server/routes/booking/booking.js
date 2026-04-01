const express = require('express');
const router = express.Router();
const { upload } = require('../../aws/upload');
const bookingController = require('../../controllers/booking/booking');
const auth = require('../../authentication/auth');
router.post('/booking/:userId/:hotelId', upload, bookingController.createBooking); // site
router.get('/booking/:bookingId', bookingController.getBookingById);
router.put('/updatebooking/:bookingId', bookingController.updateBooking);
router.post('/booking/:bookingId/cancel/send-otp', bookingController.sendCancellationOtp);
router.post('/booking/:bookingId/cancel/verify',  bookingController.verifyCancellationOtpAndCancel);
router.get('/get/all/users-filtered/booking/by',  bookingController.getAllFilterBookings);
router.get('/get/all/filtered/booking/by/query', bookingController.getAllFilterBookingsByQuery);
router.get('/partner/:partnerId/hotel-bookings', bookingController.getPartnerHotelBookings);
router.get('/get-all/bookings-count', bookingController.getBookingCounts);
router.get('/get-all/sell-count', bookingController.getTotalSell);

module.exports = router;
