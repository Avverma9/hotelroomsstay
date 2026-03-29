/**
 * Payment Routes — shared across Hotel, Travel, and Tour bookings
 *
 * Base path (registered in routes/index.js): /payment
 *
 * POST  /payment/create-order/:type/:bookingId   → create PhonePe checkout order
 * POST  /payment/verify/:type/:bookingId         → verify payment status (after redirect)
 * POST  /payment/callback                        → PhonePe S2S server callback
 * PATCH /payment/mark-paid/:type/:bookingId      → offline/cash payment (admin only)
 *
 * :type = hotel | travel | tour
 */

const express = require("express");
const router = express.Router();
const auth = require("../../authentication/auth");
const {
  createPaymentOrder,
  verifyPayment,
  handlePhonePeCallback,
  markOfflinePaid,
} = require("../../controllers/payment/payment");

// Create PhonePe checkout order (user-facing)
router.post("/create-order/:type/:bookingId", createPaymentOrder);

// Verify payment status after user returns from PhonePe page (user-facing)
router.post("/verify/:type/:bookingId", verifyPayment);

// PhonePe S2S server-to-server callback (no auth — validated via signature)
router.post("/callback", handlePhonePeCallback);

// Mark offline/cash payment as collected (admin only)
router.patch("/mark-paid/:type/:bookingId", auth, markOfflinePaid);

module.exports = router;
