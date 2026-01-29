const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["adult", "child"], required: true },
    fullName: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date }
  },
  { _id: false }
);

const tourBookingSchema = new mongoose.Schema(
  {
    // public booking code (PNR style)
    bookingCode: {
      type: String,
      unique: true,
      index: true,
      default: () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array.from({ length: 10 })
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join("");
      }
    },

    // references (string kept for flexibility)
    userId: { type: String, required: true, index: true },
    tourId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true },

    // seat info
    seats: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v);
        },
        message: "Seats must be an array"
      }
    },

    status: {
      type: String,
      enum: ["pending", "held", "confirmed", "cancelled", "failed"],
      default: "pending",
      index: true
    },

    // passenger counts
    numberOfAdults: { type: Number, default: 1, min: 0 },
    numberOfChildren: { type: Number, default: 0, min: 0 },

    passengers: { type: [passengerSchema], default: [] },

    isCustomizable: { type: Boolean, default: false },

    // snapshot fields
    travelAgencyName: String,
    agencyPhone: String,
    agencyEmail: String,

    visitngPlaces: String,
    country: String,
    state: String,
    city: String,
    themes: String,

    tourStartDate: Date,

    nights: Number,
    days: Number,
    from: Date,
    to: Date,

    // pricing snapshot
    basePrice: { type: Number, default: 0 },
    seatPrice: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // policy snapshot
    amenities: [String],
    inclusion: [String],
    exclusion: [String],
    termsAndConditions: { type: Map, of: String },
    dayWise: [{ day: Number, description: String }],

    // payment snapshot
    payment: {
      provider: String,
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

/**
 * 🔒 Validation: seats vs passengers
 */
tourBookingSchema.pre("save", function (next) {
  const totalPassengers =
    (this.numberOfAdults || 0) + (this.numberOfChildren || 0);

  if (this.seats.length && this.seats.length !== totalPassengers) {
    return next(
      new Error("Number of seats must match total passengers")
    );
  }

  next();
});

// indexes
tourBookingSchema.index({ userId: 1, createdAt: -1 });
tourBookingSchema.index({ tourId: 1, vehicleId: 1, createdAt: -1 });
tourBookingSchema.index({ bookingCode: 1 }, { unique: true });
tourBookingSchema.index({ status: 1 });

module.exports = mongoose.model("TourBooking", tourBookingSchema);
