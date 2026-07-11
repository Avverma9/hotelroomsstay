#!/usr/bin/env node
const mongoose = require('mongoose');
const CarBooking = require('../models/travel/carBooking');
const Car = require('../models/travel/cars');
const CarOwner = require('../models/travel/carOwner');

// NOTE: This uses the same connection string found in config/db.js
const MONGO_URI = 'mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel';

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const carId = '6a523f6bab39b6701191532b';
    const ownerId = '6a523f6b145620217fcdca76';

    // Use string IDs; Mongoose will cast to ObjectId where necessary
    const delBookings = await CarBooking.deleteMany({ carId: carId });
    console.log('Deleted bookings count:', delBookings.deletedCount);

    const delCar = await Car.deleteMany({ _id: carId });
    console.log('Deleted car count:', delCar.deletedCount);

    const delOwner = await CarOwner.deleteMany({ _id: ownerId });
    console.log('Deleted owner count:', delOwner.deletedCount);

    await mongoose.disconnect();
    console.log('Disconnected, done.');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { await mongoose.disconnect(); } catch(e) {}
    process.exit(1);
  }
})();
