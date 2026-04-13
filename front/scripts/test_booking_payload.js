// Simple validator for front booking payload shape
// Run: node front/scripts/test_booking_payload.js

const MAX_GUESTS_PER_ROOM = 3;

const payload = {
  hotelId: 'HOTEL123',
  userId: 'USER123',
  checkInDate: '2026-04-12',
  checkOutDate: '2026-04-13',
  guests: 2,
  numRooms: 1,
  guestDetails: [
    { fullName: 'John Doe', mobile: '+919876543210', email: 'john@example.com' },
  ],
  roomDetails: [
    { roomId: 'R1', type: 'Deluxe', bedTypes: 'Double', price: 6000 },
  ],
  foodDetails: [],
  price: 6720,
  pm: 'online',
  bookingSource: 'Site',
  bookingStatus: 'Pending',
  couponCode: '',
  discountPrice: 0,
  hotelDetails: { hotelId: 'HOTEL123', hotelName: 'Blue Lagoon', hotelCity: 'Goa', hotelEmail: 'hotel@example.com', hotelOwnerName: 'Owner' },
};

const errors = [];
function assert(cond, msg) { if (!cond) errors.push(msg); }

// Basic checks
assert(typeof payload.hotelId === 'string' && payload.hotelId.trim(), 'hotelId missing or empty');
assert(typeof payload.userId === 'string' && payload.userId.trim(), 'userId missing or empty');
assert(typeof payload.checkInDate === 'string' && !Number.isNaN(Date.parse(payload.checkInDate)), 'checkInDate missing/invalid');
assert(typeof payload.checkOutDate === 'string' && !Number.isNaN(Date.parse(payload.checkOutDate)), 'checkOutDate missing/invalid');
assert(typeof payload.guests === 'number' && Number.isFinite(payload.guests) && payload.guests > 0, 'guests missing/invalid');
assert(typeof payload.numRooms === 'number' && Number.isFinite(payload.numRooms) && payload.numRooms > 0, 'numRooms missing/invalid');

// guestDetails array
assert(Array.isArray(payload.guestDetails), 'guestDetails must be an array');
assert(payload.guestDetails.length > 0, 'guestDetails must have at least one entry');
payload.guestDetails.forEach((g, i) => {
  assert(g && typeof g === 'object', `guestDetails[${i}] must be object`);
  assert(typeof g.fullName === 'string' && g.fullName.trim(), `guestDetails[${i}].fullName missing`);
  assert(typeof g.mobile === 'string' && g.mobile.trim(), `guestDetails[${i}].mobile missing`);
  if (g.email) {
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email), `guestDetails[${i}].email invalid`);
  }
});

// roomDetails
assert(Array.isArray(payload.roomDetails), 'roomDetails must be an array');
assert(payload.roomDetails.length > 0, 'roomDetails must have at least one entry');
payload.roomDetails.forEach((r, i) => {
  assert(r && typeof r === 'object', `roomDetails[${i}] must be object`);
  assert(typeof r.roomId === 'string' && r.roomId.trim(), `roomDetails[${i}].roomId missing`);
  assert(typeof r.price === 'number' && Number.isFinite(r.price) && r.price >= 0, `roomDetails[${i}].price missing/invalid`);
});

// guests vs guestDetails
assert(payload.guests >= payload.guestDetails.length, 'guests count less than guestDetails.length');
assert(payload.guests <= payload.numRooms * MAX_GUESTS_PER_ROOM, `guests exceed capacity (max ${MAX_GUESTS_PER_ROOM} per room)`);

// hotelDetails
assert(payload.hotelDetails && typeof payload.hotelDetails === 'object', 'hotelDetails missing');
assert(typeof payload.hotelDetails.hotelName === 'string' && payload.hotelDetails.hotelName.trim(), 'hotelDetails.hotelName missing');

// Final
if (errors.length) {
  console.error('VALIDATION FAILED:');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
} else {
  console.log('VALIDATION PASSED: Front booking payload shape looks correct.');
  console.log('Payload snapshot:');
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}
