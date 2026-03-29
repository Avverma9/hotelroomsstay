const crypto = require("crypto");
const mongoose = require("mongoose");
const CarBooking = require("../../models/travel/carBooking");
const Car = require("../../models/travel/cars");
const { getGSTData } = require("../GST/gst");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

const BOOKING_STATUS = new Set([
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Failed",
]);
const RIDE_STATUS = new Set([
  "AwaitingConfirmation",
  "AwaitingPickup",
  "InProgress",
  "Completed",
  "Cancelled",
  "Failed",
]);
const RELEASE_SEAT_STATUS = new Set(["Completed", "Cancelled", "Failed"]);
const BOOKING_STATUS_TRANSITIONS = new Map([
  ["Pending", new Set(["Confirmed", "Cancelled", "Failed"])],
  ["Confirmed", new Set(["Completed", "Cancelled", "Failed"])],
  ["Completed", new Set()],
  ["Cancelled", new Set()],
  ["Failed", new Set()],
]);
const RIDE_STATUS_TRANSITIONS = new Map([
  ["AwaitingConfirmation", new Set(["AwaitingPickup", "Cancelled", "Failed"])],
  ["AwaitingPickup", new Set(["InProgress", "Cancelled", "Failed"])],
  ["InProgress", new Set(["Completed", "Failed"])],
  ["Completed", new Set()],
  ["Cancelled", new Set()],
  ["Failed", new Set()],
]);
const ALLOWED_UPDATE_FIELDS = new Set([
  "customerMobile",
  "customerEmail",
  "bookedBy",
  "bookingStatus",
  "cancellationReason",
  "assignedDriverId",
  "assignedDriverName",
  "isPaid",
  "paymentId",
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

const generateVerificationCode = () =>
  crypto.randomInt(100000, 1000000).toString();

const normalizeBoolean = (value) => value === true || value === "true";

const canTransition = (transitionMap, currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return true;
  }

  return Boolean(transitionMap.get(currentStatus)?.has(nextStatus));
};

const sendTravelEmailSafe = async ({ email, subject, message }) => {
  try {
    await sendCustomEmail({
      email,
      subject,
      message,
      link: process.env.FRONTEND_URL,
    });
  } catch (error) {
    console.error("Travel booking email failed:", error.message);
  }
};

const notifyTravelEventSafe = async ({
  booking,
  name,
  message,
  eventType,
  metadata = {},
}) => {
  await createUserNotificationSafe({
    name,
    message,
    path: "/app/bookings/travel",
    eventType,
    metadata: {
      bookingId: booking.bookingId,
      bookingStatus: booking.bookingStatus,
      rideStatus: booking.rideStatus,
      carId: String(booking.carId),
      ...metadata,
    },
    userIds: [String(booking.userId)],
  });
};

const applyPaymentDetails = (booking, { isPaid, paymentId } = {}) => {
  if (paymentId !== undefined) {
    booking.paymentId = String(paymentId || "").trim();
  }

  if (isPaid !== undefined) {
    booking.isPaid = normalizeBoolean(isPaid);
  }

  if (booking.isPaid && !booking.paymentConfirmedAt) {
    booking.paymentConfirmedAt = new Date();
  }
};

const ensureLifecycleFields = (booking) => {
  if (!booking.pickupCode) {
    booking.pickupCode = generateVerificationCode();
  }

  if (!booking.dropCode) {
    booking.dropCode = generateVerificationCode();
  }

  if (!booking.rideStatus || !RIDE_STATUS.has(booking.rideStatus)) {
    if (booking.bookingStatus === "Confirmed") {
      booking.rideStatus = "AwaitingPickup";
    } else if (booking.bookingStatus === "Completed") {
      booking.rideStatus = "Completed";
    } else if (booking.bookingStatus === "Cancelled") {
      booking.rideStatus = "Cancelled";
    } else if (booking.bookingStatus === "Failed") {
      booking.rideStatus = "Failed";
    } else {
      booking.rideStatus = "AwaitingConfirmation";
    }
  }

  if (booking.bookingStatus === "Confirmed" && !booking.confirmedAt) {
    booking.confirmedAt = booking.updatedAt || new Date();
  }

  if (booking.isPaid && !booking.paymentConfirmedAt) {
    booking.paymentConfirmedAt = booking.updatedAt || new Date();
  }
};

const applyBookingStatusChange = (booking, nextStatus, options = {}) => {
  const now = new Date();
  const previousStatus = booking.bookingStatus;

  if (!canTransition(BOOKING_STATUS_TRANSITIONS, previousStatus, nextStatus)) {
    throw new Error(
      `Booking status transition ${previousStatus} -> ${nextStatus} is not allowed`,
    );
  }

  booking.bookingStatus = nextStatus;

  if (nextStatus === "Confirmed") {
    booking.confirmedAt = booking.confirmedAt || now;
    if (
      canTransition(
        RIDE_STATUS_TRANSITIONS,
        booking.rideStatus,
        "AwaitingPickup",
      )
    ) {
      booking.rideStatus = "AwaitingPickup";
    }
  }

  if (nextStatus === "Cancelled") {
    booking.rideStatus = "Cancelled";
    booking.cancelledAt = now;
    booking.cancellationReason = String(
      options.cancellationReason || booking.cancellationReason || "",
    ).trim();
  }

  if (nextStatus === "Failed") {
    booking.rideStatus = "Failed";
  }

  if (nextStatus === "Completed") {
    booking.rideStatus = "Completed";
    booking.rideCompletedAt = booking.rideCompletedAt || now;
  }

  return previousStatus;
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
      isPaid,
      confirmOnCreate,
      assignedDriverId,
      assignedDriverName,
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
    const shouldConfirmOnCreate = normalizeBoolean(confirmOnCreate);

    // Determine payment mode — offline bookings are admin-created (e.g. cash, panel)
    // Online bookings must go through PhonePe; isPaid from request body is ignored.
    const resolvedPaymentMode =
      String(paymentMethod || "").toLowerCase() === "offline" ||
      String(paymentMethod || "").toLowerCase() === "cash"
        ? "offline"
        : "online";

    // isPaid: only allowed at creation for offline bookings;
    // online bookings start as unpaid and are confirmed via /payment/verify.
    const resolvedIsPaid =
      resolvedPaymentMode === "offline" ? normalizeBoolean(isPaid) : false;

    const pickupCode = generateVerificationCode();
    const dropCode = generateVerificationCode();
    // Offline bookings can be confirmed at creation; online stays Pending until paid.
    const initialBookingStatus =
      shouldConfirmOnCreate || (resolvedPaymentMode === "offline" && resolvedIsPaid)
        ? "Confirmed"
        : "Pending";
    const initialRideStatus =
      initialBookingStatus === "Confirmed" ? "AwaitingPickup" : "AwaitingConfirmation";
    const now = new Date();

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
        paymentMode: resolvedPaymentMode,
        paymentMethod: paymentMethod || "Online",
        paymentId: "",
        phonepeOrderId: "",
        isPaid: resolvedIsPaid,
        paymentConfirmedAt: resolvedIsPaid ? now : undefined,
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
        bookingStatus: initialBookingStatus,
        rideStatus: initialRideStatus,
        confirmedAt: initialBookingStatus === "Confirmed" ? now : undefined,
        assignedDriverId: String(assignedDriverId || "").trim(),
        assignedDriverName: String(assignedDriverName || "").trim(),
        pickupCode,
        dropCode,
      });
    } catch (bookingError) {
      await releaseSeatsByIds({
        carId: reservedCar._id,
        seatIds: bookedSeatIds,
        bookedBy: effectiveBookedBy,
      });
      throw bookingError;
    }

    const isConfirmed = initialBookingStatus === "Confirmed";
    await sendTravelEmailSafe({
      email: customerEmail,
      subject: isConfirmed
        ? "Your Travel Booking is Confirmed"
        : "Your Travel Booking Request is Pending",
      message: isConfirmed
        ? `Your booking (ID: ${newBooking.bookingId}) is confirmed. Vehicle Number: ${reservedCar.vehicleNumber}. Pickup code: ${pickupCode}.`
        : `Your booking request (ID: ${newBooking.bookingId}) has been received and is awaiting payment confirmation.`,
    });

    await notifyTravelEventSafe({
      booking: newBooking,
      name: isConfirmed ? "Travel Booking Confirmed" : "Travel Booking Pending",
      message: isConfirmed
        ? `Your travel booking ${newBooking.bookingId} is confirmed.`
        : `Your travel booking ${newBooking.bookingId} is pending payment confirmation.`,
      eventType: isConfirmed ? "travel_booking_confirmed" : "travel_booking_pending",
    });

    return res.status(201).json({
      success: true,
      message: isConfirmed
        ? "Booking confirmed successfully"
        : "Booking created successfully. Complete payment via /payment/create-order/travel/:id",
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

exports.confirmTravelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedDriverId, assignedDriverName, isPaid, paymentId } = req.body;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await CarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    ensureLifecycleFields(booking);
    applyPaymentDetails(booking, { isPaid, paymentId });
    booking.assignedDriverId = String(assignedDriverId || booking.assignedDriverId || "").trim();
    booking.assignedDriverName = String(
      assignedDriverName || booking.assignedDriverName || "",
    ).trim();

    const previousStatus = applyBookingStatusChange(booking, "Confirmed");
    await booking.save();

    if (previousStatus !== "Confirmed") {
      await sendTravelEmailSafe({
        email: booking.customerEmail,
        subject: "Your Travel Booking is Confirmed",
        message: `Your travel booking ${booking.bookingId} is confirmed. Pickup code: ${booking.pickupCode}.`,
      });

      await notifyTravelEventSafe({
        booking,
        name: "Travel Booking Confirmed",
        message: `Your travel booking ${booking.bookingId} is confirmed.`,
        eventType: "travel_booking_confirmed",
      });
    }

    return res.status(200).json({
      message: "Travel booking confirmed successfully",
      booking,
    });
  } catch (error) {
    console.error("confirmTravelBooking error:", error);
    return res.status(400).json({
      message: error.message || "Unable to confirm booking",
    });
  }
};

exports.changeBookingStatus = async (req, res) => {
  try {
    const {
      bookingStatus,
      cancellationReason,
      assignedDriverId,
      assignedDriverName,
      isPaid,
      paymentId,
      bypassCodeVerification,
    } = req.body;
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
    ensureLifecycleFields(booking);
    if (
      bookingStatus === "Completed" &&
      !booking.dropCodeVerifiedAt &&
      !normalizeBoolean(bypassCodeVerification)
    ) {
      return res.status(400).json({
        message: "Use drop code verification before marking booking completed",
      });
    }

    applyPaymentDetails(booking, { isPaid, paymentId });
    if (assignedDriverId !== undefined) {
      booking.assignedDriverId = String(assignedDriverId || "").trim();
    }
    if (assignedDriverName !== undefined) {
      booking.assignedDriverName = String(assignedDriverName || "").trim();
    }

    const previousStatus = applyBookingStatusChange(booking, bookingStatus, {
      cancellationReason,
    });
    await booking.save();

    if (previousStatus !== "Confirmed" && booking.bookingStatus === "Confirmed") {
      await sendTravelEmailSafe({
        email: booking.customerEmail,
        subject: "Your Travel Booking is Confirmed",
        message: `Your travel booking ${booking.bookingId} is confirmed. Pickup code: ${booking.pickupCode}.`,
      });

      await notifyTravelEventSafe({
        booking,
        name: "Travel Booking Confirmed",
        message: `Your travel booking ${booking.bookingId} is confirmed.`,
        eventType: "travel_booking_confirmed",
      });
    }

    if (previousStatus !== "Cancelled" && booking.bookingStatus === "Cancelled") {
      await notifyTravelEventSafe({
        booking,
        name: "Travel Booking Cancelled",
        message: `Your travel booking ${booking.bookingId} has been cancelled.`,
        eventType: "travel_booking_cancelled",
      });
    }

    if (previousStatus !== "Failed" && booking.bookingStatus === "Failed") {
      await notifyTravelEventSafe({
        booking,
        name: "Travel Booking Failed",
        message: `Your travel booking ${booking.bookingId} has failed.`,
        eventType: "travel_booking_failed",
      });
    }

    if (previousStatus !== "Completed" && booking.bookingStatus === "Completed") {
      await notifyTravelEventSafe({
        booking,
        name: "Travel Ride Completed",
        message: `Your travel ride ${booking.bookingId} has been completed successfully.`,
        eventType: "travel_ride_completed",
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
    return res.status(400).json({
      message: error.message || "Something went wrong",
    });
  }
};

exports.verifyPickupCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupCode } = req.body;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    if (!pickupCode) {
      return res.status(400).json({ message: "pickupCode is required" });
    }

    const booking = await CarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    ensureLifecycleFields(booking);
    if (booking.bookingStatus !== "Confirmed") {
      return res.status(400).json({
        message: "Only confirmed bookings can verify pickup code",
      });
    }
    if (booking.rideStatus !== "AwaitingPickup") {
      return res.status(400).json({
        message: "Pickup code can only be verified before ride starts",
      });
    }
    if (String(booking.pickupCode) !== String(pickupCode).trim()) {
      return res.status(400).json({ message: "Invalid pickup code" });
    }

    booking.rideStatus = "InProgress";
    booking.pickupCodeVerifiedAt = new Date();
    booking.rideStartedAt = booking.rideStartedAt || new Date();
    await booking.save();

    await notifyTravelEventSafe({
      booking,
      name: "Travel Ride Started",
      message: `Your travel ride ${booking.bookingId} has started successfully.`,
      eventType: "travel_ride_started",
    });

    return res.status(200).json({
      message: "Pickup code verified successfully",
      booking,
    });
  } catch (error) {
    console.error("verifyPickupCode error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.verifyDropCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { dropCode } = req.body;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    if (!dropCode) {
      return res.status(400).json({ message: "dropCode is required" });
    }

    const booking = await CarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    ensureLifecycleFields(booking);
    if (booking.bookingStatus !== "Confirmed") {
      return res.status(400).json({
        message: "Only confirmed bookings can verify drop code",
      });
    }
    if (booking.rideStatus !== "InProgress") {
      return res.status(400).json({
        message: "Drop code can only be verified for in-progress rides",
      });
    }
    if (String(booking.dropCode) !== String(dropCode).trim()) {
      return res.status(400).json({ message: "Invalid drop code" });
    }

    booking.dropCodeVerifiedAt = new Date();
    booking.rideCompletedAt = new Date();
    booking.rideStatus = "Completed";
    booking.bookingStatus = "Completed";
    await booking.save();
    await releaseSeatsForBooking(booking);

    await notifyTravelEventSafe({
      booking,
      name: "Travel Ride Completed",
      message: `Your travel ride ${booking.bookingId} has been completed successfully.`,
      eventType: "travel_ride_completed",
    });

    await sendTravelEmailSafe({
      email: booking.customerEmail,
      subject: "Your Travel Ride is Completed",
      message: `Your travel booking ${booking.bookingId} has been completed successfully.`,
    });

    return res.status(200).json({
      message: "Drop code verified successfully",
      booking,
    });
  } catch (error) {
    console.error("verifyDropCode error:", error);
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
    ensureLifecycleFields(booking);
    if (data.bookingStatus === "Completed" && !booking.dropCodeVerifiedAt) {
      return res.status(400).json({
        message: "Use drop code verification before marking booking completed",
      });
    }

    const previousStatus = booking.bookingStatus;
    if (
      data.assignedDriverId !== undefined ||
      data.assignedDriverName !== undefined
    ) {
      if (data.assignedDriverId !== undefined) {
        booking.assignedDriverId = String(data.assignedDriverId || "").trim();
      }
      if (data.assignedDriverName !== undefined) {
        booking.assignedDriverName = String(data.assignedDriverName || "").trim();
      }
    }

    applyPaymentDetails(booking, {
      isPaid: data.isPaid,
      paymentId: data.paymentId,
    });

    requestedFields.forEach((field) => {
      if (["bookingStatus", "assignedDriverId", "assignedDriverName", "isPaid", "paymentId"].includes(field)) {
        return;
      }

      booking[field] = data[field];
    });

    if (data.bookingStatus !== undefined) {
      applyBookingStatusChange(booking, data.bookingStatus, {
        cancellationReason: data.cancellationReason,
      });
    }

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
      await sendTravelEmailSafe({
        email: updatedBooking.customerEmail,
        subject: "Your Travel Booking is Confirmed",
        message: `Your travel booking ${updatedBooking.bookingId} is confirmed. Pickup code: ${updatedBooking.pickupCode}.`,
      });

      await notifyTravelEventSafe({
        booking: updatedBooking,
        name: "Travel Booking Confirmed",
        message: `Your travel booking ${updatedBooking.bookingId} is confirmed.`,
        eventType: "travel_booking_confirmed",
      });
    }

    if (
      previousStatus !== "Completed" &&
      updatedBooking.bookingStatus === "Completed"
    ) {
      await notifyTravelEventSafe({
        booking: updatedBooking,
        name: "Travel Ride Completed",
        message: `Your travel ride ${updatedBooking.bookingId} has been completed successfully.`,
        eventType: "travel_ride_completed",
      });
    }

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(400).json({
      message: error.message || "Something went wrong",
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
