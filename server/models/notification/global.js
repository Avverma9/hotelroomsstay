const mongoose = require("mongoose");

// Define the notification schema
const globalNotificationSchema = new mongoose.Schema(
  {
    name: String,
    path: String,
    message: String,
    seenBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    userIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DashboardUser",
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create the model from the schema
const Notification = mongoose.model(
  "GlobalNotification",
  globalNotificationSchema
);

// Export the model
module.exports = Notification;
