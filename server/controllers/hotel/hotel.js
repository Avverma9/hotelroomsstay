const hotelModel = require("../../models/hotel/basicDetails");
const month = require("../../models/booking/monthly");
const cron = require("node-cron");
const { DateTime } = require("luxon"); // Add this line at the top
const mongoose = require("mongoose");

const bookingsModel = require("../../models/booking/booking");
const monthly = require("../../models/booking/monthly");
const gstModel = require("../../models/GST/gst");
const dashboardUserModel = require("../../models/dashboardUser");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");
const {
  getRoomBasePrice,
  getOfferAdjustedPrice,
  isOfferActive,
} = require("./offerUtils");

// Import related models for hybrid approach
const amenitiesModel = require("../../models/hotel/amenities");
const policyModel = require("../../models/hotel/policies");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValueProvided = (value) => value !== undefined;

// XSS Prevention - Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Frontend may send different field names than the schema uses — map them here.
const FIELD_ALIASES = {
  phone:          "contact",
  mobile:         "contact",
  contactNumber:  "contact",
  owner:          "hotelOwnerName",
  ownerName:      "hotelOwnerName",
  address:        "landmark",
  hotelAddress:   "landmark",
  name:           "hotelName",
};

const buildHotelUpdatePayload = (payload = {}) => {
  // Resolve aliases so frontend can send e.g. "phone" or "owner" and they map correctly
  const normalizedPayload = { ...payload };
  for (const [alias, schemaField] of Object.entries(FIELD_ALIASES)) {
    if (normalizedPayload[alias] !== undefined && normalizedPayload[schemaField] === undefined) {
      normalizedPayload[schemaField] = normalizedPayload[alias];
    }
    delete normalizedPayload[alias]; // always remove alias key
  }

  const allowedFields = [
    "isAccepted",
    "onFront",
    "hotelName",
    "hotelOwnerName",
    "hotelEmail",
    "localId",
    "description",
    "customerWelcomeNote",
    "generalManagerContact",
    "salesManagerContact",
    "landmark",
    "pinCode",
    "hotelCategory",
    "propertyType",
    "starRating",
    "city",
    "state",
    "destination",
    "latitude",
    "longitude",
    "contact",
  ];

  const updatePayload = {};

  for (const field of allowedFields) {
    if (!isValueProvided(normalizedPayload[field])) {
      continue;
    }

    let normalizedValue = normalizedPayload[field];

    if ((field === "isAccepted" || field === "onFront") && typeof normalizedValue === "string") {
      const lowered = normalizedValue.trim().toLowerCase();
      if (["true", "1", "yes"].includes(lowered)) {
        normalizedValue = true;
      } else if (["false", "0", "no"].includes(lowered)) {
        normalizedValue = false;
      }
    }

    if ((field === "pinCode" || field === "contact") && typeof normalizedValue === "string") {
      const parsedNumber = Number(normalizedValue);
      if (Number.isFinite(parsedNumber)) {
        normalizedValue = parsedNumber;
      }
    }

    if (field === "propertyType" && typeof normalizedValue === "string") {
      try {
        const parsedPropertyType = JSON.parse(normalizedValue);
        normalizedValue = Array.isArray(parsedPropertyType)
          ? parsedPropertyType
          : [parsedPropertyType];
      } catch (error) {
        normalizedValue = normalizedValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      }
    }

    updatePayload[field] = normalizedValue;
  }

  return updatePayload;
};

// Build query for hotel lookup — hotelId is type:String in the schema,
// always cast to string to avoid Mongoose type-mismatch no-ops.
const buildHotelQuery = (hotelId) => {
  if (!hotelId) return {};
  return { hotelId: String(hotelId) };
};

const createHotel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
  });

  try {
    const {
      hotelName,
      description,
      hotelOwnerName,
      destination,
      onFront,
      startDate,
      endDate,
      state,
      city,
      landmark,
      pinCode,
      hotelCategory,
      numRooms,
      latitude,
      longitude,
      reviews,
      rating,
      starRating,
      propertyType,
      contact,
      isAccepted,
      salesManagerContact,
      localId,
      hotelEmail,
      customerWelcomeNote,
      generalManagerContact,
      // Hybrid approach: only amenities and policies in single call
      amenities,
      policies,
    } = req.body;

    // === Validation ===
    if (!hotelName || !hotelName.trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Hotel name is required" });
    }
    if (!state || !state.trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "State is required" });
    }
    if (!city || !city.trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "City is required" });
    }
    if (!contact || !contact.trim()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Contact number is required" });
    }

    // === Phone Number Validation ===
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact.trim())) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid phone number. Must be 10 digits." });
    }

    // === Email Validation ===
    if (hotelEmail && hotelEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(hotelEmail.trim())) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Invalid email address format." });
      }
    }

    // === Date Validation ===
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Start date must be before end date" });
      }
    }

    // === Duplicate Hotel Check (Case-Insensitive) ===
    const existingHotel = await hotelModel.findOne({
      hotelName: { $regex: `^${hotelName.trim()}$`, $options: 'i' },
      city: { $regex: `^${city.trim()}$`, $options: 'i' },
      state: { $regex: `^${state.trim()}$`, $options: 'i' }
    });
    if (existingHotel) {
      await session.abortTransaction();
      return res.status(409).json({ 
        error: "Hotel with this name already exists in this city" 
      });
    }

    const images = req.files ? req.files.map((file) => file.location) : [];

    // === Image Count Validation ===
    const MAX_IMAGES = 20; // Maximum allowed images
    const MIN_IMAGES = 1;  // Minimum required images
    if (images.length > MAX_IMAGES) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `Maximum ${MAX_IMAGES} images allowed. You uploaded ${images.length} images.` 
      });
    }
    if (images.length < MIN_IMAGES) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `At least ${MIN_IMAGES} image is required. You uploaded ${images.length} images.` 
      });
    }

    // === File Type Validation ===
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = req.files ? req.files.filter(file => !ALLOWED_MIME_TYPES.includes(file.mimetype)) : [];
    if (invalidFiles.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.` 
      });
    }

    // === File Size Validation ===
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    const oversizedFiles = req.files ? req.files.filter(file => file.size > MAX_FILE_SIZE) : [];
    if (oversizedFiles.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `File size exceeds limit. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB per file allowed.` 
      });
    }

    // Parse JSON strings with error handling
    const parsedAmenities = (() => {
      try {
        return typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []);
      } catch (error) {
        console.error('Error parsing amenities:', error);
        return [];
      }
    })();

    const parsedPolicies = (() => {
      try {
        return typeof policies === 'string' ? JSON.parse(policies) : (policies || {});
      } catch (error) {
        console.error('Error parsing policies:', error);
        return {};
      }
    })();

    const hotelData = {
      hotelName: sanitizeInput(hotelName),
      description: sanitizeInput(description),
      hotelOwnerName: sanitizeInput(hotelOwnerName),
      destination: sanitizeInput(destination),
      onFront: onFront === 'true' || onFront === true,
      customerWelcomeNote: sanitizeInput(customerWelcomeNote),
      startDate,
      endDate,
      state: sanitizeInput(state),
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      city: sanitizeInput(city),
      landmark: sanitizeInput(landmark),
      pinCode,
      hotelCategory: sanitizeInput(hotelCategory),
      numRooms: Number(numRooms) || 0,
      reviews: Number(reviews) || 0,
      rating: Number(rating) || 0,
      starRating: Number(starRating) || 0,
      propertyType: sanitizeInput(propertyType),
      contact: sanitizeInput(contact),
      isAccepted: isAccepted === 'true' || isAccepted === true,
      localId: sanitizeInput(localId),
      hotelEmail: hotelEmail, // ❌ Don't sanitize email
      generalManagerContact: sanitizeInput(generalManagerContact),
      salesManagerContact: sanitizeInput(salesManagerContact),
      images,
      amenities: parsedAmenities || [],
      policies: parsedPolicies || {},
    };

    // Create hotel with transaction
    const savedHotel = await hotelModel.create([hotelData], { session });
    const hotelId = savedHotel[0].hotelId;

    // Create amenities if provided (check if already exists)
    if (parsedAmenities && parsedAmenities.length > 0) {
      const existingAmenities = await amenitiesModel.findOne({ hotelId });
      if (existingAmenities) {
        await amenitiesModel.updateOne(
          { hotelId },
          { amenities: parsedAmenities },
          { session }
        );
      } else {
        await amenitiesModel.create([{
          hotelId,
          amenities: parsedAmenities,
        }], { session });
      }
    }

    // Create policies if provided (check if already exists)
    if (parsedPolicies && Object.keys(parsedPolicies).length > 0) {
      const existingPolicies = await policyModel.findOne({ hotelId });
      if (existingPolicies) {
        await policyModel.updateOne(
          { hotelId },
          { $set: parsedPolicies },
          { session }
        );
      } else {
        await policyModel.create([{
          hotelId,
          ...parsedPolicies,
        }], { session });
      }
    }

    await session.commitTransaction();

    return res.status(201).json({
      message: `Hotel created successfully with amenities and policies. Hotel ID: ${hotelId}`,
      status: true,
      data: {
        hotelId,
        hotelName,
        amenitiesCreated: parsedAmenities.length,
        policiesCreated: Object.keys(parsedPolicies).length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating hotel:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message 
    });
  } finally {
    session.endSession();
  }
};


//=================================Count of hotel=============================
const getCount = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: true });
    res.json(count);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================================================

const getCountPendingHotels = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: false });
    console.log("Count of pending hotels:", count);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error while getting count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//======================================Delete hotel images=======================
const deleteHotelImages = async function (req, res) {
  const { hotelId } = req.params;
  let { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  try {
    // Use $pull to remove the image URL from the images array
    const query = buildHotelQuery(hotelId);
    const hotel = await hotelModel.findOneAndUpdate(
      query,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found" });
    }

    res.status(200).json({
      message: "Image URL deleted successfully",
      hotel
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//=================== MASTER API handles all hotel updates — see UpdateHotelMaster below ===================

// ═══════════════════════════════════════════════════════════════════════════
// MASTER HOTEL UPDATE API
// PATCH /hotels/master/:hotelId
//
// Single API that can update EVERYTHING about a hotel in one request:
//   - Basic info (hotelName, city, state, contact, email, etc.)
//   - Status     (isAccepted, onFront, localId)
//   - Rooms      (add new rooms / update existing by roomId / delete by roomId)
//   - Foods      (replace entire array, or add/remove individual items)
//   - Amenities  (replace entire array)
//   - Policies   (replace entire array)
//   - Images     (add via multipart upload OR replace with provided URLs)
//
// Request body (JSON or multipart/form-data):
// {
//   // --- Basic info (all optional) ---
//   "hotelName": "...",  "city": "...",  "state": "...",
//   "phone": "...",  "owner": "...",  "address": "...",   // aliases accepted
//   "hotelEmail": "...",  "starRating": "4",  "isAccepted": true,
//   "onFront": false,  "description": "...",  "propertyType": ["Hotel"],
//   ... (any field from basicDetails schema)
//
//   // --- Rooms (optional) ---
//   "rooms": [
//     // ADD a new room — no roomId
//     { "type": "Deluxe", "bedTypes": "Double", "price": 3000, "countRooms": 5 },
//     // UPDATE existing room — send roomId
//     { "roomId": "abc12345", "price": 3500, "soldOut": false },
//     // DELETE existing room — send roomId + "_delete": true
//     { "roomId": "xyz67890", "_delete": true }
//   ],
//
//   // --- Foods (optional) ---
//   "foods": [
//     // ADD new food — no foodId
//     { "name": "Breakfast", "price": 250, "foodType": "Veg" },
//     // UPDATE existing — send foodId
//     { "foodId": "f001", "price": 300 },
//     // DELETE — send foodId + "_delete": true
//     { "foodId": "f002", "_delete": true }
//   ],
//
//   // --- Amenities (optional) — replaces entire array ---
//   "amenities": [ { "amenities": "WiFi" }, { "amenities": "Pool" } ],
//
//   // --- Policies (optional) — replaces entire array ---
//   "policies": [ { "hotelsPolicy": "No smoking", "petsAllowed": false } ],
//
//   // --- Image URLs to remove (optional) ---
//   "removeImages": ["https://..."]
// }
// Files attached as multipart will be uploaded to S3 and appended to hotel.images
// ═══════════════════════════════════════════════════════════════════════════
const { v4: uuidv4 } = require("uuid");

const UpdateHotelMaster = async function (req, res) {
  const { hotelId } = req.params;

  if (!hotelId) {
    return res.status(400).json({ success: false, message: "hotelId is required" });
  }

  try {
    // ── 1. Load current hotel ───────────────────────────────────────────────
    const hotel = await hotelModel.findOne(buildHotelQuery(hotelId));
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    // ── 2. Basic info fields ────────────────────────────────────────────────
    const basicPayload = buildHotelUpdatePayload(req.body);
    Object.assign(hotel, basicPayload);

    // ── 3. Rooms ────────────────────────────────────────────────────────────
    let roomsInput = req.body.rooms;
    if (typeof roomsInput === "string") {
      try { roomsInput = JSON.parse(roomsInput); } catch { roomsInput = null; }
    }

    if (Array.isArray(roomsInput)) {
      for (const roomInput of roomsInput) {
        if (!roomInput || typeof roomInput !== "object") continue;

        if (roomInput.roomId) {
          // UPDATE or DELETE existing room
          const idx = hotel.rooms.findIndex((r) => String(r.roomId) === String(roomInput.roomId));
          if (idx === -1) continue; // roomId not found — skip

          if (roomInput._delete === true || roomInput._delete === "true") {
            hotel.rooms.splice(idx, 1); // delete
          } else {
            // Merge only provided fields onto the existing room
            const existing = hotel.rooms[idx].toObject ? hotel.rooms[idx].toObject() : { ...hotel.rooms[idx] };
            const { _delete: _d, roomId: _r, ...updatableFields } = roomInput;

            // Normalise numeric fields
            if (updatableFields.price !== undefined)        updatableFields.price        = Number(updatableFields.price) || existing.price;
            if (updatableFields.countRooms !== undefined)   updatableFields.countRooms   = Number(updatableFields.countRooms) || existing.countRooms;
            if (updatableFields.totalRooms !== undefined)   updatableFields.totalRooms   = Number(updatableFields.totalRooms) || existing.totalRooms;
            // Keep totalRooms in sync if only countRooms sent
            if (updatableFields.countRooms !== undefined && updatableFields.totalRooms === undefined) {
              updatableFields.totalRooms = updatableFields.countRooms;
            }
            if (updatableFields.originalPrice === undefined && updatableFields.price !== undefined) {
              updatableFields.originalPrice = updatableFields.price;
            }

            Object.assign(hotel.rooms[idx], updatableFields);
            // Also use .set() for each field so Mongoose tracks strict:false fields (e.g. amenities, description)
            for (const [key, val] of Object.entries(updatableFields)) {
              hotel.rooms[idx].set(key, val);
            }
          }
        } else {
          // ADD new room
          const price = Number(roomInput.price) || 0;
          const countRooms = Number(roomInput.countRooms) || 1;
          const { _delete: _d, ...roomFields } = roomInput;

          hotel.rooms.push({
            roomId: uuidv4().substr(0, 8),
            hotelId: String(hotelId),
            images: [],
            soldOut: false,
            isOffer: false,
            offerName: "N/A",
            offerPriceLess: 0,
            offerExp: null,
            ...roomFields,
            price,
            originalPrice: price,
            countRooms,
            totalRooms: countRooms,
          });
        }
      }
    }

    // ── 4. Foods ────────────────────────────────────────────────────────────
    let foodsInput = req.body.foods;
    if (typeof foodsInput === "string") {
      try { foodsInput = JSON.parse(foodsInput); } catch { foodsInput = null; }
    }

    if (Array.isArray(foodsInput)) {
      for (const foodInput of foodsInput) {
        if (!foodInput || typeof foodInput !== "object") continue;

        if (foodInput.foodId) {
          const idx = (hotel.foods || []).findIndex((f) => String(f.foodId) === String(foodInput.foodId));
          if (idx === -1) continue;

          if (foodInput._delete === true || foodInput._delete === "true") {
            hotel.foods.splice(idx, 1);
          } else {
            const { _delete: _d, foodId: _f, ...updatableFields } = foodInput;
            Object.assign(hotel.foods[idx], updatableFields);
          }
        } else {
          // ADD new food
          if (!hotel.foods) hotel.foods = [];
          const { _delete: _d, ...foodFields } = foodInput;
          hotel.foods.push({
            foodId: uuidv4().substr(0, 8),
            ...foodFields,
          });
        }
      }
    }

    // ── 5. Amenities (full replace if provided) ─────────────────────────────
    let amenitiesInput = req.body.amenities;
    if (typeof amenitiesInput === "string") {
      try { amenitiesInput = JSON.parse(amenitiesInput); } catch { amenitiesInput = null; }
    }
    if (Array.isArray(amenitiesInput)) {
      hotel.amenities = amenitiesInput;
    }

    // ── 6. Policies (full replace if provided) ──────────────────────────────
    let policiesInput = req.body.policies;
    if (typeof policiesInput === "string") {
      try { policiesInput = JSON.parse(policiesInput); } catch { policiesInput = null; }
    }
    if (Array.isArray(policiesInput)) {
      hotel.policies = policiesInput;
    }

    // ── 7. Images ───────────────────────────────────────────────────────────
    // 7a. Remove images by URL
    let removeImages = req.body.removeImages;
    if (typeof removeImages === "string") {
      try { removeImages = JSON.parse(removeImages); } catch { removeImages = [removeImages]; }
    }
    if (Array.isArray(removeImages) && removeImages.length > 0) {
      hotel.images = (hotel.images || []).filter((img) => !removeImages.includes(img));
    }

    // 7b. Append new uploaded files (multipart)
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map((f) => f.location);
      hotel.images = [...(hotel.images || []), ...newImageUrls];
    }

    // ── 8. Save ─────────────────────────────────────────────────────────────
    // markModified ensures Mongoose tracks changes to non-schema fields (strict:false)
    // e.g. room-level amenities, description, custom fields
    hotel.markModified('rooms');
    hotel.markModified('foods');
    const saved = await hotel.save();

    // ── 9. Fire approval email if isAccepted explicitly changed ─────────────
    if ("isAccepted" in basicPayload) {
      sendCustomEmail({
        email: saved.hotelEmail,
        subject: "Hotel Status Update",
        message: `Your hotel "${saved.hotelName}" (ID: ${saved.hotelId}) has been ${basicPayload.isAccepted ? "approved" : "rejected"}.`,
        link: process.env.FRONTEND_URL,
      }).catch((err) => console.error("Email error:", err));
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error in UpdateHotelMaster:", error);
    return res.status(500).json({ success: false, error: "Failed to update hotel", message: error.message });
  }
};

//=============================get hotel by amenities===========================//
const getByQuery = async (req, res) => {
  const {
    amenities,
    bedTypes,
    starRating,
    propertyType,
    hotelOwnerName,
    hotelEmail,
    roomTypes,
  } = req.query;

  // Check if there are no query parameters
  if (
    !amenities &&
    !bedTypes &&
    !starRating &&
    !propertyType &&
    !hotelOwnerName &&
    !hotelEmail &&
    !roomTypes
  ) {
    // Fetch all data where isAccepted is true using cursor stream
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ isAccepted: true }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    return res.end();
  }

  const queryParameters = [
    { key: "amenities", value: amenities },
    { key: "roomDetails.bedTypes", value: bedTypes },
    { key: "starRating", value: starRating },
    { key: "propertyType", value: propertyType },
    { key: "hotelOwnerName", value: hotelOwnerName },
    { key: "hotelEmail", value: hotelEmail },
    { key: "roomDetails.type", value: roomTypes },
  ];

  let fetchedData = [];

  for (const param of queryParameters) {
    if (param.value) {
      const query = {};

      if (param.key.includes("roomDetails")) {
        const elemMatchQuery = {};
        if (param.key.endsWith("countRooms")) {
          // Check countRooms greater than 0
          elemMatchQuery[param.key.split(".")[1]] = { $gt: 0 };
        } else {
          elemMatchQuery[param.key.split(".")[1]] = Array.isArray(param.value)
            ? { $in: param.value.map((val) => new RegExp(val, "i")) }
            : new RegExp(param.value, "i");
        }

        query["roomDetails"] = { $elemMatch: elemMatchQuery };
      } else {
        query[param.key] = Array.isArray(param.value)
          ? { $in: param.value.map((val) => new RegExp(val, "i")) }
          : new RegExp(param.value, "i");
      }

      // Add check for isAccepted
      query["isAccepted"] = true;

      // Use cursor for streaming
      res.setHeader('Content-Type', 'application/json');
      res.write('[');
      let first = true;
      const cursor = hotelModel.find(query).cursor();
      for await (const hotel of cursor) {
        if (!first) res.write(',');
        res.write(JSON.stringify(hotel));
        first = false;
        fetchedData.push(hotel);
      }
      res.write(']');
      return res.end();
    }
  }

  res.json(fetchedData);
};

//================================================================================================

const getAllHotels = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, countRooms } = req.query;
    const requestedRooms = parseInt(countRooms) || 1;

    // Fetch all required data in parallel
    const [monthlyData, gstData, allBookings] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      // Only fetch bookings if dates are provided
      (checkInDate && checkOutDate) ? bookingsModel.find({
        bookingStatus: { $nin: ["Cancelled", "Failed"] },
        $or: [
          {
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate }
          }
        ]
      }).select('hotelId numRooms roomDetails checkInDate checkOutDate').lean() : Promise.resolve([])
    ]);

    // GST calculation helper
    const calculateGST = (price) => {
      if (!gstData) return { gstPercent: 0, gstAmount: 0 };
      
      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0;
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = gstData.gstPrice || 12; // mid-tier rate from DB
      } else {
        gstPercent = 18; // luxury tier: 18% per GST regulations
      }
      
      const gstAmount = Math.round((price * gstPercent) / 100);
      return { gstPercent, gstAmount };
    };

    // Create a map of hotelId -> booked rooms
    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach(booking => {
        const hotelId = booking.hotelId;
        if (!bookedRoomsMap[hotelId]) {
          bookedRoomsMap[hotelId] = { totalBooked: 0, roomWise: {} };
        }
        bookedRoomsMap[hotelId].totalBooked += booking.numRooms || 0;
        
        if (booking.roomDetails && Array.isArray(booking.roomDetails)) {
          booking.roomDetails.forEach(rd => {
            if (rd.roomId) {
              if (!bookedRoomsMap[hotelId].roomWise[rd.roomId]) {
                bookedRoomsMap[hotelId].roomWise[rd.roomId] = 0;
              }
              bookedRoomsMap[hotelId].roomWise[rd.roomId] += 1;
            }
          });
        }
      });
    }

    // Process hotels with streaming
    res.setHeader('Content-Type', 'application/json');
    res.write('{"success":true,"data":[');
    let first = true;
    
    const cursor = hotelModel.find().sort({ isAccepted: 1 }).cursor();
    
    for await (const hotel of cursor) {
      const hotelId = hotel.hotelId;
      const bookedInfo = bookedRoomsMap[hotelId] || { totalBooked: 0, roomWise: {} };
      
      let totalRooms = 0;
      let availableRooms = 0;
      let lowestPrice = Infinity;
      let lowestPriceWithGST = Infinity;
      
      // Process each room
      const processedRooms = (hotel.rooms || []).map(room => {
        const roomId = room.roomId || room._id?.toString();
        const roomCount = room.countRooms || 0;
        const bookedCount = bookedInfo.roomWise[roomId] || 0;
        const available = Math.max(0, roomCount - bookedCount);
        
        totalRooms += roomCount;
        availableRooms += available;
        
        // Get the price - check for monthly special pricing first
        const baseRoomPrice = getRoomBasePrice(room);
        let finalPrice = baseRoomPrice;
        let isSpecialPrice = false;
        let monthlyPriceDetails = null;
        
        if (checkInDate && checkOutDate && monthlyData.length > 0) {
          const matchingMonthlyEntry = monthlyData.find((data) => {
            // Check if monthly price period overlaps with booking dates
            return (
              data.hotelId === hotelId &&
              data.roomId === roomId &&
              data.startDate <= checkOutDate &&
              data.endDate >= checkInDate
            );
          });
          
          if (matchingMonthlyEntry) {
            finalPrice = matchingMonthlyEntry.monthPrice;
            isSpecialPrice = true;
            monthlyPriceDetails = {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true
            };
          }
        }
        
        const { finalPrice: offerPrice, offerApplied } = getOfferAdjustedPrice({
          room,
          listPrice: finalPrice,
          isSpecialPrice,
          at: new Date(),
        });
        
        // Calculate GST
        const { gstPercent, gstAmount } = calculateGST(offerPrice);
        const priceWithGST = offerPrice + gstAmount;
        
        // Track lowest price
        if (available > 0 && offerPrice < lowestPrice) {
          lowestPrice = offerPrice;
          lowestPriceWithGST = priceWithGST;
        }
        
        return {
          ...room,
          originalPrice: baseRoomPrice,
          finalPrice: offerPrice,
          isSpecialPrice,
          offerApplied,
          monthlyPriceDetails,
          gstPercent,
          gstAmount,
          priceWithGST,
          totalCount: roomCount,
          bookedCount,
          availableCount: available,
          isAvailable: available > 0
        };
      });
      
      // Determine hotel availability status
      const isFullyBooked = availableRooms < requestedRooms;
      const availabilityStatus = isFullyBooked ? "Fully Booked" : "Available";
      
      const processedHotel = {
        ...hotel.toObject(),
        rooms: processedRooms,
        availability: checkInDate && checkOutDate ? {
          status: availabilityStatus,
          totalRooms,
          availableRooms,
          bookedRooms: totalRooms - availableRooms,
          requestedRooms,
          canBook: !isFullyBooked
        } : null,
        pricing: {
          startingFrom: lowestPrice === Infinity ? 0 : lowestPrice,
          startingFromWithGST: lowestPriceWithGST === Infinity ? 0 : lowestPriceWithGST,
          gstApplicable: gstData ? true : false,
          gstNote: gstData ? `GST @${gstData.gstPrice || 12}% for ₹${gstData.gstMinThreshold + 1}–₹${gstData.gstMaxThreshold}; @18% above ₹${gstData.gstMaxThreshold}` : null
        }
      };
      
      if (!first) res.write(',');
      res.write(JSON.stringify(processedHotel));
      first = false;
    }
    
    res.write('],"gstInfo":');
    res.write(JSON.stringify(gstData ? {
      minThreshold: gstData.gstMinThreshold,
      maxThreshold: gstData.gstMaxThreshold,
      midRate: gstData.gstPrice || 12,
      luxuryRate: 18
    } : null));
    res.write('}');
    res.end();
  } catch (error) {
    console.error("Error in getAllHotels:", error);
    res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
  }
};

//===========================get hotels====================================================//
const getHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ onFront: false }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//======================================get offers==========================================//
const setOnFront = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.query;
    const monthlyData = await monthly.find().lean();

    // Get the current date in YYYY-MM-DD format (IST) or use provided checkInDate
    const currentDate = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
    const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
    const formattedCurrentDate = checkInDate || currentDateIST.toISOString().split("T")[0];
    const formattedCheckOutDate = checkOutDate || formattedCurrentDate;

    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    // Use .lean() so hotel and room objects are plain JS objects.
    // Without .lean(), spreading Mongoose subdocs (e.g. ...room) gives incomplete objects.
    const cursor = hotelModel.find({ onFront: true }).sort({ createdAt: -1 }).lean().cursor();
    
    for await (const hotel of cursor) {
      // Process rooms with monthly pricing
      hotel.rooms = hotel.rooms.map((room) => {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          // Check if monthly price period overlaps with booking dates
          return (
            data.hotelId === hotel.hotelId.toString() &&
            data.roomId === room.roomId &&
            data.startDate <= formattedCheckOutDate &&
            data.endDate >= formattedCurrentDate
          );
        });

        if (matchingMonthlyEntry) {
          return {
            ...room,
            originalPrice: getRoomBasePrice(room),
            price: matchingMonthlyEntry.monthPrice,
            monthlyPriceDetails: {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true
            }
          };
        }
        
        return room;
      });

      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

//============================get by city============================================//
const getCity = async function (req, res) {
  const { city } = req.query;
  const searchQuery = {};

  if (city) {
    searchQuery.city = { $regex: new RegExp(city, "i") };
  }

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find(searchQuery).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//=================================================================================

const getHotelsById = async (req, res) => {
  try {
    const hotelId = req.params.hotelId;
    const { checkInDate, checkOutDate, countRooms } = req.query;
    const requestedRooms = parseInt(countRooms) || 1;

    // Fetch hotel data — cast to String for consistent matching with schema type:String
    const hotel = await hotelModel.findOne({ hotelId: String(hotelId) }).lean();
    
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    // Fetch all required data in parallel
    const [monthlyData, gstData, allBookings] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      // Only fetch bookings if dates are provided
      (checkInDate && checkOutDate) ? bookingsModel.find({
        hotelId: hotelId,
        bookingStatus: { $nin: ["Cancelled", "Failed"] },
        $or: [
          {
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate }
          }
        ]
      }).select('hotelId numRooms roomDetails checkInDate checkOutDate').lean() : Promise.resolve([])
    ]);

    // GST calculation helper
    const calculateGST = (price) => {
      if (!gstData) return { gstPercent: 0, gstAmount: 0 };
      
      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0; // No GST for very low prices
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = gstData.gstPrice || 12; // mid-tier rate from DB
      } else {
        gstPercent = 18; // luxury tier: 18% per GST regulations
      }
      
      const gstAmount = Math.round((price * gstPercent) / 100);
      return { gstPercent, gstAmount };
    };

    // Create a map of booked rooms
    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach(booking => {
        if (booking.roomDetails && Array.isArray(booking.roomDetails)) {
          booking.roomDetails.forEach(rd => {
            if (rd.roomId) {
              if (!bookedRoomsMap[rd.roomId]) {
                bookedRoomsMap[rd.roomId] = 0;
              }
              bookedRoomsMap[rd.roomId] += 1;
            }
          });
        }
      });
    }

    // Process rooms with pricing, offers, GST, and availability
    let totalRooms = 0;
    let availableRooms = 0;
    let lowestPrice = Infinity;
    let lowestPriceWithGST = Infinity;

    const processedRooms = (hotel.rooms || []).map(room => {
      const roomId = room.roomId || room._id?.toString();
      const roomCount = room.countRooms || 0;
      const bookedCount = bookedRoomsMap[roomId] || 0;
      const available = Math.max(0, roomCount - bookedCount);
      
      totalRooms += roomCount;
      availableRooms += available;
      
      // Get the price - check for monthly special pricing first
      const baseRoomPrice = getRoomBasePrice(room);
      let finalPrice = baseRoomPrice;
      let isSpecialPrice = false;
      let monthlyPriceDetails = null;
      
      if (checkInDate && checkOutDate && monthlyData.length > 0) {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          // Check if monthly price period overlaps with booking dates
          return (
            data.hotelId === hotelId &&
            data.roomId === roomId &&
            data.startDate <= checkOutDate &&
            data.endDate >= checkInDate
          );
        });
        
        if (matchingMonthlyEntry) {
          finalPrice = matchingMonthlyEntry.monthPrice;
          isSpecialPrice = true;
          monthlyPriceDetails = {
            monthPrice: matchingMonthlyEntry.monthPrice,
            startDate: matchingMonthlyEntry.startDate,
            endDate: matchingMonthlyEntry.endDate,
            validForBooking: true
          };
        }
      }
      
      const { finalPrice: offerPrice, offerApplied } = getOfferAdjustedPrice({
        room,
        listPrice: finalPrice,
        isSpecialPrice,
        at: new Date(),
      });
      
      // Calculate GST
      const { gstPercent, gstAmount } = calculateGST(offerPrice);
      const priceWithGST = offerPrice + gstAmount;
      
      // Track lowest price
      if (available > 0 && offerPrice < lowestPrice) {
        lowestPrice = offerPrice;
        lowestPriceWithGST = priceWithGST;
      }
      
      return {
        ...room,
        originalPrice: baseRoomPrice,
        finalPrice: offerPrice,
        isSpecialPrice,
        offerApplied,
        monthlyPriceDetails,
        gstPercent,
        gstAmount,
        priceWithGST,
        totalCount: roomCount,
        bookedCount,
        availableCount: available,
        isAvailable: available > 0
      };
    });

    // Determine hotel availability status
    const isFullyBooked = availableRooms < requestedRooms;
    const availabilityStatus = isFullyBooked ? "Fully Booked" : "Available";

    // Build frontend-ready response structure as requested
    const formatCurrency = (val) => {
      try {
        return Number(val).toLocaleString('en-IN');
      } catch (e) {
        return String(val);
      }
    };

    const mappedRooms = processedRooms.map(r => {
      const id = r.roomId || r._id || r.roomId || r.id || (r._id && String(r._id));
      const name = r.name || r.roomName || r.type || (r.type && String(r.type)) || 'Room';
      const bedType = r.bedTypes || r.bedType || '';
      const images = r.images || [];
      const total = r.totalCount != null ? r.totalCount : (r.countRooms != null ? r.countRooms : 0);
      const available = r.availableCount != null ? r.availableCount : (r.countRooms != null ? Math.max(0, (r.countRooms || 0) - (r.bookedCount || 0)) : 0);
      const basePrice = r.originalPrice != null ? r.originalPrice : (r.price || 0);
      const taxPercent = r.gstPercent != null ? r.gstPercent : (gstData ? gstData.gstPrice : 0);
      const taxAmount = r.gstAmount != null ? r.gstAmount : Math.round((basePrice * taxPercent) / 100);
      const finalPrice = r.priceWithGST != null ? r.priceWithGST : (basePrice + taxAmount);

      return {
        id: id,
        roomId: r.roomId || '',  // expose roomId for edit/update operations
        name: name,
        type: r.type || r.roomType || '',
        bedType: bedType,
        images: images,
        inventory: {
          total: total,
          available: available,
          isSoldOut: available <= 0
        },
        pricing: {
          basePrice: Number(basePrice) || 0,
          taxPercent: Number(taxPercent) || 0,
          taxAmount: Number(taxAmount) || 0,
          finalPrice: Number(finalPrice) || 0,
          currency: '₹',
          displayPrice: `₹ ${formatCurrency(Number(finalPrice) || 0)}`
        },
        features: {
          isOffer: isOfferActive(r),
          offerText: r.offerName || (r.offerExp ? String(r.offerExp) : '')
        },
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
        description: r.description || ''
      };
    });

    const mappedFoods = Array.isArray(hotel.foods)
      ? hotel.foods
          .filter((food) => food && typeof food === "object")
          .map((food) => ({
            id: food.foodId || food._id || "",
            name: food.name || food.title || "",
            type: food.foodType || food.type || "",
            description: food.about || food.description || "",
            images: Array.isArray(food.images) ? food.images : [],
            price: Number(food.price) || 0,
            currency: "₹",
            displayPrice: `₹ ${formatCurrency(Number(food.price) || 0)}`,
          }))
      : [];

    // Map amenities to array of strings
    let mappedAmenities = [];
    if (Array.isArray(hotel.amenities)) {
      mappedAmenities = hotel.amenities.flatMap((a) => {
        if (!a) return [];
        if (typeof a === "string") return [a];
        if (a.name) return [a.name];
        if (Array.isArray(a.amenities)) return a.amenities.filter(Boolean);
        if (a.amenities) return [a.amenities];
        return [Object.values(a).join(" ")].filter(Boolean);
      });
    }

    // Map policies (supports legacy and detailed policy schema)
    const policyEntries = Array.isArray(hotel.policies)
      ? hotel.policies.filter((p) => p && typeof p === "object")
      : hotel.policies && typeof hotel.policies === "object"
        ? [hotel.policies]
        : [];

    const detailedPolicyKeys = [
      "hotelId",
      "hotelsPolicy",
      "checkInPolicy",
      "checkOutPolicy",
      "outsideFoodPolicy",
      "cancellationPolicy",
      "paymentMode",
      "petsAllowed",
      "bachelorAllowed",
      "smokingAllowed",
      "alcoholAllowed",
      "unmarriedCouplesAllowed",
      "internationalGuestAllowed",
      "refundPolicy",
      "returnPolicy",
      "onDoubleSharing",
      "onQuadSharing",
      "onBulkBooking",
      "onTrippleSharing",
      "onMoreThanFour",
      "offDoubleSharing",
      "offQuadSharing",
      "offBulkBooking",
      "offTrippleSharing",
      "offMoreThanFour",
      "onDoubleSharingAp",
      "onQuadSharingAp",
      "onBulkBookingAp",
      "onTrippleSharingAp",
      "onMoreThanFourAp",
      "offDoubleSharingAp",
      "offQuadSharingAp",
      "offBulkBookingAp",
      "offTrippleSharingAp",
      "offMoreThanFourAp",
      "onDoubleSharingMAp",
      "onQuadSharingMAp",
      "onBulkBookingMAp",
      "onTrippleSharingMAp",
      "onMoreThanFourMAp",
      "offDoubleSharingMAp",
      "offQuadSharingMAp",
      "offBulkBookingMAp",
      "offTrippleSharingMAp",
      "offMoreThanFourMAp"
    ];

    const detailedPolicies = detailedPolicyKeys.reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    detailedPolicies.hotelId = hotel.hotelId || "";

    const toBooleanRestriction = (value, fallback = false) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "yes", "allowed", "accept", "accepted", "y"].includes(normalized)) {
          return true;
        }
        if (["false", "no", "not allowed", "restricted", "denied", "n"].includes(normalized)) {
          return false;
        }
      }
      return fallback;
    };

    const splitRules = (text) => {
      if (typeof text !== "string" || !text.trim()) return [];
      return text
        .split(/\r?\n|\u2022|\*|\u27A4/g)
        .map((line) => line.trim())
        .filter(Boolean);
    };

    const extractTime = (value, fallback) => {
      if (typeof value !== "string" || !value.trim()) return fallback;
      const match = value.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
      if (match) return match[0].toUpperCase();
      return value.trim();
    };

    const explicitRules = [];
    let mergedRestrictions = {
      petsAllowed: false,
      smokingAllowed: false,
      alcoholAllowed: false
    };

    policyEntries.forEach((policy) => {
      if (Array.isArray(policy.rules)) {
        explicitRules.push(...policy.rules.map((r) => String(r).trim()).filter(Boolean));
      }

      if (policy.restrictions && typeof policy.restrictions === "object") {
        mergedRestrictions = {
          ...mergedRestrictions,
          ...policy.restrictions
        };
      }

      detailedPolicyKeys.forEach((key) => {
        const value = policy[key];
        if (value === undefined || value === null) return;
        if (typeof value === "string" && !value.trim()) return;
        detailedPolicies[key] = value;
      });
    });

    const rulesFromPolicyText = splitRules(detailedPolicies.hotelsPolicy);
    const rules = explicitRules.length > 0 ? explicitRules : rulesFromPolicyText;
    const checkInValue =
      detailedPolicies.checkInPolicy || policyEntries.find((p) => p.checkIn)?.checkIn;
    const checkOutValue =
      detailedPolicies.checkOutPolicy || policyEntries.find((p) => p.checkOut)?.checkOut;

    const policiesObj = {
      checkIn: extractTime(checkInValue, "12:00 PM"),
      checkOut: extractTime(checkOutValue, "11:00 AM"),
      rules: [...new Set(rules)],
      restrictions: {
        petsAllowed: toBooleanRestriction(
          detailedPolicies.petsAllowed || mergedRestrictions.petsAllowed,
          false
        ),
        smokingAllowed: toBooleanRestriction(
          detailedPolicies.smokingAllowed || mergedRestrictions.smokingAllowed,
          false
        ),
        alcoholAllowed: toBooleanRestriction(
          detailedPolicies.alcoholAllowed || mergedRestrictions.alcoholAllowed,
          false
        )
      },
      cancellationText:
        detailedPolicies.cancellationPolicy ||
        policyEntries.find((p) => p.cancellationText)?.cancellationText ||
        "",
      detailed: detailedPolicies
    };

    const responsePayload = {
      _id: hotel._id,
      hotelId: hotel.hotelId,
      // ── Status fields ──────────────────────────────────────────────────────
      isAccepted:   hotel.isAccepted   ?? false,
      onFront:      hotel.onFront      ?? false,
      localId:      hotel.localId      || '',
      destination:  hotel.destination  || '',
      rating:       hotel.rating       || 0,
      reviewCount:  hotel.reviewCount  || 0,
      ratingBreakdown:    hotel.ratingBreakdown   || {},
      ratingDistribution: hotel.ratingDistribution || {},
      startDate:    hotel.startDate    || null,
      endDate:      hotel.endDate      || null,
      customerWelcomeNote: hotel.customerWelcomeNote || '',
      // ── Availability summary ───────────────────────────────────────────────
      availability: {
        totalRooms,
        availableRooms,
        status: availabilityStatus,
        isFullyBooked,
      },
      basicInfo: {
        name:        hotel.hotelName     || '',
        owner:       hotel.hotelOwnerName || '',
        description: hotel.description   || '',
        category:    hotel.hotelCategory  || '',
        starRating:  hotel.starRating != null ? Number(hotel.starRating) : (hotel.rating || 0),
        propertyType: Array.isArray(hotel.propertyType) ? hotel.propertyType : (hotel.propertyType ? [hotel.propertyType] : []),
        images: hotel.images || [],
        location: {
          address:    hotel.landmark  || '',
          city:       hotel.city      || '',
          state:      hotel.state     || '',
          pinCode:    hotel.pinCode   || '',
          coordinates: {
            lat: hotel.latitude  || null,
            lng: hotel.longitude || null,
          },
          googleMapLink: hotel.googleMapLink || '',
        },
        contacts: {
          phone:          hotel.contact               || '',
          email:          hotel.hotelEmail            || '',
          generalManager: hotel.generalManagerContact || '',
          salesManager:   hotel.salesManagerContact   || '',
        },
      },
      pricingOverview: {
        lowestBasePrice:    lowestPrice === Infinity ? 0 : Math.round(lowestPrice),
        lowestPriceWithTax: lowestPriceWithGST === Infinity ? 0 : Math.round(lowestPriceWithGST),
        currencySymbol: '₹',
        displayString: `Starts from ₹ ${formatCurrency(lowestPrice === Infinity ? 0 : Math.round(lowestPrice))}`,
        taxNote: gstData ? `GST ${gstData.gstPrice}% applicable (Included in final price)` : '',
      },
      rooms:      mappedRooms,
      foods:      mappedFoods,
      amenities:  mappedAmenities,
      policies:   policiesObj,
      // Raw policies array for admin editing
      rawPolicies: hotel.policies || [],
      gstConfig: gstData ? {
        enabled:  true,
        rate:     gstData.gstPrice,
        minLimit: gstData.gstMinThreshold,
        maxLimit: gstData.gstMaxThreshold,
      } : { enabled: false, rate: 0, minLimit: 0, maxLimit: 0 },
    };

    res.json({ success: true, data: responsePayload });
  } catch (error) {
    console.error("Error in getHotelsById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//==================================================================================
const deleteHotelById = async function (req, res) {
  const { hotelId } = req.params;
  try {
    const deletedData = await hotelModel.findOneAndDelete({ hotelId: String(hotelId) });
    if (!deletedData) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }
    res.status(200).json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
//===========================================================
const getHotelsByLocalID = async (req, res) => {
  // localId comes from query string — route is /hotelsLocalId?localId=Accepted
  const { localId } = req.query;

  if (!localId) {
    return res.status(400).json({ error: "localId query parameter is required" });
  }

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    // Fixed: was "location.localId" — schema stores localId at top level
    const cursor = hotelModel.find({ localId }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
};

const normalizeQueryValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const splitQueryValues = (value) =>
  normalizeQueryValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseBooleanQuery = (value) => {
  const normalized = normalizeQueryValue(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return null;
};

const parseNumberQuery = (value) => {
  const normalized = normalizeQueryValue(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const addRegexListFilter = (filters, key, value) => {
  const values = splitQueryValues(value);
  if (!values.length) {
    return;
  }

  filters[key] = values.length === 1
    ? { $regex: escapeRegex(values[0]), $options: "i" }
    : { $in: values.map((item) => new RegExp(escapeRegex(item), "i")) };
};

const addExactStringListFilter = (filters, key, value) => {
  const values = splitQueryValues(value);
  if (!values.length) {
    return;
  }

  filters[key] = values.length === 1 ? values[0] : { $in: values };
};

const matchesAnyText = (value, candidates = []) => {
  const normalized = normalizeQueryValue(value).toLowerCase();
  if (!candidates.length) {
    return true;
  }

  return candidates.some((candidate) => normalized.includes(candidate.toLowerCase()));
};

const arrayContainsAnyText = (items = [], wantedValues = []) => {
  if (!wantedValues.length) {
    return true;
  }

  // Use substring match (same as MongoDB $regex partial match) so results are consistent
  return items.some((item) => {
    const s = normalizeQueryValue(item).toLowerCase();
    return wantedValues.some((v) => s.includes(normalizeQueryValue(v).toLowerCase()));
  });
};

// Strip hyphens so "wi-fi" == "wifi", "wi fi" etc. for comparison
const stripHyphens = (s) => s.replace(/[-\s]+/g, "");

const objectArrayContainsAnyText = (items = [], wantedValues = []) => {
  if (!wantedValues.length) {
    return true;
  }

  // Normalize both with and without hyphens for flexible matching
  const normalizedWanted = wantedValues.map((v) => normalizeQueryValue(v).toLowerCase());
  const strippedWanted = normalizedWanted.map(stripHyphens);

  const matchesItem = (s) => {
    const sLower = normalizeQueryValue(s).toLowerCase();
    const sStripped = stripHyphens(sLower);
    return normalizedWanted.some((w, i) => sLower.includes(w) || sStripped.includes(strippedWanted[i]));
  };

  return items.some((item) => {
    // Case 1: plain string element (e.g. amenities: ["Free WiFi", "Pool"])
    if (typeof item !== "object" || item === null) {
      return matchesItem(item);
    }
    // Case 2: object element — flatten all values including nested arrays
    const flatValues = Object.values(item).flatMap((v) => (Array.isArray(v) ? v : [v]));
    return flatValues.some((v) => matchesItem(v));
  });
};

//============================================hotels by filter city,state,landmark=================================================
const getHotelsByFilters = async (req, res) => {
  try {
    const {
      search,
      hotelId,
      hotelName,
      hotelOwnerName,
      hotelEmail,
      destination,
      city,
      state,
      landmark,
      pinCode,
      starRating,
      minStarRating,
      maxStarRating,
      rating,
      minRating,
      maxRating,
      minReviewCount,
      maxReviewCount,
      propertyType,
      localId,
      onFront,
      isAccepted,
      latitude,
      longitude,
      countRooms,
      requestedRooms,
      hotelCategory,
      type,
      roomType,
      roomId,
      bedTypes,
      amenities,
      unmarriedCouplesAllowed,
      contact,
      generalManagerContact,
      salesManagerContact,
      customerWelcomeNote,
      hasOffer,
      roomSoldOut,
      onlyAvailable,
      minPrice,
      maxPrice,
      minRoomPrice,
      maxRoomPrice,
      checkInDate,
      checkOutDate,
      sortBy = "price",
      sortOrder = "asc",
      page = 1,
      limit = 10,
      guests,
    } = req.query;

    const searchTrim = normalizeQueryValue(search);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    const requestedRoomsCount = parseNumberQuery(requestedRooms) || parseNumberQuery(countRooms) || 1;
    const guestCount = parseNumberQuery(guests);
    const minPriceValue = parseNumberQuery(minRoomPrice) ?? parseNumberQuery(minPrice);
    const maxPriceValue = parseNumberQuery(maxRoomPrice) ?? parseNumberQuery(maxPrice);
    const exactStarRatingValue = parseNumberQuery(starRating);
    const minStarRatingValue = parseNumberQuery(minStarRating);
    const maxStarRatingValue = parseNumberQuery(maxStarRating);
    const exactRatingValue = parseNumberQuery(rating);
    const minRatingValue = parseNumberQuery(minRating);
    const maxRatingValue = parseNumberQuery(maxRating);
    const minReviewCountValue = parseNumberQuery(minReviewCount);
    const maxReviewCountValue = parseNumberQuery(maxReviewCount);
    const roomOfferRequired = parseBooleanQuery(hasOffer);
    const soldOutRequired = parseBooleanQuery(roomSoldOut);
    const onlyAvailableRequired = parseBooleanQuery(onlyAvailable);
    const onFrontRequired = parseBooleanQuery(onFront);
    const acceptedRequired = parseBooleanQuery(isAccepted);
    const amenityValues = splitQueryValues(amenities);
    const propertyTypeValues = splitQueryValues(propertyType);
    const roomTypeValues = splitQueryValues(roomType || type);
    const bedTypeValues = splitQueryValues(bedTypes);
    const unmarriedCouplesAllowedTrim = normalizeQueryValue(unmarriedCouplesAllowed);
    const normalizedRoomId = normalizeQueryValue(roomId);
    const normalizedSortBy = normalizeQueryValue(sortBy).toLowerCase() || "price";
    const normalizedSortOrder = normalizeQueryValue(sortOrder).toLowerCase() === "desc" ? "desc" : "asc";

    // Default filters. If `isAccepted` is explicitly provided, honor it.
    // Otherwise, default to only accepted hotels for public queries —
    // but if caller is searching by owner email, allow both accepted and
    // unaccepted hotels so owners/admins can find unpublished entries.
    const filters = {};
    // If search is "all", only filter by isAccepted=true
    if (searchTrim === "all") {
      filters.isAccepted = true;
    } else if (acceptedRequired !== null) {
      filters.isAccepted = acceptedRequired;
    } else if (!hotelEmail && !req.query.hotelOwnerEmail) {
      filters.isAccepted = true;
    }

    if (searchTrim && searchTrim !== "all") {
      filters.$or = [
        { city: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { state: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { landmark: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { hotelName: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { destination: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { hotelOwnerName: { $regex: escapeRegex(searchTrim), $options: "i" } },
        { hotelEmail: { $regex: escapeRegex(searchTrim), $options: "i" } },
      ];
    }

    addExactStringListFilter(filters, "hotelId", hotelId);
    addRegexListFilter(filters, "hotelName", hotelName);
    addRegexListFilter(filters, "hotelOwnerName", hotelOwnerName);
    // Accept both `hotelEmail` and legacy/alternate `hotelOwnerEmail` query param
    addRegexListFilter(filters, "hotelEmail", hotelEmail || req.query.hotelOwnerEmail);
    addRegexListFilter(filters, "destination", destination);
    addRegexListFilter(filters, "city", city);
    addRegexListFilter(filters, "state", state);
    addRegexListFilter(filters, "landmark", landmark);
    addRegexListFilter(filters, "hotelCategory", hotelCategory);
    addRegexListFilter(filters, "propertyType", propertyType);
    addRegexListFilter(filters, "localId", localId);
    addRegexListFilter(filters, "latitude", latitude);
    addRegexListFilter(filters, "longitude", longitude);
    addRegexListFilter(filters, "contact", contact);
    addRegexListFilter(filters, "generalManagerContact", generalManagerContact);
    addRegexListFilter(filters, "salesManagerContact", salesManagerContact);
    addRegexListFilter(filters, "customerWelcomeNote", customerWelcomeNote);

    const pinCodeValue = parseNumberQuery(pinCode);
    if (pinCodeValue !== null) {
      filters.pinCode = pinCodeValue;
    }
    if (onFrontRequired !== null) {
      filters.onFront = onFrontRequired;
    }
    if (exactStarRatingValue !== null) {
      filters.starRating = String(exactStarRatingValue);
    } else if (minStarRatingValue !== null || maxStarRatingValue !== null) {
      filters.starRating = {
        ...(minStarRatingValue !== null ? { $gte: String(minStarRatingValue) } : {}),
        ...(maxStarRatingValue !== null ? { $lte: String(maxStarRatingValue) } : {}),
      };
    }
    if (exactRatingValue !== null) {
      filters.rating = exactRatingValue;
    } else if (minRatingValue !== null || maxRatingValue !== null) {
      filters.rating = {
        ...(minRatingValue !== null ? { $gte: minRatingValue } : {}),
        ...(maxRatingValue !== null ? { $lte: maxRatingValue } : {}),
      };
    }
    if (minReviewCountValue !== null || maxReviewCountValue !== null) {
      filters.reviewCount = {
        ...(minReviewCountValue !== null ? { $gte: minReviewCountValue } : {}),
        ...(maxReviewCountValue !== null ? { $lte: maxReviewCountValue } : {}),
      };
    }
    if (amenityValues.length) {
      // Normalize hyphens/spaces so "Wi-Fi" matches "WiFi", "Wi Fi", "Wi-Fi" etc.
      const amenityRegexes = amenityValues.map((item) => {
        const pattern = escapeRegex(item).replace(/[-\s]+/g, "[\\s-]*");
        return new RegExp(pattern, "i");
      });
      // Support all three amenity data structures stored in the DB:
      //   1. Flat string array:  amenities: ["Free WiFi", "Pool"]
      //   2. Object with nested amenities array: amenities: [{ hotelId, amenities: ["WiFi", "Fan"] }]
      //   3. Object with name field: amenities: [{ name: "Private Beach", icon: "beach" }]
      const amenityCondition = {
        $or: [
          { amenities: { $in: amenityRegexes } },
          { amenities: { $elemMatch: { amenities: { $in: amenityRegexes } } } },
          { amenities: { $elemMatch: { name: { $in: amenityRegexes } } } },
        ],
      };
      // Merge without overwriting an existing $or (e.g. from the search filter)
      if (filters.$or) {
        filters.$and = [...(filters.$and || []), { $or: filters.$or }, amenityCondition];
        delete filters.$or;
      } else {
        Object.assign(filters, amenityCondition);
      }
    }
    if (unmarriedCouplesAllowedTrim) {
      filters["policies.unmarriedCouplesAllowed"] = unmarriedCouplesAllowedTrim;
    }
    if (normalizedRoomId) {
      filters["rooms.roomId"] = { $regex: escapeRegex(normalizedRoomId), $options: "i" };
    }
    if (roomTypeValues.length) {
      filters["rooms.type"] = roomTypeValues.length === 1
        ? { $regex: escapeRegex(roomTypeValues[0]), $options: "i" }
        : { $in: roomTypeValues.map((item) => new RegExp(escapeRegex(item), "i")) };
    }
    if (bedTypeValues.length) {
      filters["rooms.bedTypes"] = bedTypeValues.length === 1
        ? { $regex: escapeRegex(bedTypeValues[0]), $options: "i" }
        : { $in: bedTypeValues.map((item) => new RegExp(escapeRegex(item), "i")) };
    }
    if (roomOfferRequired !== null) {
      filters["rooms.isOffer"] = roomOfferRequired;
    }
    if (soldOutRequired !== null) {
      filters["rooms.soldOut"] = soldOutRequired;
    }

    const [monthlyData, gstData, allBookings, allHotels] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      (checkInDate && checkOutDate)
        ? bookingsModel.find({
            bookingStatus: { $nin: ["Cancelled", "Failed"] },
            $or: [
              {
                checkInDate: { $lte: checkOutDate },
                checkOutDate: { $gte: checkInDate },
              },
            ],
          }).select("hotelDetails numRooms roomDetails checkInDate checkOutDate").lean()
        : Promise.resolve([]),
      hotelModel.find(filters).lean(),
    ]);

    const calculateGST = (price) => {
      if (!gstData) {
        return { gstPercent: 0, gstAmount: 0 };
      }

      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0;
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = gstData.gstPrice || 12; // mid-tier rate from DB
      } else {
        gstPercent = 18; // luxury tier: 18% per GST regulations
      }

      return {
        gstPercent,
        gstAmount: Math.round((price * gstPercent) / 100),
      };
    };

    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach((booking) => {
        const bookingHotelId = booking?.hotelDetails?.hotelId;
        if (!bookingHotelId) {
          return;
        }

        if (!bookedRoomsMap[bookingHotelId]) {
          bookedRoomsMap[bookingHotelId] = { totalBooked: 0, roomWise: {} };
        }

        bookedRoomsMap[bookingHotelId].totalBooked += booking.numRooms || 0;

        (booking.roomDetails || []).forEach((roomDetail) => {
          if (!roomDetail?.roomId) {
            return;
          }

          bookedRoomsMap[bookingHotelId].roomWise[roomDetail.roomId] =
            (bookedRoomsMap[bookingHotelId].roomWise[roomDetail.roomId] || 0) + 1;
        });
      });
    }

    const processedHotels = [];

    for (const hotel of allHotels) {
      const currentHotelId = hotel.hotelId;
      const bookedInfo = bookedRoomsMap[currentHotelId] || { totalBooked: 0, roomWise: {} };

      let totalRooms = 0;
      let availableRooms = 0;
      let lowestPrice = Infinity;
      let lowestPriceWithGST = Infinity;

      const processedRooms = (hotel.rooms || []).map((room) => {
        const currentRoomId = room.roomId || room._id?.toString();
        const roomCount = room.countRooms || 0;
        const bookedCount = bookedInfo.roomWise[currentRoomId] || 0;
        const available = Math.max(0, roomCount - bookedCount);

        totalRooms += roomCount;
        availableRooms += available;

        const baseRoomPrice = getRoomBasePrice(room);
        let finalPrice = baseRoomPrice;
        let isSpecialPrice = false;
        let monthlyPriceDetails = null;

        if (checkInDate && checkOutDate && monthlyData.length > 0) {
          const matchingMonthlyEntry = monthlyData.find((entry) =>
            entry.hotelId === currentHotelId
            && entry.roomId === currentRoomId
            && entry.startDate <= checkOutDate
            && entry.endDate >= checkInDate
          );

          if (matchingMonthlyEntry) {
            finalPrice = matchingMonthlyEntry.monthPrice;
            isSpecialPrice = true;
            monthlyPriceDetails = {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true,
            };
          }
        }

        const { finalPrice: offerPrice } = getOfferAdjustedPrice({
          room,
          listPrice: finalPrice,
          isSpecialPrice,
          at: new Date(),
        });

        const { gstPercent, gstAmount } = calculateGST(offerPrice);
        const priceWithGST = offerPrice + gstAmount;

        if (available > 0 && offerPrice < lowestPrice) {
          lowestPrice = offerPrice;
          lowestPriceWithGST = priceWithGST;
        }

        return {
          ...room,
          originalPrice: baseRoomPrice,
          finalPrice: offerPrice,
          isSpecialPrice,
          monthlyPriceDetails,
          gstPercent,
          gstAmount,
          priceWithGST,
          totalCount: roomCount,
          bookedCount,
          availableCount: available,
          isAvailable: available > 0,
        };
      });

      const matchingRooms = processedRooms.filter((room) => {
        if (normalizedRoomId && !new RegExp(escapeRegex(normalizedRoomId), "i").test(String(room.roomId || ""))) {
          return false;
        }
        if (roomTypeValues.length && !matchesAnyText(room.type, roomTypeValues)) {
          return false;
        }
        if (bedTypeValues.length && !matchesAnyText(room.bedTypes, bedTypeValues)) {
          return false;
        }
        if (roomOfferRequired !== null && Boolean(room.isOffer) !== roomOfferRequired) {
          return false;
        }
        if (soldOutRequired !== null && Boolean(room.soldOut) !== soldOutRequired) {
          return false;
        }
        if (minPriceValue !== null && room.finalPrice < minPriceValue) {
          return false;
        }
        if (maxPriceValue !== null && room.finalPrice > maxPriceValue) {
          return false;
        }
        if (onlyAvailableRequired === true && room.availableCount < requestedRoomsCount) {
          return false;
        }
        return true;
      });

      if (!matchingRooms.length) {
        continue;
      }

      const isFullyBooked = availableRooms < requestedRoomsCount;
      if (onlyAvailableRequired === true && isFullyBooked) {
        continue;
      }

      if (guestCount !== null) {
        const roomsNeededForGuests = Math.max(1, Math.ceil(guestCount / 2));
        if (availableRooms < roomsNeededForGuests) {
          continue;
        }
      }

      if (propertyTypeValues.length && !arrayContainsAnyText(hotel.propertyType || [], propertyTypeValues)) {
        continue;
      }

      if (amenityValues.length && !objectArrayContainsAnyText(hotel.amenities || [], amenityValues)) {
        continue;
      }

      const visibleLowestPrice = matchingRooms.reduce(
        (min, room) => (room.availableCount > 0 && room.finalPrice < min ? room.finalPrice : min),
        Infinity
      );
      const visibleLowestPriceWithGST = matchingRooms.reduce(
        (min, room) => (room.availableCount > 0 && room.priceWithGST < min ? room.priceWithGST : min),
        Infinity
      );

      processedHotels.push({
        ...hotel,
        rooms: matchingRooms,
        availability: {
          status: isFullyBooked ? "Fully Booked" : "Available",
          totalRooms,
          availableRooms,
          bookedRooms: totalRooms - availableRooms,
          requestedRooms: requestedRoomsCount,
          canBook: !isFullyBooked,
        },
        pricing: {
          startingFrom: visibleLowestPrice === Infinity ? (lowestPrice === Infinity ? 0 : lowestPrice) : visibleLowestPrice,
          startingFromWithGST: visibleLowestPriceWithGST === Infinity
            ? (lowestPriceWithGST === Infinity ? 0 : lowestPriceWithGST)
            : visibleLowestPriceWithGST,
          gstApplicable: Boolean(gstData),
          gstNote: gstData ? `GST @${gstData.gstPrice || 12}% for ₹${gstData.gstMinThreshold + 1}–₹${gstData.gstMaxThreshold}, @18% above ₹${gstData.gstMaxThreshold}` : null,
        },
      });
    }

    processedHotels.sort((a, b) => {
      const availablePriority = Number(Boolean(b.availability?.canBook)) - Number(Boolean(a.availability?.canBook));
      if (availablePriority !== 0) {
        return availablePriority;
      }

      const direction = normalizedSortOrder === "desc" ? -1 : 1;
      switch (normalizedSortBy) {
        case "newest":
        case "createdat":
          return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * direction;
        case "hotelname":
        case "name":
          return a.hotelName.localeCompare(b.hotelName) * direction;
        case "rating":
          return ((a.rating || 0) - (b.rating || 0)) * direction;
        case "reviewcount":
          return ((a.reviewCount || 0) - (b.reviewCount || 0)) * direction;
        case "starrating":
          return ((Number(a.starRating) || 0) - (Number(b.starRating) || 0)) * direction;
        case "pricewithgst":
          return ((a.pricing?.startingFromWithGST || 0) - (b.pricing?.startingFromWithGST || 0)) * direction;
        case "price":
        default:
          return ((a.pricing?.startingFrom || 0) - (b.pricing?.startingFrom || 0)) * direction;
      }
    });

    const total = processedHotels.length;
    const paginatedHotels = processedHotels.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: paginatedHotels,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filters: {
        search: searchTrim || null,
        hotelId: normalizeQueryValue(hotelId) || null,
        hotelName: normalizeQueryValue(hotelName) || null,
        destination: normalizeQueryValue(destination) || null,
        city: normalizeQueryValue(city) || null,
        state: normalizeQueryValue(state) || null,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        requestedRooms: requestedRoomsCount,
        guests: guestCount,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
        hasOffer: roomOfferRequired,
        onlyAvailable: onlyAvailableRequired,
        sortBy: normalizedSortBy,
        sortOrder: normalizedSortOrder,
      },
      gstInfo: gstData
        ? {
            minThreshold: gstData.gstMinThreshold,
            maxThreshold: gstData.gstMaxThreshold,
            midRate: gstData.gstPrice || 12,
            luxuryRate: 18,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in getHotelsByFilters:", error);
    res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
  }
};

const getHotelsState = async function (req, res) {
  try {
    const uniqueStatesSet = new Set();
    const cursor = hotelModel.find().select('state').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.state) {
        uniqueStatesSet.add(hotel.state);
      }
    }

    res.json(Array.from(uniqueStatesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCityByState = async function (req, res) {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({ error: "State parameter is missing" });
    }

    const normalizedState = String(state).trim();
    const stateRegex = new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    const uniqueCitiesSet = new Set();
    const cursor = hotelModel.find({ state: stateRegex }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCitiesSet.add(hotel.city);
      }
    }

    res.json(Array.from(uniqueCitiesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCity = async (req, res) => {
  try {
    const uniqueCities = new Set();
    const cursor = hotelModel.find({ isAccepted: true }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCities.add(hotel.city);
      }
    }
    
    res.status(200).json(Array.from(uniqueCities));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================Update price monthly============================================
// Core logic extracted so it can be called by both the HTTP handler and the cron job
const processMonthlyPrice = async () => {
  const rooms = await month.find();
  const currentDate = new Date();
  const hotels = await hotelModel.find();
  let updatedCount = 0;

  for (const room of rooms) {
    for (const hotel of hotels) {
      for (const roomDetail of (hotel.rooms || [])) {  // Fixed: was hotel.roomDetails (wrong field)
        if (String(room.roomId) === String(roomDetail._id)) {
          const roomDate = room.monthDate;
          if (roomDate <= currentDate) {
            roomDetail.price += room.monthPrice;
            await hotel.save();
            updatedCount++;
          }
          // Fixed: removed early `return` that aborted the entire request
          // on the first unmatched date
        }
      }
    }
  }
  return updatedCount;
};

const monthlyPrice = async function (req, res) {
  try {
    const updatedCount = await processMonthlyPrice();
    res.status(200).json({ message: "Monthly prices updated successfully.", updatedCount });
  } catch (error) {
    console.error("Error in monthlyPrice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fixed: was `await monthlyPrice()` which requires req/res and would crash the cron
cron.schedule("0 0 1 * *", async () => {
  try {
    await processMonthlyPrice();
  } catch (error) {
    console.error("Monthly price cron error:", error);
  }
});
// The first 0 represents the minute (00).
// The second 0 represents the hour (00).
// The 1 in the third position represents the day of the month (1st).
// The * in the fourth and fifth positions represents any month and any day of the week.

const getCurrentISTDateTime = () => DateTime.now().setZone("Asia/Kolkata");

const releaseBookedRoomsForAutomation = async (booking) => {
  const roomDetails = Array.isArray(booking?.roomDetails) ? booking.roomDetails : [];

  for (const room of roomDetails) {
    const roomId = room?.roomId;
    if (!roomId) {
      continue;
    }

    await hotelModel.updateOne(
      { hotelId: booking?.hotelDetails?.hotelId, "rooms.roomId": roomId },
      { $inc: { "rooms.$.countRooms": 1 } }
    );
  }
};

const buildSystemStatusHistoryEntry = ({
  previousStatus,
  newStatus,
  note = "",
}) => ({
  previousStatus,
  newStatus,
  changedAt: new Date(),
  changedBy: {
    id: "system",
    name: "System",
    role: "System",
    type: "system",
  },
  note,
});

const getHotelStakeholderIds = async (booking) => {
  const hotelEmail = String(booking?.hotelDetails?.hotelEmail || "").trim();
  const stakeholders = await dashboardUserModel.find({
    $or: [
      ...(hotelEmail ? [{ email: { $regex: `^${escapeRegex(hotelEmail)}$`, $options: "i" } }] : []),
      { role: { $in: ["Admin", "Developer"] } },
    ],
  })
    .select("_id")
    .lean();

  return [...new Set(stakeholders.map((user) => String(user._id)))];
};

//============================Auto-fail pending bookings after 15 minutes=======================
const autoCancelPendingBookings = async () => {
  try {
    const currentDateIST = getCurrentISTDateTime().toJSDate();
    const fifteenMinutesAgo = getCurrentISTDateTime().minus({ minutes: 15 }).toJSDate();

    const pendingBookings = await bookingsModel.find({
      bookingStatus: "Pending",
      createdAt: { $lte: fifteenMinutesAgo }
    });

    if (pendingBookings.length === 0) {
      return { success: true, failedCount: 0 };
    }

    await Promise.all(pendingBookings.map((booking) => releaseBookedRoomsForAutomation(booking)));

    const result = await bookingsModel.updateMany(
      {
        bookingStatus: "Pending",
        createdAt: { $lte: fifteenMinutesAgo }
      },
      {
        $set: {
          bookingStatus: "Failed",
          failureReason: "Auto-failed: Payment not completed within 15 minutes",
        },
        $push: {
          statusHistory: buildSystemStatusHistoryEntry({
            previousStatus: "Pending",
            newStatus: "Failed",
            note: "Auto-failed: Payment not completed within 15 minutes",
          }),
        },
      }
    );

    return { success: true, failedCount: result.modifiedCount, processedAt: currentDateIST };
  } catch (error) {
    console.error("Error in autoCancelPendingBookings:", error);
    return { success: false, error: error.message };
  }
};

const autoMarkNoShowBookings = async () => {
  try {
    const todayIST = getCurrentISTDateTime().toFormat("yyyy-MM-dd");
    const result = await bookingsModel.updateMany(
      {
        bookingStatus: "Confirmed",
        checkInDate: { $lte: todayIST },
      },
      {
        $set: {
          bookingStatus: "No-Show",
          noShowMarkedAt: getCurrentISTDateTime().toJSDate(),
        },
        $push: {
          statusHistory: buildSystemStatusHistoryEntry({
            previousStatus: "Confirmed",
            newStatus: "No-Show",
            note: "Auto-marked as no-show after check-in date ended without check-in",
          }),
        },
      }
    );

    return { success: true, updatedCount: result.modifiedCount };
  } catch (error) {
    console.error("Error in autoMarkNoShowBookings:", error);
    return { success: false, error: error.message };
  }
};

const autoSendCheckoutReminders = async () => {
  try {
    const nowIST = getCurrentISTDateTime();
    if (nowIST.hour < 14) {
      return { success: true, remindedCount: 0, skipped: true };
    }

    const startOfToday = nowIST.startOf("day").toJSDate();
    const checkoutToday = nowIST.toFormat("yyyy-MM-dd");
    const dueBookings = await bookingsModel.find({
      bookingStatus: "Checked-in",
      checkOutDate: checkoutToday,
      $or: [
        { lastCheckoutReminderAt: null },
        { lastCheckoutReminderAt: { $lt: startOfToday } },
      ],
    });

    for (const booking of dueBookings) {
      const stakeholderIds = await getHotelStakeholderIds(booking);
      if (stakeholderIds.length > 0) {
        await createUserNotificationSafe({
          name: "Checkout Reminder",
          message: `Booking ${booking.bookingId} for ${booking.hotelDetails?.hotelName || "hotel"} is still checked-in. Please mark checked-out if the guest has left.`,
          path: "/app/bookings/hotel",
          eventType: "hotel_checkout_reminder",
          metadata: {
            bookingId: booking.bookingId,
            hotelId: booking.hotelDetails?.hotelId,
            checkOutDate: booking.checkOutDate,
          },
          userIds: stakeholderIds,
        });
      }

      booking.lastCheckoutReminderAt = nowIST.toJSDate();
      await booking.save();
    }

    return { success: true, remindedCount: dueBookings.length };
  } catch (error) {
    console.error("Error in autoSendCheckoutReminders:", error);
    return { success: false, error: error.message };
  }
};

cron.schedule("*/5 * * * *", async () => {
  setImmediate(async () => {
    try {
      await autoCancelPendingBookings();
    } catch (error) {
      console.error("Auto-cancel cron error:", error);
    }
  });
});

cron.schedule("59 23 * * *", async () => {
  setImmediate(async () => {
    try {
      await autoMarkNoShowBookings();
    } catch (error) {
      console.error("Auto no-show cron error:", error);
    }
  });
});

cron.schedule("*/15 * * * *", async () => {
  setImmediate(async () => {
    try {
      await autoSendCheckoutReminders();
    } catch (error) {
      console.error("Auto checkout reminder cron error:", error);
    }
  });
});

//=========================================list of applied coupons hotel==========================
const getCouponsAppliedHotels = async (req, res) => {
  try {
    const now = new Date();
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    const cursor = hotelModel.find({ "rooms.isOffer": true }).cursor();
    
    for await (const hotel of cursor) {
      const activeOfferRooms = (hotel.rooms || []).filter((room) =>
        isOfferActive(room, now)
      );

      if (activeOfferRooms.length === 0) {
        continue;
      }

      if (!first) res.write(',');
      res.write(JSON.stringify({
        ...hotel.toObject(),
        rooms: activeOfferRooms,
      }));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error("Error fetching hotels with offers:", error);
    res.status(500).json({ message: "Error fetching hotels", error });
  }
};

const getRoomOfferStatus = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    if (!hotelId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "hotelId and roomId are required",
      });
    }

    const hotel = await hotelModel.findOne(
      { hotelId, "rooms.roomId": roomId },
      { hotelId: 1, hotelName: 1, rooms: 1 }
    ).lean();

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel or room not found",
      });
    }

    const room = (hotel.rooms || []).find(
      (item) => String(item.roomId) === String(roomId)
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const basePrice = getRoomBasePrice(room);
    const { finalPrice, offerApplied } = getOfferAdjustedPrice({
      room,
      listPrice: basePrice,
      isSpecialPrice: false,
      at: new Date(),
    });

    return res.status(200).json({
      success: true,
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      roomId: room.roomId,
      isOfferActive: offerApplied,
      offer: offerApplied
        ? {
            name: room.offerName || "Offer",
            discountPrice: Number(room.offerPriceLess) || 0,
            expiresAt: room.offerExp || null,
          }
        : null,
      pricing: {
        basePrice: Number(basePrice) || 0,
        finalPrice: Number(finalPrice) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch room offer status",
      error: error.message,
    });
  }
};

//================================================================================================
module.exports = {
  createHotel,
  getAllHotels,
  getHotelsById,
  getHotelsByLocalID,
  getHotelsByFilters,
  getCity,
  getByQuery,
  UpdateHotelMaster,
  getHotels,
  setOnFront,
  deleteHotelById,
  getHotelsState,
  getHotelsCity,
  getHotelsCityByState,
  monthlyPrice,
  getCount,
  getCouponsAppliedHotels,
  getRoomOfferStatus,
  getCountPendingHotels,
  deleteHotelImages,
  autoCancelPendingBookings,
};
