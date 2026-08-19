/**
 * Test script to verify No-Show fix for same-day bookings
 * Run with: node server/scripts/test_no_show_fix.js
 */

const { shouldMarkAsNoShow } = require('../utils/bookingRules');

// Test cases
const testCases = [
  {
    name: "Same-day booking (created today, check-in today)",
    booking: {
      bookingStatus: "Confirmed",
      checkInDate: new Date(), // Today
      createdAt: new Date()
    },
    expectedResult: false,
    reason: "Should NOT be marked no-show (same day + within 24h grace period)"
  },
  {
    name: "Yesterday's booking with yesterday check-in",
    booking: {
      bookingStatus: "Confirmed", 
      checkInDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    expectedResult: false,
    reason: "Should NOT be marked no-show (exactly 24h ago, still within 25h grace period)"
  },
  {
    name: "2 days old booking with check-in 2 days ago",
    booking: {
      bookingStatus: "Confirmed",
      checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    expectedResult: true,
    reason: "Should be marked no-show (check-in was 2 days ago, grace period over)"
  },
  {
    name: "Cancelled booking (should never be no-show)",
    booking: {
      bookingStatus: "Cancelled",
      checkInDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    expectedResult: false,
    reason: "Should NOT be marked no-show (booking is already cancelled)"
  },
  {
    name: "Future check-in booking",
    booking: {
      bookingStatus: "Confirmed",
      checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdAt: new Date()
    },
    expectedResult: false,
    reason: "Should NOT be marked no-show (check-in is in future)"
  }
];

console.log("🧪 Testing No-Show Logic Fix\n");

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Expected: ${test.expectedResult ? 'SHOULD' : 'SHOULD NOT'} be marked no-show`);
  
  const result = shouldMarkAsNoShow(test.booking);
  const success = result === test.expectedResult;
  
  console.log(`Result: ${result ? 'WOULD' : 'WOULD NOT'} be marked no-show`);
  console.log(`Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Reason: ${test.reason}\n`);
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log("📊 Test Summary");
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
  console.log("\n🎉 All tests passed! No-Show fix is working correctly.");
} else {
  console.log("\n⚠️ Some tests failed. Please check the logic.");
}

// Additional info about the fix
console.log("\n📝 Fix Details:");
console.log("- Added 25-hour grace period after check-in date");
console.log("- Same-day bookings are protected from immediate no-show");
console.log("- Auto-cancel job also has additional safety checks");
console.log("- Minimum 2-hour payment window for same-day online bookings");