const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vehicleNumber: { type: String },

    totalSeats: { type: Number, required: true, min: 1 },

    // 🔥 structured seat config
    seatConfig: {
      rows: { type: Number, required: true }, // total rows
      left: { type: Number, required: true }, // seats on left side
      right: { type: Number, required: true }, // seats on right side
      aisle: { type: Boolean, default: true }, // aisle present or not
    },

    seaterType: { type: String }, // "2x2" (display purpose only)

    seatLayout: { type: [String], default: [] }, // auto / custom
    bookedSeats: { type: [String], default: [] },

    pricePerSeat: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const tourSchema = new mongoose.Schema(
  {
    travelAgencyName: String,
    agencyId: String,
    agencyPhone: String,
    agencyEmail: String,
    isAccepted: { type: Boolean, default: false },

    country: String,
    state: String,
    city: String,
    visitngPlaces: String,
    themes: String,

    price: Number,
    nights: Number,
    days: Number,
    from: Date,
    isCustomizable: { type: Boolean, default: false },
    to: Date,

    amenities: [String],
    inclusion: [String],
    exclusion: [String],

    termsAndConditions: { type: Map, of: String },

    dayWise: [{ day: Number, description: String }],

    starRating: { type: Number, min: 1, max: 5 },
    images: [String],

    // NEW: vehicles inventory
    vehicles: { type: [vehicleSchema], default: [] },

    // Trip dates & status
    tourStartDate: { type: Date },
    tourEndDate: { type: Date },

    // Auto-generated from visitingPlaces e.g. "Patna->Delhi->Mumbai"
    route: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Tour", tourSchema);
