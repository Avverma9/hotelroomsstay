const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    path: { type: String, required: true, default: "/app/notifications" },
    message: { type: String, required: true },
    eventType: { type: String, default: "general" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    seenBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    userIds: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userIds: 1, createdAt: -1 });

const Notification = mongoose.model("UserNotification", notificationSchema);

module.exports = Notification;
