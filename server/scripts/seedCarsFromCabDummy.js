#!/usr/bin/env node
const connectDB = require('../config/db');
const Car = require('../models/travel/cars');
const CarOwner = require('../models/travel/carOwner');
const data = require('../cabDummy.json');

(async () => {
  try {
    await connectDB();

    console.log('Connected to DB. Clearing existing Car and carOwner collections...');
    await Car.deleteMany({});
    await CarOwner.deleteMany({});

    let created = 0;
    for (const item of data) {
      const ownerData = item.owner || {};
      const carData = item.car || {};

      // create owner
      const owner = await CarOwner.create(ownerData);

      // normalize date fields
      if (carData.dateAdded) carData.dateAdded = new Date(carData.dateAdded);
      if (carData.pickupD) carData.pickupD = new Date(carData.pickupD);
      if (carData.dropD) carData.dropD = new Date(carData.dropD);

      carData.ownerId = owner._id;

      await Car.create(carData);
      created++;
    }

    console.log(`Seed complete — inserted ${created} cars.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
})();
