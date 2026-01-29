const mongoose = require('mongoose');
const gstSchema = new mongoose.Schema({
    gstPrice: {
        type: Number,
        required: true,
    },
    gstMaxThreshold : {
        type: Number,
        required: true,
    },
    gstMinThreshold : {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['Tour', 'Travel','Hotel'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model('GST', gstSchema);