const mongoose = require("mongoose");
const cron = require("node-cron");
const { DateTime } = require("luxon");
const { v4: uuidv4 } = require("uuid");

// Models
const hotelModel = require("../../models/hotel/basicDetails");
const bookingModel = require("../../models/booking/booking");
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

    // SECURITY: Do not allow client-supplied ratings or review counts on create.
    // These must be derived from actual `reviews` collection to prevent fake data.
    delete hotelData.rating;
    delete hotelData.reviewCount;

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

const applyMonthlyPricing = async (hotels, checkInDate, checkOutDate) => {
  if (!hotels.length) return hotels;

  // If a client does not send dates, use the current IST day and next day so
  // list APIs still show an active monthly rate when one is configured.
  const istToday = DateTime.now().setZone("Asia/Kolkata").startOf("day");
  const stayStart = checkInDate || istToday.toISODate();
  const stayEnd = checkOutDate || istToday.plus({ days: 1 }).toISODate();
  const monthlyEntries = await monthModel.find({
    hotelId: { $in: hotels.map((hotel) => hotel.hotelId) },
    startDate: { $lte: stayStart },
    endDate: { $gte: stayEnd },
  }).lean();

  const monthlyByHotel = new Map();
  monthlyEntries.forEach((entry) => {
    const current = monthlyByHotel.get(entry.hotelId) || new Map();
    if (!current.has(String(entry.roomId))) current.set(String(entry.roomId), entry);
    monthlyByHotel.set(entry.hotelId, current);
  });

  return hotels.map((hotel) => {
    const monthlyRooms = monthlyByHotel.get(hotel.hotelId);
    const actualPrices = (hotel.rooms || []).map((room) => Number(room.price || 0)).filter((price) => price > 0);
    const monthlyPrices = (hotel.rooms || [])
      .map((room) => monthlyRooms?.get(String(room.roomId))?.monthPrice)
      .map(Number)
      .filter((price) => price > 0);
    const startingPrice = actualPrices.length ? Math.min(...actualPrices) : 0;
    const monthlyStartingPrice = monthlyPrices.length ? Math.min(...monthlyPrices) : 0;
    return {
      ...hotel,
      startingPrice: monthlyStartingPrice || startingPrice,
      monthlyStartingPrice,
      monthlyPriceApplied: monthlyStartingPrice > 0,
    };
  });
};

const getHotelsByFilters = async (req, res) => {
  try {
    const { search, hotelName, hotelEmail, city, state, isAccepted, minPrice, maxPrice, starRating, amenities, bedType, bedTypes, roomType, type, checkInDate, checkOutDate, countRooms = 1, page = 1, limit = 10, sortBy = "price", sortOrder = "asc" } = req.query;

    let query = {};
    let andConditions = [];

    if (search && search !== "all") {
      const sRegex = { $regex: escapeRegex(search), $options: "i" };
      andConditions.push({
        $or: [{ hotelName: sRegex }, { city: sRegex }, { state: sRegex }, { destination: sRegex }]
      });
    }

    if (hotelName) andConditions.push({ hotelName: { $regex: escapeRegex(hotelName), $options: "i" } });
    if (hotelEmail) {
      const normalizedEmail = String(hotelEmail).trim();
      andConditions.push({
        hotelEmail: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
      });
    }
    if (city) andConditions.push({ city: { $regex: escapeRegex(city), $options: "i" } });
    if (state) andConditions.push({ state: { $regex: escapeRegex(state), $options: "i" } });
    
    const status = isAccepted === 'false' ? false : true;
    andConditions.push({ isAccepted: status });

    let stayStart = null;
    let stayEnd = null;
    if (checkInDate || checkOutDate) {
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({ success: false, error: "checkInDate and checkOutDate are required together" });
      }
      stayStart = new Date(checkInDate);
      stayEnd = new Date(checkOutDate);
      if (Number.isNaN(stayStart.getTime()) || Number.isNaN(stayEnd.getTime()) || stayEnd <= stayStart) {
        return res.status(400).json({ success: false, error: "Valid check-in and check-out dates are required" });
      }

      // The property itself must be active for the entire requested stay.
      andConditions.push(
        { startDate: { $lte: stayStart } },
        { endDate: { $gte: stayEnd } },
      );
    }

    if (andConditions.length > 0) query.$and = andConditions;

    // Room and amenity filters are applied before pagination so page counts remain correct.
    const requestedAmenities = String(amenities || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (requestedAmenities.length) {
      const amenityRows = await amenitiesModel.find({}).lean();
      const matchingHotelIds = amenityRows.filter((row) => {
        const available = (row.amenities || []).map((item) => String(item).toLowerCase());
        return requestedAmenities.every((wanted) => available.some((item) => item.includes(wanted)));
      }).map((row) => row.hotelId);
      andConditions.push({ hotelId: { $in: matchingHotelIds } });
      query.$and = andConditions;
    }

    const [allHotels, gstData] = await Promise.all([
      hotelModel.find(query).lean(),
      gstModel.findOne({ type: "Hotel" }).lean()
    ]);

    const requestedStar = Number(starRating);
    const min = minPrice === undefined || minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === undefined || maxPrice === "" ? null : Number(maxPrice);
    const wantedBed = String(bedType || bedTypes || "").trim().toLowerCase();
    const wantedRoom = String(roomType || type || "").trim().toLowerCase();
    let processed = await applyMonthlyPricing(allHotels, checkInDate, checkOutDate);
    const requestedRooms = Math.max(1, Number(countRooms) || 1);
    if (stayStart && stayEnd && processed.length) {
      const blockingBookings = await bookingModel.find({
        "hotelDetails.hotelId": { $in: processed.map((hotel) => hotel.hotelId) },
        bookingStatus: { $in: ["Confirmed", "Pending", "Checked-in"] },
        checkInDate: { $lt: stayEnd },
        checkOutDate: { $gt: stayStart },
      }).select("hotelDetails roomDetails numRooms").lean();
      const blockedByHotelRoom = new Map();
      blockingBookings.forEach((booking) => {
        const hotelId = String(booking?.hotelDetails?.hotelId || "");
        const quantity = Math.max(1, Number(booking?.numRooms) || 1);
        (booking.roomDetails || []).forEach((room) => {
          const key = `${hotelId}:${String(room?.roomId || "")}`;
          blockedByHotelRoom.set(key, (blockedByHotelRoom.get(key) || 0) + quantity);
        });
      });
      processed = processed.map((hotel) => ({
        ...hotel,
        rooms: (hotel.rooms || []).filter((room) => {
          const capacity = Math.max(0, Number(room?.totalRooms || room?.countRooms || 0));
          const blocked = blockedByHotelRoom.get(`${hotel.hotelId}:${String(room?.roomId || room?._id || "")}`) || 0;
          return capacity - blocked >= requestedRooms && room?.soldOut !== true;
        }),
      })).filter((hotel) => hotel.rooms.length > 0);
    }
    processed = processed.filter((hotel) => {
      if (Number.isFinite(requestedStar) && Number(hotel.starRating) < requestedStar) return false;
      if (min !== null && Number.isFinite(min) && Number(hotel.startingPrice) < min) return false;
      if (max !== null && Number.isFinite(max) && Number(hotel.startingPrice) > max) return false;
      if (wantedBed && !(hotel.rooms || []).some((room) => String(room.bedTypes || "").toLowerCase().includes(wantedBed))) return false;
      if (wantedRoom && !(hotel.rooms || []).some((room) => String(room.type || "").toLowerCase().includes(wantedRoom))) return false;
      return true;
    });
    if (sortBy === "price") {
      processed.sort((a, b) => (Number(a.startingPrice) - Number(b.startingPrice)) * (String(sortOrder).toLowerCase() === "desc" ? -1 : 1));
    }
    const total = processed.length;
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, parseInt(limit) || 10);
    processed = processed.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    res.json({ success: true, total, data: processed, gstInfo: gstData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHotelSuggestions = async (req, res) => {
  try {
    const query = String(req.query.q || req.query.search || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    if (query.length < 2) return res.json({ success: true, data: [] });

    const regex = { $regex: escapeRegex(query), $options: "i" };
    const hotels = await hotelModel.find({
      isAccepted: true,
      $or: [{ hotelName: regex }, { city: regex }, { destination: regex }, { state: regex }],
    }).select("hotelId hotelName city destination state").limit(50).lean();

    const suggestions = [];
    const seen = new Set();
    const add = (value, type, hotel) => {
      const label = String(value || "").trim();
      const key = label.toLowerCase();
      if (!label || seen.has(`${type}:${key}`)) return;
      seen.add(`${type}:${key}`);
      suggestions.push({
        type,
        label,
        value: label,
        hotelId: hotel?.hotelId || null,
        hotelName: hotel?.hotelName || null,
        city: hotel?.city || null,
      });
    };

    hotels.forEach((hotel) => {
      add(hotel.city, "city", hotel);
      add(hotel.destination, "destination", hotel);
      add(hotel.hotelName, "hotel", hotel);
      add(hotel.state, "state", hotel);
    });

    const lowerQuery = query.toLowerCase();
    suggestions.sort((a, b) => {
      const aStarts = a.label.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bStarts = b.label.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      return aStarts - bStarts || a.label.localeCompare(b.label);
    });

    res.json({ success: true, data: suggestions.slice(0, limit) });
  } catch (error) {
    console.error("getHotelSuggestions error:", error);
    res.status(500).json({ success: false, error: "Unable to load location suggestions." });
  }
};

// The admin hotel directory should include every hotel. The public/filter
// endpoint intentionally defaults to accepted hotels and a page size of 10.
const getAllHotels = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.query;
    const hotels = await hotelModel.find({}).sort({ createdAt: -1 }).lean();
    const processed = await applyMonthlyPricing(hotels, checkInDate, checkOutDate);
    res.json({ success: true, data: processed, total: processed.length });
  } catch (error) {
    console.error('getAllHotels error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHotelsById = async (req, res) => {
  try {
    const hotel = await hotelModel.findOne({ hotelId: String(req.params.hotelId) }).lean();
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    const [processed] = await applyMonthlyPricing(
      [hotel],
      req.query.checkInDate,
      req.query.checkOutDate,
    );
    res.json({ success: true, data: processed });
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
  res.json(await applyMonthlyPricing(hotels, req.query.checkInDate, req.query.checkOutDate));
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
  res.json(await applyMonthlyPricing(hotels, req.query.checkInDate, req.query.checkOutDate));
};

const getMainHotels = async (req, res) => {
  const hotels = await hotelModel.find({ onFront: false }).lean();
  res.json(await applyMonthlyPricing(hotels, req.query.checkInDate, req.query.checkOutDate));
};

const getFrontHotels = async (req, res) => {
  const hotels = await hotelModel.find({ onFront: true }).lean();
  res.json(await applyMonthlyPricing(hotels, req.query.checkInDate, req.query.checkOutDate));
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

// Schedules
cron.schedule("*/5 * * * *", autoCancelPendingBookings);
cron.schedule("0 0 1 * *", async () => {
  const updates = await monthModel.find();
  for (const u of updates) {
    await hotelModel.updateOne({ "rooms.roomId": u.roomId }, { $set: { "rooms.$.price": u.monthPrice } });
  }
});

module.exports = {
  createHotel,
  getAllHotels,
  getHotelSuggestions,
  getHotelsById,
  getHotelsByLocalID,
  getHotelsByFilters,
  getCity: (req, res) => res.json([]), // Placeholder for legacy compatibility
  getByQuery: getHotelsByFilters,
  UpdateHotelMaster,
  getHotels: getMainHotels,
  setOnFront: getFrontHotels,
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
