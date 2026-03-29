const mongoose = require("mongoose");

const generateComplaintId = () => {
    const min = 10000000; // Minimum 8-digit number
    const max = 99999999; // Maximum 8-digit number
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const updateHistorySchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Resolved', 'Working'],
        },
        feedBack: String,
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false } // Avoid creating _id for each sub-document
);

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'hotels',
        required: true,
    },
    complaintId: {
      type: String,
      default: generateComplaintId,
    },
    regarding: {
      type: String,
      enum: ["Booking", "Hotel", "Website", 'Service','Staff','Cleanliness','Food','Billing','Room','Other'],
    },
    hotelName: String,
    hotelEmail: String,
    bookingId: String,
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
