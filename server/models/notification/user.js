const mongoose = require("mongoose");

// Define the notification schema
const notificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    path: { type: String, required: true },
    message: { type: String, required: true },
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
const Notification = mongoose.model("UserNotification", notificationSchema);

// Export the model
module.exports = Notification;
