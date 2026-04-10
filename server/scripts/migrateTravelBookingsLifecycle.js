const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const CarBooking = require("../models/travel/carBooking");

const VALID_RIDE_STATUSES = new Set([
  "AwaitingConfirmation",
  "Available",
  "Ride in Progress",
  "Ride Completed",
  "Cancelled",
  "Failed",
]);

// Map old enum values to new ones (migration compatibility)
const LEGACY_RIDE_STATUS_MAP = {
  "AwaitingPickup": "Available",
  "InProgress":     "Ride in Progress",
  "Completed":      "Ride Completed",
};

const generateVerificationCode = () =>
  crypto.randomInt(100000, 1000000).toString();

const resolveRideStatus = (booking) => {
  // Migrate legacy values
  if (LEGACY_RIDE_STATUS_MAP[booking.rideStatus]) {
    return LEGACY_RIDE_STATUS_MAP[booking.rideStatus];
  }
  if (VALID_RIDE_STATUSES.has(booking.rideStatus)) {
    return booking.rideStatus;
  }

  switch (booking.bookingStatus) {
    case "Confirmed":
      return "Available";
    case "Completed":
      return "Ride Completed";
    case "Cancelled":
      return "Cancelled";
    case "Failed":
      return "Failed";
    default:
      return "AwaitingConfirmation";
  }
};

const buildUpdate = (booking) => {
  const update = {};

  if (!booking.pickupCode) {
    update.pickupCode = generateVerificationCode();
  }

  if (!booking.dropCode) {
    update.dropCode = generateVerificationCode();
  }

  const rideStatus = resolveRideStatus(booking);
  if (booking.rideStatus !== rideStatus) {
    update.rideStatus = rideStatus;
  }

  if (booking.bookingStatus === "Confirmed" && !booking.confirmedAt) {
    update.confirmedAt = booking.updatedAt || booking.createdAt || new Date();
  }

  if (booking.isPaid === true && !booking.paymentConfirmedAt) {
    update.paymentConfirmedAt = booking.updatedAt || booking.createdAt || new Date();
  }

  if (booking.bookingStatus === "Completed" && !booking.rideCompletedAt) {
    update.rideCompletedAt = booking.updatedAt || booking.createdAt || new Date();
  }

  if (booking.bookingStatus === "Cancelled" && !booking.cancelledAt) {
    update.cancelledAt = booking.updatedAt || booking.createdAt || new Date();
  }

  if (booking.assignedDriverId === undefined) {
    update.assignedDriverId = "";
  }

  if (booking.assignedDriverName === undefined) {
    update.assignedDriverName = "";
  }

  return update;
};

const run = async () => {
  try {
    await connectDB();

    const bookings = await CarBooking.find({}).lean();
    const ops = [];
    let updated = 0;
    let skipped = 0;

    for (const booking of bookings) {
      const update = buildUpdate(booking);
      if (Object.keys(update).length === 0) {
        skipped += 1;
        continue;
      }

      ops.push({
        updateOne: {
          filter: { _id: booking._id },
          update: { $set: update },
        },
      });
      updated += 1;
    }

    if (ops.length > 0) {
      await CarBooking.bulkWrite(ops);
    }

    console.log("Travel booking lifecycle migration complete");
    console.table([
      {
        total: bookings.length,
        updated,
        skipped,
      },
    ]);
  } catch (error) {
    console.error("Failed to migrate travel bookings:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();