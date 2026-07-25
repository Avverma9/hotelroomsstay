/**
 * Booking Business Rules Engine
 * Centralized logic for booking status determination and validation
 */

const bookingModel = require("../models/booking/booking");

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
 * @returns {Promise<{isDuplicate: boolean, reason: string|null, shouldBePending: boolean}>}
 */
async function checkDuplicateBooking(userId, userMobile, userEmail, currentHotelCity, currentHotelId) {
  try {
    // Find active bookings with same mobile or email
    const activeBookings = await bookingModel.find({
      $or: [
        { "user.mobile": userMobile },
        { "user.email": userEmail }
      ],
      bookingStatus: { $nin: ["Cancelled", "Failed", "Checked-out"] }
    }).lean();

    if (!activeBookings || activeBookings.length === 0) {
      return { isDuplicate: false, reason: null, shouldBePending: false };
    }

    // Check for same city different hotel
    const sameCityDifferentHotel = activeBookings.some(
      booking => 
        String(booking.hotelDetails?.hotelCity || booking.hotelDetails?.destination || "").trim().toLowerCase() === 
        String(currentHotelCity || "").trim().toLowerCase() &&
        String(booking.hotelDetails?.hotelId || "") !== String(currentHotelId || "")
    );

    if (sameCityDifferentHotel) {
      return {
        isDuplicate: true,
        reason: "Duplicate booking detected: Active booking exists in the same city at a different hotel",
        shouldBePending: true
      };
    }

    // Different city - allow booking (Confirmed)
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

  // Rule 1: Max 3 rooms or nights - above that goes to Pending
  if (numRooms > 3) {
    reasons.push(`${numRooms} rooms booked (exceeds 3 rooms limit)`);
  }
  
  if (nights > 3) {
    reasons.push(`${nights} nights stay (exceeds 3 nights limit)`);
  }

  // Rule 2: Check for duplicate bookings (same mobile/email)
  const duplicateCheck = await checkDuplicateBooking(
    userId, 
    userMobile, 
    userEmail, 
    hotelCity, 
    hotelId
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

  // For offline bookings from panel, always Confirmed (unless rules force Pending)
  const isOfflineBooking = 
    String(paymentMode || "").trim().toLowerCase() === "offline" ||
    String(bookingSource || "").trim().toLowerCase() === "panel";

  if (isOfflineBooking && reasons.length === 0) {
    finalStatus = "Confirmed";
  }

  // For online bookings, start as Pending with payment timer
  if (!isOfflineBooking || reasons.length > 0) {
    finalStatus = "Pending";
    const timeoutMs = calculatePaymentTimeout(checkInDate);
    autoCancelAt = new Date(Date.now() + timeoutMs);
  }

  const pendingReason = reasons.length > 0 
    ? reasons.join("; ")
    : finalStatus === "Pending" 
      ? "Awaiting payment confirmation" 
      : null;

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
  
  // If check-in date has passed and customer hasn't checked in
  return now > checkInDate;
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
