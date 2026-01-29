const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    complaintId: {
        type: String,
        required: true,
        // ref: "Complaint",
    },
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("Chat", chatSchema);