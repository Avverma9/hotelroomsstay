const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Hotel = require("../models/hotel/basicDetails");
const Room = require("../models/hotel/rooms");
const Food = require("../models/hotel/foods");
const Policy = require("../models/hotel/policies");
const Amenity = require("../models/hotel/amenities");

const SOURCE_FILE = path.join(__dirname, "..", "dummy.json");

const loadDummyHotels = () => {
  const hotels = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));

  if (!Array.isArray(hotels) || hotels.length === 0) {
    throw new Error("dummy.json must contain a non-empty array of hotels.");
  }

  const hotelIds = hotels.map((hotel) => String(hotel.hotelId || "").trim());
  if (hotelIds.some((hotelId) => !hotelId)) {
    throw new Error("Every dummy hotel must have a hotelId.");
  }

  if (new Set(hotelIds).size !== hotelIds.length) {
    throw new Error("Duplicate hotelId found in dummy.json.");
  }

  return hotels.map((hotel) => ({
    ...hotel,
    hotelId: String(hotel.hotelId),
    rooms: Array.isArray(hotel.rooms) ? hotel.rooms : [],
    foods: Array.isArray(hotel.foods) ? hotel.foods : [],
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    policies: hotel.policies || {},
  }));
};

async function seedDummyHotels() {
  try {
    await connectDB();
    const hotels = loadDummyHotels();

    // These collections contain hotel-owned data only. Do not touch users,
    // bookings, reviews, payments, or any other unrelated collections.
    const [deletedHotels, deletedRooms, deletedFoods, deletedPolicies, deletedAmenities] =
      await Promise.all([
        Hotel.deleteMany({}),
        Room.deleteMany({}),
        Food.deleteMany({}),
        Policy.deleteMany({}),
        Amenity.deleteMany({}),
      ]);

    const insertedHotels = await Hotel.insertMany(hotels, { ordered: true });

    console.log(`Cleared hotels: ${deletedHotels.deletedCount}`);
    console.log(`Cleared rooms: ${deletedRooms.deletedCount}`);
    console.log(`Cleared foods: ${deletedFoods.deletedCount}`);
    console.log(`Cleared policies: ${deletedPolicies.deletedCount}`);
    console.log(`Cleared amenities: ${deletedAmenities.deletedCount}`);
    console.log(`Seeded hotels: ${insertedHotels.length}`);
    console.log(`Hotel IDs: ${insertedHotels.map((hotel) => hotel.hotelId).join(", ")}`);
  } catch (error) {
    console.error("Failed to seed dummy hotels:", error.message || error);
    process.exitCode = 1;
  } finally {
    await Hotel.db.close();
  }
}

seedDummyHotels();
