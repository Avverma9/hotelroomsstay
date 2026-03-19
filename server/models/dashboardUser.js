const mongoose = require("mongoose");

const dashboardUser = new mongoose.Schema(
  {
    images: [String],
    name: String,
    mobile: {
      type: Number,
    },
    email: {
      type: String,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "PMS", "Developer", "TMS", "CA", "Rider"], //TMS - Travel Management , CA - Company Agent, PMS - Partner management system
    },
    address: String,
    pinCode: Number,
    city: String,
    resetOtp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },

    state: String,
    isOnline: { type: Boolean, default: false }, // Track online status
    lastSeen: {
      type: Date,
      default: null,
    },
    password: String,
    status: {
      type: Boolean,
      default: true,
    },
    contacts: [
      {
        userId: String,
      },
    ],
    sidebarPermissions: {
      mode: {
        type: String,
        enum: ["role_based", "custom"],
        default: "role_based",
      },
      allowedLinkIds: {
        type: [String],
        default: [],
      },
      blockedLinkIds: {
        type: [String],
        default: [],
      },
    },
    routePermissions: {
      mode: {
        type: String,
        enum: ["allow_all", "custom"],
        default: "allow_all",
      },
      allowedRoutes: {
        type: [String],
        default: [],
      },
      blockedRoutes: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("dashBoardUser", dashboardUser);
