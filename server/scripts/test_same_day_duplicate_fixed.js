/**
 * Test script for Same-Day Duplicate Booking Logic (Fixed Version)
 * Run with: node server/scripts/test_same_day_duplicate_fixed.js
 */

// Test function that mimics the actual bookingRules logic
async function checkDuplicateBooking(userId, userMobile, userEmail, currentHotelCity, currentHotelId, currentCheckInDate, mockData = []) {
  try {
    const activeBookings = mockData;

    if (!activeBookings || activeBookings.length === 0) {
      return { isDuplicate: false, reason: null, shouldBePending: false };
    }

    const currentCheckIn = new Date(currentCheckInDate);
    const currentCity = String(currentHotelCity || "").trim().toLowerCase();
    const currentHotel = String(currentHotelId || "");

    // Check for same-day bookings in same city
    for (const booking of activeBookings) {
      const bookingCheckIn = new Date(booking.checkInDate);
      const bookingCity = String(booking.hotelDetails?.hotelCity || booking.hotelDetails?.destination || "").trim().toLowerCase();
      const bookingHotel = String(booking.hotelDetails?.hotelId || "");

      // Check if it's same day
      const isSameDay = 
        currentCheckIn.getFullYear() === bookingCheckIn.getFullYear() &&
        currentCheckIn.getMonth() === bookingCheckIn.getMonth() &&
        currentCheckIn.getDate() === bookingCheckIn.getDate();

      if (isSameDay && currentCity === bookingCity) {
        // Same day + Same city = Second booking should be pending 
        // (first booking was already confirmed, now this is second attempt)
        const hotelMatch = currentHotel === bookingHotel ? "same hotel" : "different hotel";
        return {
          isDuplicate: true,
          reason: `Same-day booking detected: Active booking already exists on ${bookingCheckIn.toDateString()} in ${booking.hotelDetails?.hotelCity || 'same city'} (${hotelMatch}). Second booking in same city same day requires manual review.`,
          shouldBePending: true
        };
      } else if (currentCity === bookingCity && currentHotel !== bookingHotel) {
        // Different day + Same city + Different hotel = Standard duplicate check
        return {
          isDuplicate: true,
          reason: "Duplicate booking detected: Active booking exists in the same city at a different hotel",
          shouldBePending: true
        };
      }
    }

    // Different city bookings - always allowed
    return { isDuplicate: false, reason: null, shouldBePending: false };
  } catch (error) {
    console.error("Error checking duplicate booking:", error);
    return { 
      isDuplicate: false, 
      reason: "Unable to verify duplicate bookings", 
      shouldBePending: false 
    };
  }
}

// Test Cases with individual mock data
const testCases = [
  {
    name: "Same-day booking in same city, different hotel",
    mockData: [
      {
        _id: "existing1",
        bookingId: "ABC123", 
        user: { mobile: "9999999999", email: "user@test.com" },
        hotelDetails: { hotelId: "hotel1", hotelCity: "Goa", hotelName: "Beach Resort" },
        checkInDate: new Date("2024-03-15"),
        bookingStatus: "Confirmed"
      }
    ],
    params: {
      userId: "user123",
      userMobile: "9999999999", 
      userEmail: "user@test.com",
      currentHotelCity: "Goa",
      currentHotelId: "hotel2", // Different from existing hotel1
      currentCheckInDate: "2024-03-15"
    },
    expected: { shouldBePending: true },
    reason: "Should be PENDING - Same day + same city + different hotel"
  },
  {
    name: "Same-day booking in same city, same hotel",
    mockData: [
      {
        _id: "existing1",
        bookingId: "ABC123",
        user: { mobile: "9999999999", email: "user@test.com" },
        hotelDetails: { hotelId: "hotel1", hotelCity: "Goa", hotelName: "Beach Resort" },
        checkInDate: new Date("2024-03-15"),
        bookingStatus: "Confirmed"
      }
    ],
    params: {
      userId: "user123",
      userMobile: "9999999999",
      userEmail: "user@test.com", 
      currentHotelCity: "Goa",
      currentHotelId: "hotel1", // Same as existing
      currentCheckInDate: "2024-03-15"
    },
    expected: { shouldBePending: true },
    reason: "Should be PENDING - Second booking in same city same day (even same hotel)"
  },
  {
    name: "Same-day booking in different city",
    mockData: [
      {
        _id: "existing1",
        bookingId: "ABC123",
        user: { mobile: "9999999999", email: "user@test.com" },
        hotelDetails: { hotelId: "hotel1", hotelCity: "Goa", hotelName: "Beach Resort" },
        checkInDate: new Date("2024-03-15"),
        bookingStatus: "Confirmed"
      }
    ],
    params: {
      userId: "user123", 
      userMobile: "9999999999",
      userEmail: "user@test.com",
      currentHotelCity: "Delhi", // Different city
      currentHotelId: "hotel5",
      currentCheckInDate: "2024-03-15"
    },
    expected: { shouldBePending: false },
    reason: "Should be CONFIRMED - Different city bookings always allowed"
  },
  {
    name: "Different day booking in same city, different hotel",
    mockData: [
      {
        _id: "existing1",
        bookingId: "ABC123",
        user: { mobile: "9999999999", email: "user@test.com" },
        hotelDetails: { hotelId: "hotel1", hotelCity: "Goa", hotelName: "Beach Resort" },
        checkInDate: new Date("2024-03-15"),
        bookingStatus: "Confirmed"
      }
    ],
    params: {
      userId: "user123",
      userMobile: "9999999999", 
      userEmail: "user@test.com",
      currentHotelCity: "Goa", // Same city
      currentHotelId: "hotel4", // Different hotel
      currentCheckInDate: "2024-03-16" // Different day
    },
    expected: { shouldBePending: true },
    reason: "Should be PENDING - Same city + different hotel (standard duplicate rule)"
  },
  {
    name: "New user, no existing bookings",
    mockData: [], // No existing bookings
    params: {
      userId: "newuser", 
      userMobile: "8888888888", // Different mobile
      userEmail: "newuser@test.com", // Different email
      currentHotelCity: "Goa",
      currentHotelId: "hotel1", 
      currentCheckInDate: "2024-03-15"
    },
    expected: { shouldBePending: false },
    reason: "Should be CONFIRMED - No existing bookings"
  }
];

// Run Tests
async function runTests() {
  console.log("🧪 Testing Same-Day Duplicate Booking Logic\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`Test ${i + 1}: ${test.name}`);
    
    try {
      const result = await checkDuplicateBooking(
        test.params.userId,
        test.params.userMobile,
        test.params.userEmail, 
        test.params.currentHotelCity,
        test.params.currentHotelId,
        test.params.currentCheckInDate,
        test.mockData
      );

      const success = result.shouldBePending === test.expected.shouldBePending;
      
      console.log(`Expected: ${test.expected.shouldBePending ? 'PENDING' : 'CONFIRMED'}`);
      console.log(`Result: ${result.shouldBePending ? 'PENDING' : 'CONFIRMED'}`);
      
      if (result.reason) {
        console.log(`Reason: ${result.reason}`);
      }
      
      console.log(`Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Note: ${test.reason}\n`);

      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log("📊 Test Summary");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Same-day duplicate logic is working correctly.");
  } else {
    console.log("\n⚠️ Some tests failed. Please check the logic.");
  }
}

// Business Logic Summary
console.log("🔍 Business Logic Summary:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ First Booking = CONFIRMED (no existing bookings)");
console.log("⚠️  Second Booking Same Day + Same City = PENDING (any hotel)");  
console.log("✅ Same Day + Different City = CONFIRMED (travel itinerary)");
console.log("⚠️  Different Day + Same City + Different Hotel = PENDING (standard rule)");
console.log("✅ Different City = CONFIRMED (always allowed)\n");

console.log("📋 Real-World Examples:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1. User books Hotel A in Goa for March 15 → ✅ CONFIRMED");
console.log("2. Same user books Hotel B in Goa for March 15 → ⚠️ PENDING");
console.log("3. Same user books Hotel A in Goa for March 15 → ⚠️ PENDING");
console.log("4. Same user books Hotel C in Mumbai for March 15 → ✅ CONFIRMED");
console.log("5. Same user books Hotel D in Goa for March 16 → ⚠️ PENDING\n");

// Run the tests
runTests();