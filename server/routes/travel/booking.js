const express = require('express');
const {
  bookCar,
  confirmTravelBooking,
  getTravelBookings,
  updateBooking,
  getBookingsOfOwner,
  getBookingBookedBy,
  changeBookingStatus,
  getCarBookingByUserId,
  verifyPickupCode,
  verifyDropCode,
} = require('../../controllers/travel/booking');
const router = express.Router();

router.post("/create-travel/booking", bookCar);
router.patch("/confirm-booking/:id", confirmTravelBooking);
router.patch("/change-booking-status/:id",changeBookingStatus)
router.post("/verify-pickup-code/:id", verifyPickupCode);
router.post("/verify-drop-code/:id", verifyDropCode);
router.get('/get-travels-bookings', getTravelBookings)
router.patch('/update-travel/booking',updateBooking)
router.get("/get-bookings-by/owner/:ownerId",getBookingsOfOwner)
router.post("/get-bookings-by/bookedBy",getBookingBookedBy);
router.get("/get-bookings-by/user/:userId", getCarBookingByUserId);

module.exports = router;
