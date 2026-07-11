const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ownerAvailabilitySchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'carOwner', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // mode: 'available' indicates owner explicitly available for this range;
    // 'unavailable' indicates owner is NOT available.
    mode: { type: String, enum: ['available', 'unavailable'], default: 'unavailable' },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'dashBoardUser' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ownerAvailability', ownerAvailabilitySchema);
