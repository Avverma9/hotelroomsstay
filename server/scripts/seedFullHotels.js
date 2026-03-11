const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Hotel = require("../models/hotel/basicDetails");

const HOTEL_SOURCE = path.join(__dirname, "..", "hotel.md");

function loadHotelsFromMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();

  if (!raw) {
    throw new Error(`Seed source is empty: ${filePath}`);
  }

  const sanitized = raw
    .replace(/"localId:\s*"/g, '"localId": "')
    .replace(/"foodType:\s*"/g, '"foodType": "')
    .replace(/"unmarriedCouplesAllowed:\s*"/g, '"unmarriedCouplesAllowed": "');

  const wrapped = `[${sanitized}]`;
  const hotels = Function(`"use strict"; return (${wrapped});`)();

  if (!Array.isArray(hotels)) {
    throw new Error("Seed source did not evaluate to an array");
  }

  return hotels.map((hotel) => ({
    ...hotel,
    localId: hotel.localId || "Accepted",
    rooms: Array.isArray(hotel.rooms) ? hotel.rooms : [],
    foods: Array.isArray(hotel.foods) ? hotel.foods : [],
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    policies: Array.isArray(hotel.policies) ? hotel.policies : [],
  }));
}

async function seedHotels() {
  try {
    await connectDB();

    const hotels = loadHotelsFromMarkdown(HOTEL_SOURCE);

    for (const hotel of hotels) {
      await Hotel.findOneAndUpdate(
        { hotelId: String(hotel.hotelId) },
        { $set: hotel },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(
      `Seeded ${hotels.length} hotels from ${path.basename(HOTEL_SOURCE)}.`
    );
  } catch (error) {
    console.error("Failed to seed hotels:", error);
    process.exitCode = 1;
  } finally {
    await Hotel.db.close();
  }
}

seedHotels();
