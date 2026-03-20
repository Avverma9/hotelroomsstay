const hotelModel = require("../../models/hotel/basicDetails");
const bookingsModel = require("../../models/booking/booking");

// Statuses that occupy a room and block availability
const BLOCKING_STATUSES = ["Confirmed", "Checked-in", "Pending", "No-Show"];

// Parse date string or Date object into a plain JS timestamp (ms)
const toMs = (d) => new Date(d).getTime();

// Two date ranges overlap when: startA < endB && endA > startB
const overlaps = (bookingCheckIn, bookingCheckOut, rangeStart, rangeEnd) =>
  toMs(bookingCheckIn) < toMs(rangeEnd) &&
  toMs(bookingCheckOut) > toMs(rangeStart);

/* =========================================================
   CHECK AVAILABILITY — single hotel
   GET /check/hotels/room-availability?hotelId=&fromDate=&toDate=
========================================================= */
exports.checkAvailability = async (req, res) => {
  const { hotelId, fromDate, toDate } = req.query;

  if (!hotelId || !fromDate || !toDate) {
    return res
      .status(400)
      .json({ error: "hotelId, fromDate and toDate are required." });
  }

  // FIX: validate dates early
  if (isNaN(toMs(fromDate)) || isNaN(toMs(toDate))) {
    return res.status(400).json({ error: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)." });
  }

  if (toMs(toDate) <= toMs(fromDate)) {
    return res.status(400).json({ error: "toDate must be after fromDate." });
  }

  try {
    const hotel = await hotelModel.findOne({ hotelId });
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found." });
    }

    const totalRooms = hotel.rooms.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
    const listedAvailableRooms = hotel.rooms.reduce((sum, r) => sum + (r.countRooms || 0), 0);

    // FIX: query by correct nested path "hotelDetails.hotelId"
    const bookings = await bookingsModel.find({
      "hotelDetails.hotelId": hotelId,
      checkInDate: { $lt: toDate },
      checkOutDate: { $gt: fromDate },
    });

    const summary = {
      Confirmed: 0,
      "Checked-in": 0,
      "Checked-out": 0,
      Pending: 0,
      "No-Show": 0,
      Cancelled: 0,
      Failed: 0,
    };

    let activelyBlockedRooms = 0;

    for (const booking of bookings) {
      const rooms = booking.numRooms || 1;
      const status = booking.bookingStatus;

      if (Object.prototype.hasOwnProperty.call(summary, status)) {
        summary[status] += rooms;
      }

      // FIX: use correct overlap check and correct field path
      if (overlaps(booking.checkInDate, booking.checkOutDate, fromDate, toDate)) {
        if (BLOCKING_STATUSES.includes(status)) {
          activelyBlockedRooms += rooms;
        }
      }
    }

    // FIX: actually compute actual available rooms
    const actualAvailableRooms = Math.max(0, listedAvailableRooms - activelyBlockedRooms);

    return res.json({
      hotelId,
      hotelName: hotel.hotelName,
      city: hotel.city,
      fromDate,
      toDate,
      totalRooms,
      listedAvailableRooms,
      activelyBlockedRooms,
      actualAvailableRooms,
      isAvailable: actualAvailableRooms > 0,
      bookingSummary: summary,
    });
  } catch (error) {
    console.error("checkAvailability error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking availability." });
  }
};

/* =========================================================
   FIND ALL AVAILABLE HOTELS
   GET /check/all-hotels/room-availability?fromDate=&toDate=&city=
========================================================= */
exports.findAllAvailableHotels = async (req, res) => {
  const { fromDate, toDate, city } = req.query;

  // FIX: validate required params before anything
  if (!fromDate || !toDate) {
    return res.status(400).json({ error: "fromDate and toDate are required." });
  }

  if (isNaN(toMs(fromDate)) || isNaN(toMs(toDate))) {
    return res.status(400).json({ error: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)." });
  }

  if (toMs(toDate) <= toMs(fromDate)) {
    return res.status(400).json({ error: "toDate must be after fromDate." });
  }

  try {
    // Step 1: Fetch all overlapping bookings in one query
    const bookings = await bookingsModel.find({
      checkInDate: { $lt: toDate },
      checkOutDate: { $gt: fromDate },
    });

    // Step 2: Group bookings by hotelId (correct nested path)
    const hotelBookingsMap = new Map();
    for (const booking of bookings) {
      const hid = booking.hotelDetails?.hotelId;
      if (!hid) continue;
      if (!hotelBookingsMap.has(hid)) hotelBookingsMap.set(hid, []);
      hotelBookingsMap.get(hid).push(booking);
    }

    // Step 3: Fetch hotels (with optional city filter)
    const hotels = await hotelModel.find(city ? { city } : {});
    const results = [];

    for (const hotel of hotels) {
      const hid = hotel.hotelId;
      const hotelBookings = hotelBookingsMap.get(hid) || [];

      const totalRooms = hotel.rooms.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
      const listedAvailableRooms = hotel.rooms.reduce((sum, r) => sum + (r.countRooms || 0), 0);

      // FIX: "No-show" → "No-Show" to match the enum
      const summary = {
        Confirmed: 0,
        "Checked-in": 0,
        "Checked-out": 0,
        Pending: 0,
        "No-Show": 0,
        Cancelled: 0,
        Failed: 0,
      };

      let activelyBlockedRooms = 0;

      for (const booking of hotelBookings) {
        // FIX: count numRooms not just 1 per booking
        const rooms = booking.numRooms || 1;
        const status = booking.bookingStatus;

        if (Object.prototype.hasOwnProperty.call(summary, status)) {
          summary[status] += rooms;
        }

        // FIX: endDate > checkIn (strict), not endDate >= checkIn
        if (overlaps(booking.checkInDate, booking.checkOutDate, fromDate, toDate)) {
          if (BLOCKING_STATUSES.includes(status)) {
            activelyBlockedRooms += rooms;
          }
        }
      }

      const actualAvailableRooms = Math.max(0, listedAvailableRooms - activelyBlockedRooms);

      let note = null;
      if (listedAvailableRooms < totalRooms) {
        note =
          "The hotel owner may have listed fewer rooms than total capacity. Some rooms may have been pre-booked before listing. Contact the hotel owner for clarification.";
      }

      results.push({
        hotelId: hid,
        hotelName: hotel.hotelName,
        city: hotel.city,
        fromDate,
        toDate,
        totalRooms,
        listedAvailableRooms,
        activelyBlockedRooms,
        actualAvailableRooms,
        bookedBeforeListing: totalRooms - listedAvailableRooms,
        isAvailable: actualAvailableRooms > 0,
        note,
        bookingSummary: summary,
        bookings: hotelBookings.map((b) => ({
          bookingId: b.bookingId || b._id,
          customerName: b.user?.name || "",
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          numRooms: b.numRooms || 1,
          bookingStatus: b.bookingStatus,
        })),
      });
    }

    return res.json(results);
  } catch (error) {
    console.error("findAllAvailableHotels error:", error);
    return res.status(500).json({
      error: "An error occurred while checking hotel availability.",
    });
  }
};