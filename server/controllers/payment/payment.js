/**
 * Payment Controller — Hotel, Travel, Tour
 *
 * Handles PhonePe online payments and offline cash collection for all three
 * booking types from a single shared module.
 *
 * Routes registered:
 *   POST   /payment/create-order/:type/:bookingId     → initiate PhonePe checkout
 *   POST   /payment/verify/:type/:bookingId           → verify via status check or S2S callback
 *   POST   /payment/callback                          → PhonePe S2S server callback
 *   PATCH  /payment/mark-paid/:type/:bookingId        → offline/cash (admin only)
 */

const mongoose = require("mongoose");
const {
  createPhonePeOrder,
  getPhonePeOrderStatus,
  validatePhonePeCallback,
  buildMerchantOrderId,
} = require("../../utils/phonepe");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

// ── Models ───────────────────────────────────────────────
const HotelBooking = require("../../models/booking/booking");
const CarBooking   = require("../../models/travel/carBooking");
const TourBooking  = require("../../models/tour/booking");

const VALID_TYPES = new Set(["hotel", "travel", "tour"]);

// ── Helpers ──────────────────────────────────────────────

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

/**
 * Fetch booking document by type + ID.
 * Returns { booking, type } or throws.
 */
async function fetchBooking(type, bookingId) {
  switch (type) {
    case "hotel":
      return HotelBooking.findById(bookingId);
    case "travel":
      return CarBooking.findById(bookingId);
    case "tour":
      return TourBooking.findById(bookingId);
    default:
      return null;
  }
}

/**
 * Get the amount in paise for a booking, regardless of type.
 */
function getAmountInPaise(type, booking) {
  switch (type) {
    case "hotel":
      return Math.round((booking.price || 0) * 100);
    case "travel":
      return Math.round((booking.price || 0) * 100);
    case "tour":
      return Math.round((booking.totalAmount || 0) * 100);
    default:
      return 0;
  }
}

/**
 * Get a human-readable booking reference.
 */
function getBookingRef(type, booking) {
  switch (type) {
    case "hotel":  return booking.bookingId;
    case "travel": return booking.bookingId;
    case "tour":   return booking.bookingCode;
    default:       return String(booking._id);
  }
}

/**
 * Get userId from booking.
 */
function getBookingUserId(type, booking) {
  switch (type) {
    case "hotel":  return String(booking.user?.userId || booking.userId || "");
    case "travel": return String(booking.userId || "");
    case "tour":   return String(booking.userId || "");
    default:       return "";
  }
}

/**
 * Check if a booking is already paid.
 */
function isAlreadyPaid(type, booking) {
  switch (type) {
    case "hotel":  return Boolean(booking.isPaid);
    case "travel": return Boolean(booking.isPaid);
    case "tour":   return Boolean(booking.payment?.isPaid || booking.payment?.paidAt);
    default:       return false;
  }
}

/**
 * Get stored phonepeOrderId from the booking.
 */
function getStoredPhonepeOrderId(type, booking) {
  switch (type) {
    case "hotel":  return booking.phonepeOrderId;
    case "travel": return booking.phonepeOrderId;
    case "tour":   return booking.payment?.phonepeOrderId || booking.payment?.orderId;
    default:       return "";
  }
}

/**
 * Write back phonepeOrderId when creating an order.
 */
async function savePhonepeOrderId(type, booking, merchantOrderId) {
  switch (type) {
    case "hotel":
      booking.phonepeOrderId = merchantOrderId;
      await booking.save();
      break;
    case "travel":
      booking.phonepeOrderId = merchantOrderId;
      await booking.save();
      break;
    case "tour":
      booking.payment = {
        ...(booking.payment || {}),
        provider: "phonepe",
        mode: "online",
        orderId: merchantOrderId,
        phonepeOrderId: merchantOrderId,
      };
      await booking.save();
      break;
  }
}

/**
 * Mark booking as paid after successful PhonePe payment.
 */
async function markBookingPaid(type, booking, { transactionId } = {}) {
  const now = new Date();
  switch (type) {
    case "hotel":
      booking.isPaid = true;
      booking.paymentConfirmedAt = now;
      booking.bookingStatus = "Confirmed";
      break;
    case "travel":
      booking.isPaid = true;
      booking.paymentConfirmedAt = now;
      booking.paymentId = transactionId || "";
      if (booking.bookingStatus === "Pending") {
        booking.bookingStatus = "Confirmed";
        booking.rideStatus = "Available";
        booking.confirmedAt = now;
      }
      break;
    case "tour":
      booking.payment = {
        ...(booking.payment || {}),
        isPaid: true,
        paymentId: transactionId || "",
        paidAt: now,
      };
      if (booking.status === "pending" || booking.status === "held") {
        booking.status = "confirmed";
      }
      break;
  }
  await booking.save();
}

/**
 * Mark booking as paid offline (cash/admin).
 */
async function markBookingOfflinePaid(type, booking, { collectedBy } = {}) {
  const now = new Date();
  switch (type) {
    case "hotel":
      booking.isPaid = true;
      booking.paymentMode = "offline";
      booking.paymentConfirmedAt = now;
      booking.bookingStatus = "Confirmed";
      break;
    case "travel":
      booking.isPaid = true;
      booking.paymentMode = "offline";
      booking.paymentConfirmedAt = now;
      booking.paymentId = String(collectedBy || "offline").trim();
      if (booking.bookingStatus === "Pending") {
        booking.bookingStatus = "Confirmed";
        booking.rideStatus = "Available";
        booking.confirmedAt = now;
      }
      break;
    case "tour":
      booking.payment = {
        ...(booking.payment || {}),
        provider: "offline",
        mode: "offline",
        isPaid: true,
        collectedBy: String(collectedBy || "").trim(),
        paidAt: now,
      };
      if (booking.status === "pending" || booking.status === "held") {
        booking.status = "confirmed";
      }
      break;
  }
  await booking.save();
}

async function sendPaymentNotification(type, booking, { message, eventType } = {}) {
  const userId = getBookingUserId(type, booking);
  const ref = getBookingRef(type, booking);
  if (!userId) return;
  await createUserNotificationSafe({
    name: "Payment Confirmed",
    message: message || `Payment for your ${type} booking ${ref} is confirmed.`,
    path: `/app/bookings/${type}`,
    eventType: eventType || `${type}_payment_confirmed`,
    metadata: { ref, type },
    userIds: [userId],
  });
}

// ══════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ══════════════════════════════════════════════════════════

/**
 * POST /payment/create-order/:type/:bookingId
 * Creates a PhonePe checkout order for the given booking.
 * Returns { checkoutUrl } which the frontend should redirect the user to.
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { type, bookingId } = req.params;
    const { redirectUrl } = req.body;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: "Invalid booking type. Use hotel | travel | tour" });
    }
    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid bookingId" });
    }
    if (!redirectUrl) {
      return res.status(400).json({ success: false, message: "redirectUrl is required" });
    }

    const booking = await fetchBooking(type, bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: `${type} booking not found` });
    }
    if (isAlreadyPaid(type, booking)) {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    const mode = type === "tour"
      ? (booking.payment?.mode || "online")
      : (booking.paymentMode || "online");

    if (mode === "offline") {
      return res.status(400).json({
        success: false,
        message: "This booking is set to offline payment. Use /payment/mark-paid instead",
      });
    }

    const cancelledStatuses = new Set(["Cancelled", "Failed", "cancelled", "failed"]);
    const bookingStatusField = type === "tour" ? booking.status : booking.bookingStatus;
    if (cancelledStatuses.has(bookingStatusField)) {
      return res.status(400).json({
        success: false,
        message: "Cannot create payment order for a cancelled or failed booking",
      });
    }

    const amountInPaise = getAmountInPaise(type, booking);
    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ success: false, message: "Booking amount is too low to process" });
    }

    const merchantOrderId = buildMerchantOrderId(type.toUpperCase(), String(booking._id));
    const { checkoutUrl } = await createPhonePeOrder({
      merchantOrderId,
      amountInPaise,
      redirectUrl,
    });

    await savePhonepeOrderId(type, booking, merchantOrderId);

    return res.status(200).json({
      success: true,
      checkoutUrl,
      merchantOrderId,
      bookingId: String(booking._id),
      bookingRef: getBookingRef(type, booking),
      amountInPaise,
    });
  } catch (error) {
    console.error("createPaymentOrder error:", error);
    return res.status(500).json({ success: false, message: "Failed to create payment order", error: error.message });
  }
};

/**
 * POST /payment/verify/:type/:bookingId
 * Verifies payment status by calling PhonePe getOrderStatus.
 * Call this after user returns from the PhonePe checkout page.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { type, bookingId } = req.params;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: "Invalid booking type" });
    }
    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid bookingId" });
    }

    const booking = await fetchBooking(type, bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: `${type} booking not found` });
    }
    if (isAlreadyPaid(type, booking)) {
      return res.status(200).json({ success: true, message: "Booking already marked as paid", alreadyPaid: true });
    }

    const merchantOrderId = getStoredPhonepeOrderId(type, booking);
    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: "No PhonePe order found for this booking. Call /payment/create-order first.",
      });
    }

    const { state, raw } = await getPhonePeOrderStatus(merchantOrderId);

    if (state === "COMPLETED") {
      const transactionId = raw?.paymentDetails?.[0]?.transactionId || "";
      await markBookingPaid(type, booking, { transactionId });
      await sendPaymentNotification(type, booking);

      return res.status(200).json({
        success: true,
        message: "Payment verified. Booking confirmed.",
        state,
        bookingRef: getBookingRef(type, booking),
      });
    }

    if (state === "FAILED") {
      return res.status(400).json({
        success: false,
        message: "Payment failed. Please retry.",
        state,
      });
    }

    // PENDING
    return res.status(202).json({
      success: false,
      message: "Payment is still pending. Please wait and retry.",
      state,
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

/**
 * POST /payment/callback
 * PhonePe S2S server-to-server callback endpoint.
 * Register this URL on your PhonePe merchant dashboard.
 *
 * PhonePe sends: Authorization header (SHA-256), JSON body
 */
exports.handlePhonePeCallback = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] || "";
    const bodyString = JSON.stringify(req.body);

    let callbackData;
    try {
      callbackData = validatePhonePeCallback(authHeader, bodyString);
    } catch (validationError) {
      // Invalid signature — reject silently (do not expose internals)
      console.error("PhonePe callback validation failed:", validationError.message);
      return res.status(401).json({ success: false, message: "Invalid callback signature" });
    }

    const { orderId, state, transactionId } = callbackData?.payload || {};

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId missing in callback" });
    }

    // orderId format: PP_<TYPE>_<ID>_<TIMESTAMP>
    const parts = orderId.split("_");
    if (parts.length < 3 || parts[0] !== "PP") {
      return res.status(400).json({ success: false, message: "Unrecognized order ID format" });
    }

    const type = parts[1].toLowerCase(); // hotel | travel | tour
    const dbBookingId = parts[2];

    if (!VALID_TYPES.has(type) || !isValidObjectId(dbBookingId)) {
      return res.status(400).json({ success: false, message: "Cannot resolve booking from orderId" });
    }

    const booking = await fetchBooking(type, dbBookingId);
    if (!booking) {
      // Return 200 so PhonePe doesn't keep retrying for a deleted booking
      return res.status(200).json({ success: true, message: "Booking not found, callback acknowledged" });
    }

    if (isAlreadyPaid(type, booking)) {
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    if (state === "COMPLETED") {
      await markBookingPaid(type, booking, { transactionId: transactionId || "" });
      await sendPaymentNotification(type, booking);
    }

    // Always respond 200 to acknowledge receipt
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("handlePhonePeCallback error:", error);
    // Respond 200 so PhonePe does not retry indefinitely on server errors
    return res.status(200).json({ success: true });
  }
};

/**
 * PATCH /payment/mark-paid/:type/:bookingId
 * Admin-only: mark an offline/cash booking as paid manually.
 * Body: { collectedBy } — name or ID of staff who collected the payment
 */
exports.markOfflinePaid = async (req, res) => {
  try {
    const { type, bookingId } = req.params;
    const { collectedBy } = req.body;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: "Invalid booking type" });
    }
    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid bookingId" });
    }

    const booking = await fetchBooking(type, bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: `${type} booking not found` });
    }
    if (isAlreadyPaid(type, booking)) {
      return res.status(400).json({ success: false, message: "Booking is already marked as paid" });
    }

    const cancelledStatuses = new Set(["Cancelled", "Failed", "cancelled", "failed"]);
    const bookingStatusField = type === "tour" ? booking.status : booking.bookingStatus;
    if (cancelledStatuses.has(bookingStatusField)) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark payment for a cancelled or failed booking",
      });
    }

    await markBookingOfflinePaid(type, booking, { collectedBy });
    await sendPaymentNotification(type, booking, {
      message: `Offline payment for your ${type} booking ${getBookingRef(type, booking)} has been recorded.`,
      eventType: `${type}_payment_confirmed`,
    });

    return res.status(200).json({
      success: true,
      message: `${type} booking marked as offline paid`,
      bookingRef: getBookingRef(type, booking),
    });
  } catch (error) {
    console.error("markOfflinePaid error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};
