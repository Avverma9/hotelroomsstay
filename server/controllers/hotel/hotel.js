const mongoose = require("mongoose");
const cron = require("node-cron");
const { DateTime } = require("luxon");
const { v4: uuidv4 } = require("uuid");

// Models
const hotelModel = require("../../models/hotel/basicDetails");
const monthModel = require("../../models/booking/monthly");
const bookingsModel = require("../../models/booking/booking");
const gstModel = require("../../models/GST/gst");
const dashboardUserModel = require("../../models/dashboardUser");
const amenitiesModel = require("../../models/hotel/amenities");
const policyModel = require("../../models/hotel/policies");

// Utils
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const { createUserNotificationSafe } = require("../notification/helpers");
const { getRoomBasePrice, getOfferAdjustedPrice, isOfferActive } = require("./offerUtils");

// --- HELPERS ---
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sanitizeInput = (input) => (typeof input === 'string' ? input.replace(/</g, '&lt;').replace(/>/g, '&gt;') : input);
const buildHotelQuery = (hotelId) => ({ hotelId: String(hotelId) });

const FIELD_ALIASES = {
  phone: "contact", mobile: "contact", contactNumber: "contact",
  owner: "hotelOwnerName", ownerName: "hotelOwnerName",
  address: "landmark", hotelAddress: "landmark", name: "hotelName",
};

const buildHotelUpdatePayload = (payload = {}) => {
  const normalized = { ...payload };
  for (const [alias, schemaField] of Object.entries(FIELD_ALIASES)) {
    if (normalized[alias] !== undefined && normalized[schemaField] === undefined) {
      normalized[schemaField] = normalized[alias];
    }
    delete normalized[alias];
  }

  const allowedFields = [
    "isAccepted", "onFront", "hotelName", "hotelOwnerName", "hotelEmail",
    "localId", "description", "customerWelcomeNote", "generalManagerContact",
    "salesManagerContact", "landmark", "pinCode", "hotelCategory",
    "propertyType", "starRating", "city", "state", "destination",
    "latitude", "longitude", "contact"
  ];

  const updatePayload = {};
  for (const field of allowedFields) {
    if (normalized[field] === undefined) continue;
    let val = normalized[field];
    if ((field === "isAccepted" || field === "onFront") && typeof val === "string") {
      val = ["true", "1", "yes"].includes(val.toLowerCase().trim());
    }

    if (field === "contact" || field === "pinCode") {
      if (val === null || val === undefined || String(val).trim() === "") {
        continue;
      }
      const numeric = Number(String(val).replace(/[^0-9.-]/g, ""));
      if (Number.isNaN(numeric)) {
        continue;
      }
      val = numeric;
    }

    updatePayload[field] = val;
  }
  return updatePayload;
};

const toPlainObject = (value) => {
  if (!value || typeof value !== "object") return {};
  return typeof value.toObject === "function" ? value.toObject() : { ...value };
};

const parseArrayField = (value, fieldName) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    console.warn(`${fieldName} is not a valid JSON array. Ignoring invalid payload.`);
    return [];
  }
};

const sanitizeNestedEntry = (entry = {}) => {
  if (!entry || typeof entry !== "object") return {};
  const clean = { ...entry };
  delete clean._clientKey;
  delete clean._id;
  delete clean.__v;
  return clean;
};

// --- CORE APIs ---

const createHotel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { hotelName, state, city, contact, hotelEmail, amenities, policies, ...rest } = req.body;

    if (!hotelName?.trim() || !state?.trim() || !city?.trim() || !contact?.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await hotelModel.findOne({
      hotelName: { $regex: `^${hotelName.trim()}$`, $options: 'i' },
      city: { $regex: `^${city.trim()}$`, $options: 'i' }
    });

    if (existing) {
      await session.abortTransaction();
      return res.status(409).json({ error: "Hotel already exists in this city" });
    }

    // Accept images uploaded directly (client -> S3) as `req.body.images` (JSON string or array),
    // or fall back to files uploaded via multer (`req.files`).
    let images = [];
    if (req.body && req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (e) {
        images = Array.isArray(req.body.images) ? req.body.images : [];
      }
    } else if (req.files) {
      images = req.files.map((f) => f.location);
    }
    const hotelData = {
      ...rest,
      hotelName: sanitizeInput(hotelName),
      state: sanitizeInput(state),
      city: sanitizeInput(city),
      contact: sanitizeInput(contact),
      hotelEmail,
      images,
      amenities: typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []),
      policies: typeof policies === 'string' ? JSON.parse(policies) : (policies || {}),
    };

    const [savedHotel] = await hotelModel.create([hotelData], { session });
    
    if (hotelData.amenities.length) {
      await amenitiesModel.create([{ hotelId: savedHotel.hotelId, amenities: hotelData.amenities }], { session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, data: { hotelId: savedHotel.hotelId } });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

const UpdateHotelMaster = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const hotel = await hotelModel.findOne(buildHotelQuery(hotelId));
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const roomUploadMap = new Map();
    const foodUploadMap = new Map();
    const hotelUploads = [];
    
    if (Array.isArray(req.files)) {
      req.files.forEach(f => {
        if (f.fieldname.startsWith("roomImages:")) {
          const key = f.fieldname.split(":")[1];
          if (!roomUploadMap.has(key)) roomUploadMap.set(key, []);
          roomUploadMap.get(key).push(f.location);
        } else if (f.fieldname.startsWith("foodImages:")) {
          const key = f.fieldname.split(":")[1];
          if (!foodUploadMap.has(key)) foodUploadMap.set(key, []);
          foodUploadMap.get(key).push(f.location);
        } else if (f.fieldname === "images") {
          hotelUploads.push(f.location);
        }
      });
    }

    // Update basic hotel fields
    Object.assign(hotel, buildHotelUpdatePayload(req.body));

    // Process rooms
    const roomsInput = parseArrayField(req.body.rooms, "rooms");
    if (Array.isArray(roomsInput)) {
      roomsInput.forEach(ri => {
        if (!ri || typeof ri !== "object") return;
        if (ri.roomId) {
          const idx = hotel.rooms.findIndex(r => String(r.roomId) === String(ri.roomId));
          if (idx !== -1) {
            if (ri._delete) {
              hotel.rooms.splice(idx, 1);
            } else {
              const uploads = roomUploadMap.get(String(ri.roomId)) || [];
              const existingRoom = toPlainObject(hotel.rooms[idx]);
              const incomingRoom = sanitizeNestedEntry(ri);
              hotel.rooms[idx] = {
                ...existingRoom,
                ...incomingRoom,
                roomId: existingRoom.roomId || incomingRoom.roomId,
              };
              if (uploads.length) {
                hotel.rooms[idx].images = [...(hotel.rooms[idx].images || []), ...uploads];
              }
            }
          }
        } else {
          const uploads = roomUploadMap.get(ri._clientKey) || [];
          const incomingRoom = sanitizeNestedEntry(ri);
          hotel.rooms.push({ 
            roomId: uuidv4().substr(0, 8), 
            ...incomingRoom,
            images: [...(incomingRoom.images || []), ...uploads] 
          });
        }
      });
    }

    // Process foods - Ensure foods array exists
    if (!hotel.foods) hotel.foods = [];
    
    const foodsInput = parseArrayField(req.body.foods, "foods");
    if (Array.isArray(foodsInput)) {
      foodsInput.forEach(fi => {
        if (!fi || typeof fi !== "object") return;
        if (fi.foodId) {
          const idx = hotel.foods.findIndex(f => String(f.foodId) === String(fi.foodId) || String(f.id) === String(fi.foodId));
          if (idx !== -1) {
            if (fi._delete) {
              hotel.foods.splice(idx, 1);
            } else {
              const uploads = foodUploadMap.get(String(fi.foodId)) || [];
              const existingFood = toPlainObject(hotel.foods[idx]);
              const incomingFood = sanitizeNestedEntry(fi);
              hotel.foods[idx] = {
                ...existingFood,
                ...incomingFood,
                foodId: existingFood.foodId || existingFood.id || incomingFood.foodId,
                id: existingFood.id || existingFood.foodId || incomingFood.foodId,
              };
              if (uploads.length) {
                hotel.foods[idx].images = [...(hotel.foods[idx].images || []), ...uploads];
              }
            }
          }
        } else {
          const uploads = foodUploadMap.get(fi._clientKey) || [];
          const incomingFood = sanitizeNestedEntry(fi);
          const newFoodId = uuidv4().substr(0, 8);
          hotel.foods.push({ 
            foodId: newFoodId,
            id: newFoodId,
            ...incomingFood,
            images: [...(incomingFood.images || []), ...uploads] 
          });
        }
      });
    }

    // Add new hotel images - ensure images array exists
    if (!hotel.images) hotel.images = [];
    if (hotelUploads.length) {
      hotel.images.push(...hotelUploads);
    }

    hotel.markModified('rooms');
    hotel.markModified('foods');
    hotel.markModified('images');
    
    await hotel.save();
    
    console.log('✅ Hotel updated successfully:', {
      hotelId,
      roomsCount: hotel.rooms.length,
      foodsCount: hotel.foods.length,
      imagesCount: hotel.images.length
    });
    
    res.json({ success: true, data: hotel });
  } catch (error) {
    console.error('❌ UpdateHotelMaster error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getHotelsByFilters = async (req, res) => {
  try {
    const { search, hotelName, city, state, isAccepted, minPrice, maxPrice, page = 1, limit = 10, sortBy = "price", sortOrder = "asc" } = req.query;

    let query = {};
    let andConditions = [];

    if (search && search !== "all") {
      const sRegex = { $regex: escapeRegex(search), $options: "i" };
      andConditions.push({
        $or: [{ hotelName: sRegex }, { city: sRegex }, { state: sRegex }, { destination: sRegex }]
      });
    }

    if (hotelName) andConditions.push({ hotelName: { $regex: escapeRegex(hotelName), $options: "i" } });
    if (city) andConditions.push({ city: { $regex: escapeRegex(city), $options: "i" } });
    if (state) andConditions.push({ state: { $regex: escapeRegex(state), $options: "i" } });
    
    const status = isAccepted === 'false' ? false : true;
    andConditions.push({ isAccepted: status });

    if (andConditions.length > 0) query.$and = andConditions;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [allHotels, gstData] = await Promise.all([
      hotelModel.find(query).skip(skip).limit(parseInt(limit)).lean(),
      gstModel.findOne({ type: "Hotel" }).lean()
    ]);

    const total = await hotelModel.countDocuments(query);

    const processed = allHotels.map(h => {
      const prices = (h.rooms || []).map(r => r.price || 0);
      return { ...h, startingPrice: prices.length ? Math.min(...prices) : 0 };
    });

    res.json({ success: true, total, data: processed, gstInfo: gstData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHotelsById = async (req, res) => {
  try {
    const hotel = await hotelModel.findOne({ hotelId: String(req.params.hotelId) }).lean();
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- METADATA & UTILITY APIs ---

const getCount = async (req, res) => res.json(await hotelModel.countDocuments({ isAccepted: true }));

const getCountPendingHotels = async (req, res) => {
  const count = await hotelModel.countDocuments({ isAccepted: false });
  res.json({ count });
};

const getHotelsCity = async (req, res) => {
  const cities = await hotelModel.distinct("city", { isAccepted: true });
  res.json(cities);
};

const getHotelsState = async (req, res) => {
  const states = await hotelModel.distinct("state");
  res.json(states);
};

const getHotelsCityByState = async (req, res) => {
  const cities = await hotelModel.distinct("city", { state: new RegExp(`^${req.query.state}$`, "i") });
  res.json(cities);
};

const deleteHotelImages = async (req, res) => {
  const { hotelId } = req.params;
  const { imageUrl, type, itemId } = req.query; // type: 'hotel', 'room', 'food'; itemId: roomId or foodId
  
  try {
    console.log('🗑️ Delete request:', { hotelId, imageUrl, type, itemId });
    
    const hotel = await hotelModel.findOne(buildHotelQuery(hotelId));
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    if (type === 'room' && itemId) {
      // Delete room image
      const roomIndex = hotel.rooms.findIndex(r => String(r.roomId) === String(itemId));
      if (roomIndex !== -1) {
        hotel.rooms[roomIndex].images = hotel.rooms[roomIndex].images.filter(img => img !== imageUrl);
        hotel.markModified('rooms');
        await hotel.save();
        console.log('✅ Room image deleted successfully');
        return res.json({ success: true, message: "Room image deleted", hotel });
      } else {
        return res.status(404).json({ success: false, message: "Room not found" });
      }
    } else if (type === 'food' && itemId) {
      // Delete food image
      const foodIndex = hotel.foods.findIndex(f => String(f.foodId) === String(itemId) || String(f.id) === String(itemId));
      if (foodIndex !== -1) {
        hotel.foods[foodIndex].images = hotel.foods[foodIndex].images.filter(img => img !== imageUrl);
        hotel.markModified('foods');
        await hotel.save();
        console.log('✅ Food image deleted successfully');
        return res.json({ success: true, message: "Food image deleted", hotel });
      } else {
        return res.status(404).json({ success: false, message: "Food item not found" });
      }
    } else {
      // Delete hotel image (default behavior)
      hotel.images = hotel.images.filter(img => img !== imageUrl);
      await hotel.save();
      console.log('✅ Hotel image deleted successfully');
      return res.json({ success: true, message: "Hotel image deleted", hotel });
    }
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHotelsByLocalID = async (req, res) => {
  const hotels = await hotelModel.find({ localId: req.query.localId }).lean();
  res.json(hotels);
};

const getRoomOfferStatus = async (req, res) => {
  const { hotelId, roomId } = req.params;
  const hotel = await hotelModel.findOne({ hotelId, "rooms.roomId": roomId }).lean();
  if (!hotel) return res.status(404).json({ message: "Not found" });
  const room = hotel.rooms.find(r => r.roomId === roomId);
  res.json({ success: true, isOfferActive: isOfferActive(room), room });
};

const getCouponsAppliedHotels = async (req, res) => {
  const hotels = await hotelModel.find({ "rooms.isOffer": true }).lean();
  res.json(hotels);
};

// --- AUTOMATION & CRONS ---

const releaseRooms = async (booking) => {
  for (const room of (booking.roomDetails || [])) {
    await hotelModel.updateOne(
      { hotelId: booking.hotelId, "rooms.roomId": room.roomId },
      { $inc: { "rooms.$.countRooms": 1 } }
    );
  }
};

const autoCancelPendingBookings = async () => {
  const limit = DateTime.now().minus({ minutes: 15 }).toJSDate();
  const pending = await bookingsModel.find({ bookingStatus: "Pending", createdAt: { $lte: limit } });
  for (const b of pending) {
    await releaseRooms(b);
    b.bookingStatus = "Failed";
    b.failureReason = "Auto-cancelled: Payment timeout";
    await b.save();
  }
};

const autoMarkNoShow = async () => {
  const today = DateTime.now().toFormat("yyyy-MM-dd");
  await bookingsModel.updateMany(
    { bookingStatus: "Confirmed", checkInDate: { $lt: today } },
    { $set: { bookingStatus: "No-Show" } }
  );
};

// Schedules
cron.schedule("*/5 * * * *", autoCancelPendingBookings);
cron.schedule("0 0 * * *", autoMarkNoShow);
cron.schedule("0 0 1 * *", async () => {
  const updates = await monthModel.find();
  for (const u of updates) {
    await hotelModel.updateOne({ "rooms.roomId": u.roomId }, { $set: { "rooms.$.price": u.monthPrice } });
  }
});

module.exports = {
  createHotel,
  getAllHotels: getHotelsByFilters,
  getHotelsById,
  getHotelsByLocalID,
  getHotelsByFilters,
  getCity: (req, res) => res.json([]), // Placeholder for legacy compatibility
  getByQuery: getHotelsByFilters,
  UpdateHotelMaster,
  getHotels: async (req, res) => res.json(await hotelModel.find({ onFront: false })),
  setOnFront: async (req, res) => res.json(await hotelModel.find({ onFront: true })),
  deleteHotelById: async (req, res) => {
    await hotelModel.findOneAndDelete({ hotelId: req.params.hotelId });
    res.json({ success: true });
  },
  getHotelsState,
  getHotelsCity,
  getHotelsCityByState,
  monthlyPrice: async (req, res) => res.json({ success: true }),
  getCount,
  getCouponsAppliedHotels,
  getRoomOfferStatus,
  getCountPendingHotels,
  deleteHotelImages,
  autoCancelPendingBookings
};