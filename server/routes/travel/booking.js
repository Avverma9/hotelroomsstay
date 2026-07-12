const express = require('express');
const auth = require('../../authentication/auth');
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
  getBookingsByCar,
  getRideHistoryByCar,
} = require('../../controllers/travel/booking');
const router = express.Router();

router.post("/create-travel/booking", bookCar);
router.patch("/confirm-booking/:id", confirmTravelBooking);
router.patch("/change-booking-status/:id", auth, changeBookingStatus)
router.post("/verify-pickup-code/:id", auth, verifyPickupCode);
router.post("/verify-drop-code/:id", auth, verifyDropCode);
router.get('/get-travels-bookings', auth, getTravelBookings)
router.patch('/update-travel/booking', auth, updateBooking)
router.get("/get-bookings-by/owner/:ownerId", auth, getBookingsOfOwner)
router.post("/get-bookings-by/bookedBy", auth, getBookingBookedBy);
router.get("/get-bookings-by/user/:userId", auth, getCarBookingByUserId);
router.get("/get-bookings-by/car/:carId", auth, getBookingsByCar);
router.get("/get-ride-history/by-car/:carId", auth, getRideHistoryByCar);

module.exports = router;
