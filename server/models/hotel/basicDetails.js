const mongoose = require('mongoose');
const RoomModel = require('./rooms');

const roomSchema = RoomModel.roomSchema;
const generateHotelId = () => {
    const min = 10000000; // Minimum 8-digit number
    const max = 99999999; // Maximum 8-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const hotelsSchema = new mongoose.Schema(
    {
        hotelId: {
            type: String,
            unique: true,
            default: generateHotelId,
        },
        images: {
            type: [String],
        },
        hotelName: {
            type: String,
        },
        description: String,
        hotelOwnerName: {
            type: String,
        },
        destination: {
            type: String,
        },
        onFront: {
            type: Boolean,
            default: false,
        },
        state: String,
        city: String,
        latitude: String,
        longitude: String,
        landmark: String,
        pinCode: Number,
        hotelCategory: String,
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        rating: {
            type: Number,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        // Detailed rating breakdown
        ratingBreakdown: {
            cleanliness: { type: Number, default: 0 },
            service: { type: Number, default: 0 },
            valueForMoney: { type: Number, default: 0 },
            location: { type: Number, default: 0 },
        },
        // Rating distribution (how many 1-star, 2-star, etc.)
        ratingDistribution: {
            oneStar: { type: Number, default: 0 },
            twoStar: { type: Number, default: 0 },
            threeStar: { type: Number, default: 0 },
            fourStar: { type: Number, default: 0 },
            fiveStar: { type: Number, default: 0 },
        },
        starRating: {
            type: String,
            default: '2',
        },
        propertyType: [String],
        contact: {
            type: Number,
        },
        isAccepted: {
            type: Boolean,
            default: false,
        },
        rooms: {
            type: [roomSchema],
            default: [],
        },

        foods: {
            type: [{}],
            ref: 'foods',
        },

        amenities: {
            type: [{}],
            ref: 'amenities',
        },

        policies: {
            type: [{}],
            ref: 'policies',
        },
        localId: {
            type: String,
            enum: ['Accepted', 'Not Accepted'],
            default: 'Accepted',
        },
        hotelEmail: String,
        generalManagerContact: String,
        salesManagerContact: String,
        customerWelcomeNote: String,
    },

    { timestamps: true }
);

// Add indexes for performance optimization
hotelsSchema.index({ isAccepted: 1 }); // Filter by acceptance
hotelsSchema.index({ onFront: 1 }); // Featured hotels
hotelsSchema.index({ city: 1 }); // City search
hotelsSchema.index({ state: 1 }); // State search
hotelsSchema.index({ starRating: 1 }); // Rating filter
hotelsSchema.index({ city: 1, isAccepted: 1 }); // Compound for city + accepted
hotelsSchema.index({ 'rooms.roomId': 1 }); // Room lookup

module.exports = mongoose.model('hotels', hotelsSchema);
