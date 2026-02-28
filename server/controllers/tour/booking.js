const mongoose = require("mongoose");
const TourBooking = require("../../models/tour/booking");
const TourModel = require("../../models/tour/tour");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

/* =========================================================
   CREATE BOOKING (TRANSACTION SAFE)
========================================================= */


exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      tourId,
      vehicleId,
      bookingSource,

      seats = [],
      numberOfAdults = 0,
      numberOfChildren = 0,
      passengers = [],

      from,
      to,
      tourStartDate,

      payment,
      tax = 0,
      discount = 0
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!userId || !tourId || !vehicleId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "userId, tourId and vehicleId are required"
      });
    }

    const totalPassengers = numberOfAdults + numberOfChildren;

    if (seats.length && seats.length !== totalPassengers) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Seats count must match total passengers"
      });
    }

    /* ================= FETCH TOUR ================= */

    const tour = await TourModel.findById(tourId)
      .session(session)
      .select(
        "vehicles travelAgencyName agencyPhone agencyEmail visitngPlaces country state city themes nights days from to price amenities inclusion exclusion termsAndConditions dayWise isCustomizable tourStartDate"
      );

    if (!tour) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Tour not found"
      });
    }

    const vehicle = tour.vehicles.find(
      (v) => String(v._id) === String(vehicleId)
    );

    if (!vehicle) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    /* ================= SEAT CONFLICT CHECK ================= */

    const bookedSet = new Set(vehicle.bookedSeats || []);
    const conflictSeats = seats.filter((s) => bookedSet.has(s));

    if (conflictSeats.length > 0) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "Some seats already booked",
        conflictSeats
      });
    }

    /* ================= DATE RESOLUTION (FIXED) ================= */

    const finalFrom =
      from || tour.from || tour.tourStartDate;

    const finalTo =
      to ||
      tour.to ||
      (finalFrom
        ? new Date(
            new Date(finalFrom).getTime() +
              (Number(tour.days || 1) - 1) * 86400000
          )
        : undefined);

    const finalTourStartDate =
      tourStartDate || finalFrom;

    /* ================= PRICING ================= */

    const basePrice = Number(tour.price || 0);
    const seatUnitPrice = Number(vehicle.pricePerSeat || 0);
    const seatPrice = seatUnitPrice * seats.length;

    const totalAmount =
      basePrice + seatPrice + Number(tax) - Number(discount);

    /* ================= CREATE BOOKING ================= */

    const [booking] = await TourBooking.create(
      [
        {
          userId,
          tourId,
          vehicleId,

          seats,
          status: payment?.paidAt ? "confirmed" : "pending",

          numberOfAdults,
          numberOfChildren,
          passengers,

          isCustomizable: tour.isCustomizable,

          /* ===== SNAPSHOT (VERY IMPORTANT) ===== */
          travelAgencyName: tour.travelAgencyName,
          agencyPhone: tour.agencyPhone,
          agencyEmail: tour.agencyEmail,

          visitngPlaces: tour.visitngPlaces,
          country: tour.country,
          state: tour.state,
          city: tour.city,
          themes: tour.themes,
          bookingSource,

          nights: tour.nights,
          days: tour.days,

          from: finalFrom,
          to: finalTo,
          tourStartDate: finalTourStartDate,

          amenities: tour.amenities,
          inclusion: tour.inclusion,
          exclusion: tour.exclusion,
          termsAndConditions: tour.termsAndConditions,
          dayWise: tour.dayWise,

          basePrice,
          seatPrice,
          tax,
          discount,
          totalAmount,

          payment
        }
      ],
      { session }
    );

    /* ================= LOCK SEATS ================= */

    if (seats.length > 0) {
      await TourModel.updateOne(
        {
          _id: tourId,
          "vehicles._id": vehicleId,
          "vehicles.bookedSeats": { $nin: seats }
        },
        {
          $push: {
            "vehicles.$.bookedSeats": { $each: seats }
          }
        },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    await createUserNotificationSafe({
      name: "Tour Booking Successful",
      message: `Your tour booking ${booking.bookingCode} is created successfully.`,
      path: "/app/bookings/tour",
      eventType: "tour_booking_success",
      metadata: {
        bookingCode: booking.bookingCode,
        bookingStatus: booking.status,
        tourId: booking.tourId,
      },
      userIds: [String(booking.userId)],
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message
    });
  }
};


/* =========================================================
   GET VEHICLE SEATS
========================================================= */
exports.getVehicleSeats = async (req, res) => {
  try {
    const { tourId, vehicleId } = req.params;

    const tour = await TourModel.findById(tourId).select("vehicles");
    if (!tour)
      return res.status(404).json({ success: false, message: "Tour not found" });

    const vehicle = tour.vehicles.find(
      (v) => String(v._id) === String(vehicleId)
    );

    if (!vehicle)
      return res.status(404).json({ success: false, message: "Vehicle not found" });

    const bookedSet = new Set(vehicle.bookedSeats || []);
    let seatLayout = [];
    let seatMatrix = [];

    if (vehicle.seatLayout?.length) {
      seatLayout = vehicle.seatLayout;
      seatMatrix = seatLayout.map((code) => ({
        code,
        status: bookedSet.has(code) ? "booked" : "available"
      }));
    } else if (vehicle.seatConfig) {
      const { rows, left, right, aisle } = vehicle.seatConfig;

      for (let r = 1; r <= rows; r++) {
        const row = [];

        for (let l = 0; l < left; l++) {
          const code = `${r}${String.fromCharCode(65 + l)}`;
          seatLayout.push(code);
          row.push({
            code,
            side: "left",
            status: bookedSet.has(code) ? "booked" : "available"
          });
        }

        if (aisle) row.push({ type: "aisle" });

        for (let k = 0; k < right; k++) {
          const code = `${r}${String.fromCharCode(65 + left + k)}`;
          seatLayout.push(code);
          row.push({
            code,
            side: "right",
            status: bookedSet.has(code) ? "booked" : "available"
          });
        }

        seatMatrix.push(row);
      }
    } else {
      seatLayout = Array.from(
        { length: vehicle.totalSeats || 0 },
        (_, i) => String(i + 1)
      );

      seatMatrix = seatLayout.map((code) => ({
        code,
        status: bookedSet.has(code) ? "booked" : "available"
      }));
    }

    return res.json({
      success: true,
      vehicle: {
        _id: vehicle._id,
        name: vehicle.name,
        vehicleNumber: vehicle.vehicleNumber,
        totalSeats: vehicle.totalSeats,
        seaterType: vehicle.seaterType,
        seatConfig: vehicle.seatConfig || null,
        seatLayout,
        seatMatrix,
        bookedSeats: vehicle.bookedSeats
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle seats",
      error: error.message
    });
  }
};

/* =========================================================
   GET BOOKINGS
========================================================= */
exports.getBookings = async (_, res) => {
  try {
    const bookings = await TourBooking.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.getByAgencyEmail = async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.email}$`, "i");
    const bookings = await TourBooking.find({ agencyEmail: regex }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.getBookingsByBookingId = async (req, res) => {
  const booking = await TourBooking.findOne({ bookingCode: req.params.bookingCode });
  if (!booking)
    return res.status(404).json({ success: false, message: "Booking not found" });

  res.json({ success: true, data: booking });
};

exports.getBookingByUser = async (req, res) => {
  const bookings = await TourBooking.find({ userId: req.query.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
};

/* =========================================================
   TOTAL SELL
========================================================= */
exports.getTotalSell = async (_, res) => {
  const result = await TourBooking.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: null, totalSell: { $sum: "$totalAmount" } } }
  ]);

  res.json({ success: true, totalSell: result[0]?.totalSell || 0 });
};

/* =========================================================
   UPDATE BOOKING (CANCEL SAFE)
========================================================= */
exports.updateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    const updateData = req.body;

    // 1️⃣ Find booking first
    const booking = await TourBooking.findById(bookingId).session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const previousStatus = booking.status;

    // 2️⃣ Update booking
    Object.assign(booking, updateData);
    await booking.save({ session });

    // 3️⃣ Unlock seats ONLY when:
    //    pending/confirmed → cancelled
    if (
      previousStatus !== "cancelled" &&
      booking.status === "cancelled" &&
      booking.seats?.length
    ) {
      await TourModel.updateOne(
        {
          _id: booking.tourId,
          "vehicles._id": booking.vehicleId,
        },
        {
          $pull: {
            "vehicles.$.bookedSeats": { $in: booking.seats },
          },
        },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    if (previousStatus !== "confirmed" && booking.status === "confirmed") {
      await createUserNotificationSafe({
        name: "Tour Booking Confirmed",
        message: `Your tour booking ${booking.bookingCode} is confirmed.`,
        path: "/app/bookings/tour",
        eventType: "tour_booking_confirmed",
        metadata: {
          bookingCode: booking.bookingCode,
          bookingStatus: booking.status,
          tourId: booking.tourId,
        },
        userIds: [String(booking.userId)],
      });
    }

    return res.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE BOOKING
========================================================= */
exports.deleteBooking = async (req, res) => {
  const booking = await TourBooking.findOneAndDelete({
    bookingId: req.params.bookingId
  });

  if (!booking)
    return res.status(404).json({ success: false, message: "Booking not found" });

  if (booking.seats.length) {
    await TourModel.updateOne(
      { _id: booking.tourId, "vehicles._id": booking.vehicleId },
      { $pullAll: { "vehicles.$.bookedSeats": booking.seats } }
    );
  }

  res.json({ success: true, message: "Booking deleted successfully" });
};
