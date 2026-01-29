const mongoose = require("mongoose");

const generateComplaintId = () => {
  const min = 10000000; // Minimum 8-digit number
  const max = 99999999; // Maximum 8-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Sub-schema for update history
const updateHistorySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resolved", "Working"],
    },
    feedBack: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Avoid creating _id for each sub-document
);

// Main Complaint schema
const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    hotelId: {
      type: String,
      required: true,
    },
    hotelEmail: {
      type: String,
    },
    complaintId: {
      type: String,
      default: generateComplaintId,
    },
    regarding: {
      type: String,
      enum: ["Booking", "Hotel", "Website"],
    },
    hotelName: String,
    bookingId: String,
    feedBack: String, // Latest feedback (optional, for convenience)
    images: [String],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected", "Resolved", "Working"],
      default: "Pending",
    },
    updatedBy: [updateHistorySchema], // Timeline of updates
    issue: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
