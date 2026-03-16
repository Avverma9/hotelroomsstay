const mongoose = require("mongoose");
const CarBooking = require("../../models/travel/carBooking");
const Car = require("../../models/travel/cars");
const { getGSTData } = require("../GST/gst");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

const BOOKING_STATUS = new Set(["Pending", "Confirmed", "Cancelled", "Failed"]);
const RELEASE_SEAT_STATUS = new Set(["Cancelled", "Failed"]);
const ALLOWED_UPDATE_FIELDS = new Set([
  "customerMobile",
  "customerEmail",
  "bookedBy",
  "bookingStatus",
]);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const recalculateCarAvailability = (car) => {
  const seats = Array.isArray(car.seatConfig) ? car.seatConfig : [];
  const allSeatsBooked =
    seats.length > 0 && seats.every((seat) => Boolean(seat.isBooked));
  car.isAvailable = !allSeatsBooked;
  car.runningStatus = allSeatsBooked ? "On A Trip" : "Available";
};

const releaseSeatsByIds = async ({ carId, seatIds = [], bookedBy }) => {
  const car = await Car.findById(carId);
  if (!car || !Array.isArray(car.seatConfig)) {
    return;
  }

  const seatIdSet = new Set(seatIds.map((seatId) => String(seatId).trim()));
  for (const seat of car.seatConfig) {
    const isMatchingSeat = seatIdSet.has(String(seat._id));
    if (!isMatchingSeat) {
      continue;
    }

    if (!bookedBy || !seat.bookedBy || seat.bookedBy === bookedBy) {
      seat.isBooked = false;
      seat.bookedBy = "";
    }
  }

  recalculateCarAvailability(car);
  await car.save();
};

const releaseSeatsForBooking = async (booking) => {
  await releaseSeatsByIds({
    carId: booking.carId,
    seatIds: booking.seats || [],
    bookedBy: booking.bookedBy,
  });
};

const buildSeatDetails = (car, bookingSeatIds = []) => {
  if (!car || !Array.isArray(car.seatConfig)) {
    return [];
  }

  const seatIdSet = new Set(bookingSeatIds.map((seatId) => String(seatId)));
  return car.seatConfig.filter((seat) => seatIdSet.has(String(seat._id)));
};

exports.bookCar = async (req, res) => {
  try {
    const {
      seats,
      sharingType,
      vehicleType,
      userId,
      carId,
      bookedBy,
      customerMobile,
      customerEmail,
      passengerName,
      paymentMethod,
      paymentId,
    } = req.body;

    const normalizedUserId = String(userId || "").trim();
    if (!normalizedUserId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!carId || !isValidObjectId(carId)) {
      return res.status(400).json({ message: "Valid carId is required" });
    }
    if (!customerMobile || !customerEmail) {
      return res
        .status(400)
        .json({ message: "customerMobile and customerEmail are required" });
    }

    const carSnapshot = await Car.findById(carId).lean();
    if (!carSnapshot) {
      return res.status(404).json({ message: "Car not found" });
    }

    if (sharingType && sharingType !== carSnapshot.sharingType) {
      return res.status(400).json({
        message: "sharingType does not match the selected car",
      });
    }
    if (vehicleType && vehicleType !== carSnapshot.vehicleType) {
      return res.status(400).json({
        message: "vehicleType does not match the selected car",
      });
    }

    const effectiveBookedBy = bookedBy || customerMobile || customerEmail;
    let reservedCar;
    let bookedSeatIds = [];
    let totalSeatPrice = 0;

    if (carSnapshot.sharingType === "Private") {
      const privateSeatUpdate = {};
      (carSnapshot.seatConfig || []).forEach((seat, index) => {
        privateSeatUpdate[`seatConfig.${index}.isBooked`] = true;
        privateSeatUpdate[`seatConfig.${index}.bookedBy`] = effectiveBookedBy;
      });

      reservedCar = await Car.findOneAndUpdate(
        {
          _id: carId,
          sharingType: "Private",
          isAvailable: true,
          "seatConfig.isBooked": { $ne: true },
        },
        {
          $set: {
            ...privateSeatUpdate,
            isAvailable: false,
            runningStatus: "On A Trip",
          },
        },
        { new: true },
      );

      if (!reservedCar) {
        return res.status(409).json({
          message: "Car is no longer available for private booking",
        });
      }

      bookedSeatIds = (reservedCar.seatConfig || []).map((seat) =>
        String(seat._id),
      );
      totalSeatPrice = Number(reservedCar.price || 0);
    } else {
      if (!Array.isArray(seats) || seats.length === 0) {
        return res
          .status(400)
          .json({ message: "No seats selected for shared booking" });
      }

      const requestedSeatIds = [...new Set(seats.map((seatId) => String(seatId)))];
      const invalidSeatIds = requestedSeatIds.filter((seatId) => !isValidObjectId(seatId));
      if (invalidSeatIds.length > 0) {
        return res.status(400).json({ message: "Invalid seat id(s) provided" });
      }

      const snapshotSeatIds = new Set(
        (carSnapshot.seatConfig || []).map((seat) => String(seat._id)),
      );
      const missingSeats = requestedSeatIds.filter(
        (seatId) => !snapshotSeatIds.has(seatId),
      );
      if (missingSeats.length > 0) {
        return res.status(404).json({ message: "One or more seats not found" });
      }

      const seatObjectIds = requestedSeatIds.map(
        (seatId) => new mongoose.Types.ObjectId(seatId),
      );
      const seatAvailabilityMatch = seatObjectIds.map((seatObjectId) => ({
        $elemMatch: { _id: seatObjectId, isBooked: { $ne: true } },
      }));

      reservedCar = await Car.findOneAndUpdate(
        {
          _id: carId,
          sharingType: "Shared",
          isAvailable: true,
          seatConfig: { $all: seatAvailabilityMatch },
        },
        {
          $set: {
            "seatConfig.$[seat].isBooked": true,
            "seatConfig.$[seat].bookedBy": effectiveBookedBy,
          },
        },
        {
          new: true,
          arrayFilters: [{ "seat._id": { $in: seatObjectIds } }],
        },
      );

      if (!reservedCar) {
        return res.status(409).json({
          message: "Some selected seats are already booked or unavailable",
        });
      }

      const selectedSeats = buildSeatDetails(reservedCar, requestedSeatIds);
      bookedSeatIds = requestedSeatIds;
      totalSeatPrice = selectedSeats.reduce(
        (sum, seat) => sum + (seat.seatPrice || reservedCar.perPersonCost || 0),
        0,
      );

      const allSeatsBooked =
        reservedCar.seatConfig.length > 0 &&
        reservedCar.seatConfig.every((seat) => Boolean(seat.isBooked));
      if (allSeatsBooked) {
        reservedCar.isAvailable = false;
        reservedCar.runningStatus = "On A Trip";
        await reservedCar.save();
      }
    }

    const gstData = await getGSTData({
      type: "Travel",
      gstThreshold: totalSeatPrice,
    });
    const gstRate = Number(gstData?.gstPrice || 0);
    const gstAmount = Number(((totalSeatPrice * gstRate) / 100).toFixed(2));
    const finalPrice = Number((totalSeatPrice + gstAmount).toFixed(2));

    let newBooking;
    try {
      newBooking = await CarBooking.create({
        carId: reservedCar._id,
        userId: normalizedUserId,
        seats: bookedSeatIds,
        totalSeatsBooked: bookedSeatIds.length,
        bookedBy: effectiveBookedBy,
        passengerName: String(passengerName || bookedBy || "").trim(),
        customerMobile,
        customerEmail,
        // Pricing
        basePrice: totalSeatPrice,
        gstRate,
        gstPrice: gstRate,
        gstAmount,
        price: finalPrice,
        // Payment
        paymentMethod: paymentMethod || "Online",
        paymentId: String(paymentId || "").trim(),
        isPaid: false,
        // Vehicle
        sharingType: reservedCar.sharingType,
        vehicleType: reservedCar.vehicleType,
        vehicleNumber: reservedCar.vehicleNumber,
        make: reservedCar.make || "",
        model: reservedCar.model || "",
        color: reservedCar.color || "",
        // Trip
        pickupP: reservedCar.pickupP,
        dropP: reservedCar.dropP,
        pickupD: reservedCar.pickupD,
        dropD: reservedCar.dropD,
      });
    } catch (bookingError) {
      await releaseSeatsByIds({
        carId: reservedCar._id,
        seatIds: bookedSeatIds,
        bookedBy: effectiveBookedBy,
      });
      throw bookingError;
    }

    try {
      await sendCustomEmail({
        email: customerEmail,
        subject: "Your Travel Booking is Confirmed",
        message: `Your booking (ID: ${newBooking.bookingId}) has been confirmed. Vehicle Number: ${reservedCar.vehicleNumber}.`,
        link: process.env.FRONTEND_URL,
      });
    } catch (mailError) {
      console.error("Booking email failed:", mailError.message);
    }

    await createUserNotificationSafe({
      name: "Travel Booking Successful",
      message: `Your travel booking ${newBooking.bookingId} is created successfully.`,
      path: "/app/bookings/travel",
      eventType: "travel_booking_success",
      metadata: {
        bookingId: newBooking.bookingId,
        bookingStatus: newBooking.bookingStatus,
        carId: String(newBooking.carId),
      },
      userIds: [String(newBooking.userId)],
    });

    return res.status(201).json({
      success: true,
      message: "Booking successful",
      data: newBooking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.changeBookingStatus = async (req, res) => {
  try {
    const { bookingStatus } = req.body;
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    if (!bookingStatus || !BOOKING_STATUS.has(bookingStatus)) {
      return res.status(400).json({ message: "Invalid bookingStatus" });
    }

    const booking = await CarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const previousStatus = booking.bookingStatus;
    booking.bookingStatus = bookingStatus;
    await booking.save();

    if (previousStatus !== "Confirmed" && booking.bookingStatus === "Confirmed") {
      await createUserNotificationSafe({
        name: "Travel Booking Confirmed",
        message: `Your travel booking ${booking.bookingId} is confirmed.`,
        path: "/app/bookings/travel",
        eventType: "travel_booking_confirmed",
        metadata: {
          bookingId: booking.bookingId,
          bookingStatus: booking.bookingStatus,
        },
        userIds: [String(booking.userId)],
      });
    }

    if (
      RELEASE_SEAT_STATUS.has(bookingStatus) &&
      previousStatus !== bookingStatus
    ) {
      await releaseSeatsForBooking(booking);
    }

    return res.status(200).json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("changeBookingStatus error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getTravelBookings = async (req, res) => {
  try {
    const bookings = await CarBooking.find().lean();
    if (bookings.length === 0) {
      return res.status(200).json([]);
    }

    const carIds = [...new Set(bookings.map((booking) => String(booking.carId)))];
    const cars = await Car.find({ _id: { $in: carIds } }).lean();
    const carMap = new Map(cars.map((car) => [String(car._id), car]));

    const enrichedBookings = bookings.map((booking) => {
      const car = carMap.get(String(booking.carId));
      const seatDetails = buildSeatDetails(car, booking.seats || []);
      const totalSeatPrice = seatDetails.reduce(
        (sum, seat) => sum + (seat.seatPrice || car?.perPersonCost || 0),
        0,
      );

      return {
        ...booking,
        seats: seatDetails,
        totalSeatPrice,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error in getTravelBookings:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Booking ID" });
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ message: "Update data is required" });
    }

    const requestedFields = Object.keys(data);
    const invalidFields = requestedFields.filter(
      (field) => !ALLOWED_UPDATE_FIELDS.has(field),
    );
    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Invalid update field(s): ${invalidFields.join(", ")}`,
      });
    }
    if (
      data.bookingStatus !== undefined &&
      !BOOKING_STATUS.has(data.bookingStatus)
    ) {
      return res.status(400).json({ message: "Invalid bookingStatus" });
    }

    const booking = await CarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const previousStatus = booking.bookingStatus;
    requestedFields.forEach((field) => {
      booking[field] = data[field];
    });

    const updatedBooking = await booking.save();
    if (
      RELEASE_SEAT_STATUS.has(updatedBooking.bookingStatus) &&
      previousStatus !== updatedBooking.bookingStatus
    ) {
      await releaseSeatsForBooking(updatedBooking);
    }

    if (
      previousStatus !== "Confirmed" &&
      updatedBooking.bookingStatus === "Confirmed"
    ) {
      await createUserNotificationSafe({
        name: "Travel Booking Confirmed",
        message: `Your travel booking ${updatedBooking.bookingId} is confirmed.`,
        path: "/app/bookings/travel",
        eventType: "travel_booking_confirmed",
        metadata: {
          bookingId: updatedBooking.bookingId,
          bookingStatus: updatedBooking.bookingStatus,
        },
        userIds: [String(updatedBooking.userId)],
      });
    }

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getBookingsOfOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "Invalid ownerId" });
    }

    const ownerCars = await Car.find({ ownerId }).lean();
    if (ownerCars.length === 0) {
      return res.status(200).json([]);
    }

    const carMap = new Map(ownerCars.map((car) => [String(car._id), car]));
    const carIds = ownerCars.map((car) => car._id);
    const bookings = await CarBooking.find({ carId: { $in: carIds } }).lean();

    const enrichedBookings = bookings.map((booking) => {
      const car = carMap.get(String(booking.carId));
      const fullSeatDetails = buildSeatDetails(car, booking.seats || []);
      const totalSeatPrice = fullSeatDetails.reduce((sum, seat) => {
        return sum + (seat?.seatPrice || car?.perPersonCost || 0);
      }, 0);

      return {
        ...booking,
        availableSeatsOnCar: car?.seatConfig || [],
        seats: fullSeatDetails,
        totalSeatPrice,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getBookingBookedBy = async (req, res) => {
  try {
    const customerMobile = req.body?.customerMobile || req.query?.customerMobile;
    if (!customerMobile) {
      return res.status(400).json({ message: "customerMobile is required" });
    }

    const bookings = await CarBooking.find({ customerMobile }).lean();
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    const carIds = [...new Set(bookings.map((booking) => String(booking.carId)))];
    const cars = await Car.find({ _id: { $in: carIds } }).lean();
    const carMap = new Map(cars.map((car) => [String(car._id), car]));

    const enrichedBookings = bookings.map((booking) => {
      const car = carMap.get(String(booking.carId));
      const bookedSeats = buildSeatDetails(car, booking.seats || []);

      return {
        ...booking,
        carDetails: car
          ? {
              _id: car._id,
              make: car.make,
              model: car.model,
              vehicleNumber: car.vehicleNumber,
              images: car.images,
              seater: car.seater,
              sharingType: car.sharingType,
              vehicleType: car.vehicleType,
              bookedSeats,
            }
          : null,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getCarBookingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const bookings = await CarBooking.find({ userId }).lean();
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    const carIds = [...new Set(bookings.map((booking) => String(booking.carId)))];
    const cars = await Car.find({ _id: { $in: carIds } }).lean();
    const carMap = new Map(cars.map((car) => [String(car._id), car]));

    const enrichedBookings = bookings.map((booking) => {
      const car = carMap.get(String(booking.carId));
      const bookedSeats = buildSeatDetails(car, booking.seats || []);

      return {
        ...booking,
        carDetails: car
          ? {
              _id: car._id,
              make: car.make,
              model: car.model,
              vehicleNumber: car.vehicleNumber,
              images: car.images,
              seater: car.seater,
              sharingType: car.sharingType,
              vehicleType: car.vehicleType,
              bookedSeats,
            }
          : null,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching user's booking data:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
