const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
    },
    name: {
      type: String,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DashboardUser",
    },
    mobile: {
      type: Number,
    },
    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
