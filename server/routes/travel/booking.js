const express = require('express');
const {
  bookCar,
  getTravelBookings,
  updateBooking,
  getBookingsOfOwner,
  getBookingBookedBy,
  changeBookingStatus,
  getCarBookingByUserId,
} = require('../../controllers/travel/booking');
const router = express.Router();

router.post("/create-travel/booking", bookCar);
router.patch("/change-booking-status/:id",changeBookingStatus)
router.get('/get-travels-bookings', getTravelBookings)
router.patch('/update-travel/booking',updateBooking)
router.get("/get-bookings-by/owner/:ownerId",getBookingsOfOwner)
router.post("/get-bookings-by/bookedBy",getBookingBookedBy);
router.get("/get-bookings-by/user/:userId", getCarBookingByUserId);

module.exports = router;
