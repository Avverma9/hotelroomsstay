const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: false,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    contacts: [
        {
            userId: {
                type: String,
                required: true,
            },
            name: String,
            mobile: String,
            email: String,
        }
    ]
});

module.exports = mongoose.model('Contact', contactSchema);
