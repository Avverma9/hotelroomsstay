const mongoose = require('mongoose');

const carOwnerSchema = new mongoose.Schema(
    {
        name: String,
        role: {
            type: String,
            default: 'TMS',
        },
        images: [String],
        mobile: Number,
        email: String,
        dl: String,
        dlImage: [String],
        city: String,
        state: String,
        address: String,
        pinCode: Number,
    },
    { timestamps: true }
);

module.exports = mongoose.model('carOwner', carOwnerSchema);
