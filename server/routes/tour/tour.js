const express = require("express");
const {
  createTour,
  getTourById,
  filterTours,
  getAllTours,
  updateTour,
  getRequestedTour,
  getTourByOwner,
  changeTourImage,
  deleteTourImage,
  getAllVisitingPlaces,
} = require("../../controllers/tour/tour");
const { upload } = require("../../aws/upload");
const {
  createBooking,
  getBookings,
  getBookingByUser,
  getBookingsByBookingId,
  getTotalSell,
  updateBooking,
  deleteBooking,
  getByAgencyEmail,
  getVehicleSeats,
} = require("../../controllers/tour/booking");

const router = express.Router();

// ── Tour Routes ──────────────────────────────────────────
router.post("/create-tour", upload, createTour);
router.get("/get-tour/:id", getTourById);
router.get("/filter-tour/by-query", filterTours);
router.get("/get-all-tours", getAllTours);
router.get("/get-requests", getRequestedTour);
router.get("/get-tour/by-owner/query", getTourByOwner);
router.patch("/update-tour/data/:id", updateTour);
router.patch("/update-tour-image/:id", upload, changeTourImage);
router.delete("/delete-tour-image/:id", deleteTourImage);
router.get("/tours/:tourId/vehicles/:vehicleId/seats", getVehicleSeats);
router.get("/tours/visiting-places", getAllVisitingPlaces);

// ── Booking Routes ───────────────────────────────────────
router.post("/tour-booking/create-tour-booking", createBooking);
router.get("/tour-booking/get-bookings", getBookings);
router.get("/tour-booking/get-bookings/by-agency-email/:email", getByAgencyEmail);
router.get("/tour-booking/get-users-booking", getBookingByUser);
router.get("/tour-booking/get-users-booking/by/:bookingId", getBookingsByBookingId);
router.get("/tour-booking/get-total-sell", getTotalSell);
router.patch("/tour-booking/update-tour-booking/:bookingId", updateBooking);
router.patch("/tour-booking/delete-tour-booking/:bookingId", deleteBooking);

module.exports = router;
