/**
 * Booking Business Rules Engine
 * Centralized logic for booking status determination and validation
 */

const bookingModel = require("../models/booking/booking");
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Calculate payment timeout based on check-in date
 * @param {Date} checkInDate - Booking check-in date
 * @returns {number} - Timeout in milliseconds
 */
function calculatePaymentTimeout(checkInDate) {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

  // Rule: Payment timer based on booking advance
  if (daysUntilCheckIn >= 5) {
    // 5-7 days before: 48 hours payment window
    return 48 * 60 * 60 * 1000; // 48 hours
  } else if (daysUntilCheckIn >= 2) {
    // 2-3 days before: 24 hours payment window
    return 24 * 60 * 60 * 1000; // 24 hours
  } else {
    // 1 day before: 6 hours payment window
    return 6 * 60 * 60 * 1000; // 6 hours
  }
}

/**
 * Check for duplicate bookings from same user
 * @param {string} userId - User ID
 * @param {string} userMobile - User mobile number
 * @param {string} userEmail - User email
 * @param {string} currentHotelCity - Current booking hotel city
 * @param {string} currentHotelId - Current booking hotel ID
 * @param {Date} currentCheckInDate - Current booking check-in date
 * @returns {Promise<{isDuplicate: boolean, reason: string|null, shouldBePending: boolean}>}
 */
const normalizeContact = (value) => String(value || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim().toLowerCase();

async function checkDuplicateBooking(userId, userMobile, userEmail, currentHotelCity, currentHotelId, currentCheckInDate, currentCheckOutDate) {
  try {
    const mobile = normalizeContact(userMobile);
    const email = normalizeContact(userEmail);
    const contactFilters = [];
    if (userId) contactFilters.push({ "user.userId": String(userId) });
    if (mobile) contactFilters.push({ "user.mobile": { $regex: `^${escapeRegex(mobile)}$`, $options: "i" } });
    if (email) contactFilters.push({ "user.email": { $regex: `^${escapeRegex(email)}$`, $options: "i" } });

    if (contactFilters.length === 0) {
      return { isDuplicate: false, reason: null, shouldBePending: false };
    }

    // Only these statuses represent an existing booking for this rule.
    const activeBookings = await bookingModel.find({
      $and: [
        { $or: contactFilters },
        { bookingStatus: { $in: ["Confirmed", "Checked-in"] } }
      ]
    }).lean();

    if (!activeBookings || activeBookings.length === 0) {
      return { isDuplicate: false, reason: null, shouldBePending: false };
    }

    const currentCheckIn = new Date(currentCheckInDate);
    const currentCheckOut = new Date(currentCheckOutDate);
    const currentCity = normalizeText(currentHotelCity);
    if (Number.isNaN(currentCheckIn.getTime()) || Number.isNaN(currentCheckOut.getTime()) || !currentCity) {
      return { isDuplicate: false, reason: null, shouldBePending: false };
    }

    // Check for overlapping stays in the same city.
    for (const booking of activeBookings) {
      const bookingCheckIn = new Date(booking.checkInDate);
      const bookingCheckOut = new Date(booking.checkOutDate);
      const bookingCity = normalizeText(booking.hotelDetails?.hotelCity || booking.hotelDetails?.destination);

      const isSameBookingSlot = currentCity === bookingCity &&
        !Number.isNaN(bookingCheckIn.getTime()) &&
        !Number.isNaN(bookingCheckOut.getTime()) &&
        bookingCheckIn < currentCheckOut &&
        bookingCheckOut > currentCheckIn;

      if (isSameBookingSlot) {
        return {
          isDuplicate: true,
          reason: "An active booking already exists for this customer in the same city during overlapping dates.",
          shouldBePending: true
        };
      }
    }

    // Different city bookings - always allowed
    return { isDuplicate: false, reason: null, shouldBePending: false };
  } catch (error) {
    console.error("Error checking duplicate booking:", error);
    // On error, allow booking but flag for review
    return { 
      isDuplicate: false, 
      reason: "Unable to verify duplicate bookings", 
      shouldBePending: false 
    };
  }
}

/**
 * Determine booking status based on business rules
 * @param {Object} bookingData - Booking information
 * @returns {Promise<{status: string, reason: string|null, autoCancelAt: Date|null}>}
 */
async function determineBookingStatus(bookingData) {
  const {
    numRooms = 1,
    nights = 1,
    userId,
    userMobile,
    userEmail,
    hotelCity,
    hotelId,
    checkInDate,
    paymentMode = "online",
    bookingSource = ""
  } = bookingData;

  const reasons = [];

  // Large bookings require review even when this is the user's first booking.
  // Exactly 3 rooms / 3 nights remain eligible for normal confirmation.
  if (Number(numRooms) > 3) {
    reasons.push(`${numRooms} rooms booked (more than 3 rooms require approval)`);
  }
  if (Number(nights) > 3) {
    reasons.push(`${nights} nights stay (more than 3 nights require approval)`);
  }

  // Also check for a same-user, same-city, overlapping confirmed stay.
  const duplicateCheck = await checkDuplicateBooking(
    userId, 
    userMobile, 
    userEmail, 
    hotelCity, 
    hotelId,
    checkInDate,
    bookingData.checkOutDate
  );

  if (duplicateCheck.shouldBePending) {
    reasons.push(duplicateCheck.reason);
  }

  // Determine final status
  let finalStatus = "Confirmed";
  let autoCancelAt = null;

  // If any rule triggered, mark as Pending
  if (reasons.length > 0) {
    finalStatus = "Pending";
  }

  // A normal booking is confirmed immediately. Pending is reserved for
  // duplicate/bulk/long-stay review, regardless of payment mode. These
  // bookings must remain available for admin/hotel approval, so they do not
  // receive the payment auto-cancel timer.

  const pendingReason = reasons.length > 0 ? reasons.join("; ") : null;

  return {
    status: finalStatus,
    reason: pendingReason,
    autoCancelAt
  };
}

/**
 * Validate status transition based on user role
 * @param {string} currentStatus - Current booking status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - User role (hotel_partner, admin, developer, user)
 * @returns {Object} - {allowed: boolean, reason: string|null}
 */
function validateStatusTransition(currentStatus, newStatus, userRole) {
  const role = String(userRole || "").trim().toLowerCase();

  // Admin and Developer can do anything
  if (["admin", "developer"].includes(role)) {
    return { allowed: true, reason: null };
  }

  // Hotel partner restrictions
  if (role === "hotel_partner" || role === "partner") {
    if (currentStatus === "Pending" && newStatus === "Confirmed") {
      return { allowed: true, reason: null };
    }

    // Hotel can only change Confirmed → Checked-in or No-Show
    if (currentStatus === "Confirmed") {
      if (["Checked-in", "No-Show"].includes(newStatus)) {
        return { allowed: true, reason: null };
      }
      if (newStatus === "Cancelled") {
        return { 
          allowed: false, 
          reason: "Hotels cannot cancel Confirmed bookings. Only Check-in or mark as No-Show is allowed." 
        };
      }
    }

    // Hotel can only change Checked-in → Checked-out
    if (currentStatus === "Checked-in") {
      if (newStatus === "Checked-out") {
        return { allowed: true, reason: null };
      }
      if (newStatus === "Cancelled") {
        return { 
          allowed: false, 
          reason: "Cannot cancel after check-in. Only checkout is allowed." 
        };
      }
      return { 
        allowed: false, 
        reason: "After check-in, only checkout is allowed." 
      };
    }

    // Hotel cannot modify other statuses
    return { 
      allowed: false, 
      reason: "Hotels can only manage Confirmed (→ Checked-in/No-Show) and Checked-in (→ Checked-out) bookings." 
    };
  }

  // Regular users can only cancel their own Pending/Confirmed bookings
  if (role === "user" || role === "") {
    if (["Pending", "Confirmed"].includes(currentStatus) && newStatus === "Cancelled") {
      return { allowed: true, reason: null };
    }
    return { 
      allowed: false, 
      reason: "Users can only cancel Pending or Confirmed bookings." 
    };
  }

  // Default deny
  return { allowed: false, reason: "Insufficient permissions to update booking status." };
}

/**
 * Check if booking should be marked as No-Show
 * @param {Object} booking - Booking object
 * @returns {boolean}
 */
function shouldMarkAsNoShow(booking) {
  if (booking.bookingStatus !== "Confirmed") {
    return false;
  }

  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);
  
  // Add grace period: Only mark as no-show after check-in date + 25 hours
  // This provides buffer and prevents same-day bookings from being immediately marked as no-show
  const gracePeriodHours = 25; // 25 hours grace period after check-in date
  const noShowThreshold = new Date(checkInDate.getTime() + (gracePeriodHours * 60 * 60 * 1000));
  
  // If check-in date + grace period has passed and customer hasn't checked in
  return now > noShowThreshold;
}

/**
 * Get payment timeout description
 * @param {Date} checkInDate - Check-in date
 * @returns {string}
 */
function getPaymentTimeoutDescription(checkInDate) {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

  if (daysUntilCheckIn >= 5) {
    return "48 hours (booking made 5-7 days in advance)";
  } else if (daysUntilCheckIn >= 2) {
    return "24 hours (booking made 2-3 days in advance)";
  } else {
    return "6 hours (booking made 1 day in advance)";
  }
}

module.exports = {
  calculatePaymentTimeout,
  checkDuplicateBooking,
  determineBookingStatus,
  validateStatusTransition,
  shouldMarkAsNoShow,
  getPaymentTimeoutDescription
};
