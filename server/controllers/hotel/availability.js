const hotelModel = require("../../models/hotel/basicDetails");
const bookingsModel = require("../../models/booking/booking");
const { DateTime } = require("luxon"); // For date handling

exports.checkAvailability = async (req, res) => {
  const { hotelId, fromDate, toDate } = req.query;

  // Check if hotelId, fromDate, and toDate are provided
  if (!hotelId || !fromDate || !toDate) {
    return res
      .status(400)
      .json({ error: "Hotel ID, from date, and to date are required." });
  }

  try {
    // Fetch hotel details from the database
    const hotel = await hotelModel.findOne({ hotelId });
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found." });
    }

    // Calculate total rooms available
    const totalRooms = hotel.rooms.reduce(
      (total, room) => total + room.totalRooms,
      0,
    );
    const availableRooms = hotel.rooms.reduce(
      (total, room) => total + room.countRooms,
      0,
    );

    // Parse the provided dates
    const startDate = DateTime.fromISO(fromDate);
    const endDate = DateTime.fromISO(toDate);

    // Fetch bookings for the specified hotel
    const bookings = await bookingsModel.find({ hotelId });

    // Initialize counters
    let bookedRooms = 0;
    let cancelledRooms = 0;
    let checkedInRooms = 0;
    let checkedOutRooms = 0;
    let noShowRooms = 0;
    let failedRooms = 0;
    let pendingRooms = 0;

    for (const booking of bookings) {
      const checkInDate = DateTime.fromISO(booking.checkInDate);
      const checkOutDate = DateTime.fromISO(booking.checkOutDate);
      const bookingStatus = booking.bookingStatus;

      // Skip bookings that have already checked out before the fromDate
      if (checkOutDate < startDate) {
        continue; // Booking has already checked out
      }

      // Skip bookings that check in after the toDate
      if (checkInDate > endDate) {
        continue; // Booking starts after the toDate
      }

      // Count rooms based on the booking status
      switch (bookingStatus) {
        case "Confirmed":
          bookedRooms += booking.numRooms; // Count confirmed rooms as booked
          break;
        case "Cancelled":
          cancelledRooms += booking.numRooms; // Count cancelled rooms
          break;
        case "Checked-in":
          checkedInRooms += booking.numRooms; // Count checked-in rooms
          break;
        case "Checked-out":
          checkedOutRooms += booking.numRooms; // Count checked-out rooms
          break;
        case "No-Show":
          noShowRooms += booking.numRooms; // Count no-show rooms
          break;
        case "Failed":
          failedRooms += booking.numRooms; // Count failed rooms
          break;
        case "Pending":
          pendingRooms += booking.numRooms; // Count pending rooms
          break;
        default:
          break; // Unknown status, do nothing
      }
    }

    // Calculate available rooms

    // Send response
    return res.json({
      hotelId,
      hotelName: hotel.hotelName,
      city: hotel.city,
      totalRooms,
      bookedRooms,
      availableRooms,
      cancelledRooms,
      checkedInRooms,
      checkedOutRooms,
      noShowRooms,
      failedRooms,
      pendingRooms,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking availability." });
  }
};


exports.findAllAvailableHotels = async (req, res) => {
    const { fromDate, toDate, city } = req.query;
  
    try {
      const startDate = DateTime.fromISO(fromDate);
      const endDate = DateTime.fromISO(toDate);
  
      // ✅ Validate date input
      if (!startDate.isValid || !endDate.isValid || endDate < startDate) {
        return res.status(400).json({ error: "Invalid date range." });
      }
  
      // ✅ Step 1: Get all overlapping bookings
      const bookings = await bookingsModel.find({
        checkInDate: { $lte: toDate },
        checkOutDate: { $gt: fromDate },
      });
  
      // ✅ Step 2: Group bookings by hotelId
      const hotelBookingsMap = new Map();
      for (const booking of bookings) {
        const hotelId = booking.hotelDetails.hotelId;
        if (!hotelBookingsMap.has(hotelId)) {
          hotelBookingsMap.set(hotelId, []);
        }
        hotelBookingsMap.get(hotelId).push(booking);
      }
  
      // ✅ Step 3: Fetch all hotels (with city filter if given)
      const hotels = await hotelModel.find(city ? { city } : {});
      const results = [];
  
      for (const hotel of hotels) {
        const hotelId = hotel.hotelId;
        const hotelBookings = hotelBookingsMap.get(hotelId) || [];
  
        // ✅ Step 4: Calculate total and initial available rooms
        const totalRooms = hotel.rooms.reduce((sum, room) => sum + room.totalRooms, 0);
        const initialAvailableRooms = hotel.rooms.reduce((sum, room) => sum + room.countRooms, 0);
  
        // ✅ Step 5: Booking summary by status
        const summary = {
          Confirmed: 0,
          Cancelled: 0,
          "Checked-in": 0,
          "Checked-out": 0,
          Failed: 0,
          "No-show": 0,
          Pending: 0,
        };
  
        let activeBookings = 0;
  
        for (const booking of hotelBookings) {
          const checkIn = DateTime.fromISO(booking.checkInDate);
          const checkOut = DateTime.fromISO(booking.checkOutDate);
          const status = booking.bookingStatus;
  
          // ✅ Always count status for summary
          if (summary.hasOwnProperty(status)) {
            summary[status]++;
          }
  
          // ✅ Count room as booked if status affects availability
          if (startDate < checkOut && endDate >= checkIn) {
            if (["Confirmed", "Checked-in", "Pending", "No-show"].includes(status)) {
              activeBookings++;
            }
          }
        }
  
        // ✅ Final room availability
        const actualAvailableRooms = initialAvailableRooms - activeBookings;
  
        // ✅ Note if manual availability is less than total capacity
        let note = null;
        if (initialAvailableRooms < totalRooms) {
          note =
            "The hotel owner may have listed more total rooms, but fewer are available because some might have been booked before the listing. You can check the 👇'Booked before listing' section below for those bookings. Contact and ask the hotel owner for clarification.";
        }
        // ✅ Add to final result
        results.push({
          hotelId: hotel.hotelId,
          hotelName: hotel.hotelName,
          city: hotel.city,
          totalRooms,
          initialAvailableRooms,
          actualAvailableRooms,
          bookedFromOthers:totalRooms - initialAvailableRooms,
          note,
          bookingSummary: summary,
          bookings: hotelBookings.map((b) => ({
            bookingId: b.bookingId || b._id,
            customerName: b.user?.name || "",
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            bookingStatus: b.bookingStatus,
          })),
        });
      }
  
      return res.json(results);
    } catch (error) {
      console.error("Error checking availability:", error);
      return res.status(500).json({
        error: "An error occurred while checking hotel availability.",
      });
    }
  };