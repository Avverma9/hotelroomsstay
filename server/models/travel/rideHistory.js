const mongoose = require("mongoose");

const routeSnapshotSchema = new mongoose.Schema(
  {
    pickupP: { type: String, default: "" },
    dropP: { type: String, default: "" },
    pickupD: { type: Date, default: null },
    dropD: { type: Date, default: null },
  },
  { _id: false },
);

const rideHistorySchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "carOwner",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["NEW_RIDE", "ROUTE_CHANGED"],
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarBooking",
      default: null,
    },
    bookingCode: {
      type: String,
      default: "",
      trim: true,
    },
    route: {
      type: routeSnapshotSchema,
      default: null,
    },
    previousRoute: {
      type: routeSnapshotSchema,
      default: null,
    },
    newRoute: {
      type: routeSnapshotSchema,
      default: null,
    },
    source: {
      type: String,
      enum: ["BOOKING", "CAR_UPDATE", "SYSTEM"],
      default: "SYSTEM",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

rideHistorySchema.index({ carId: 1, createdAt: -1 });
rideHistorySchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("RideHistory", rideHistorySchema);
