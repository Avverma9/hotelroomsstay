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

    const carId = '6a523f6bab39b6701191532b';
    const ownerId = '6a523f6b145620217fcdca76';

    // Use string IDs; Mongoose will cast to ObjectId where necessary
    const delBookings = await CarBooking.deleteMany({ carId: carId });

    const delCar = await Car.deleteMany({ _id: carId });

    const delOwner = await CarOwner.deleteMany({ _id: ownerId });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { await mongoose.disconnect(); } catch(e) {}
    process.exit(1);
  }
})();
