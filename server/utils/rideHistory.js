const mongoose = require("mongoose");
const RideHistory = require("../models/travel/rideHistory");

const normalizeText = (value) => String(value || "").trim();

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const routeSnapshotFrom = (data = {}) => ({
  pickupP: normalizeText(data.pickupP),
  dropP: normalizeText(data.dropP),
  pickupD: toDateOrNull(data.pickupD),
  dropD: toDateOrNull(data.dropD),
});

const hasRouteChanged = (previousRoute, newRoute) => {
  if (!previousRoute || !newRoute) return false;

  const prevPickupD = previousRoute.pickupD ? new Date(previousRoute.pickupD).toISOString() : "";
  const prevDropD = previousRoute.dropD ? new Date(previousRoute.dropD).toISOString() : "";
  const nextPickupD = newRoute.pickupD ? new Date(newRoute.pickupD).toISOString() : "";
  const nextDropD = newRoute.dropD ? new Date(newRoute.dropD).toISOString() : "";

  return (
    normalizeText(previousRoute.pickupP) !== normalizeText(newRoute.pickupP) ||
    normalizeText(previousRoute.dropP) !== normalizeText(newRoute.dropP) ||
    prevPickupD !== nextPickupD ||
    prevDropD !== nextDropD
  );
};

const writeRideHistory = async (payload) => {
  try {
    return await RideHistory.create(payload);
  } catch (error) {
    console.error("rideHistory write failed:", error?.message || error);
    return null;
  }
};

const logNewRideEvent = async ({ car, booking, source = "BOOKING", metadata = {} }) => {
  if (!car?._id || !car?.ownerId || !booking?._id) return null;
  return writeRideHistory({
    carId: car._id,
    ownerId: car.ownerId,
    eventType: "NEW_RIDE",
    bookingId: booking._id,
    bookingCode: booking.bookingId || "",
    route: routeSnapshotFrom(booking),
    source,
    metadata,
  });
};

const logRouteChangedEvent = async ({
  car,
  previousRoute,
  newRoute,
  source = "CAR_UPDATE",
  metadata = {},
}) => {
  if (!car?._id || !car?.ownerId) return null;
  if (!hasRouteChanged(previousRoute, newRoute)) return null;

  return writeRideHistory({
    carId: car._id,
    ownerId: car.ownerId,
    eventType: "ROUTE_CHANGED",
    previousRoute,
    newRoute,
    route: newRoute,
    source,
    metadata,
  });
};

const toObjectIdOrNull = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

module.exports = {
  routeSnapshotFrom,
  hasRouteChanged,
  logNewRideEvent,
  logRouteChangedEvent,
  toObjectIdOrNull,
};
