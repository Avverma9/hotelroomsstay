const hotelModel = require("../../models/hotel/basicDetails");

const toStr = (v) => (v === undefined || v === null ? "" : String(v)).trim();
const toNum = (v, fallback = 0) => {
  const s = toStr(v);
  if (!s) return fallback;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200",
];

// Parse JSON string from Excel cell to array/object
const parseJsonField = (v, fallback = []) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "object" && v !== null) return v;
  const s = toStr(v);
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

// Parse boolean from Excel (TRUE/FALSE strings)
const parseBool = (v) => {
  if (typeof v === "boolean") return v;
  const s = toStr(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
};

const parseMaybeDate = (v) => {
  const s = toStr(v);
  if (!s) return undefined;
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined" || low === ".") return undefined;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return undefined;
};

const ensureEmail = (email, idx) => {
  const e = toStr(email).toLowerCase();
  if (e.includes("@") && e.includes(".")) return e;
  return `hotel${idx + 1}@example.com`;
};

const normalizeOneHotel = (h, idx) => {
  // Parse JSON fields from Excel
  const images = parseJsonField(h.images, []);
  const rooms = parseJsonField(h.rooms, []);
  const foods = parseJsonField(h.foods, []);
  const amenities = parseJsonField(h.amenities, []);
  const policies = parseJsonField(h.policies, {});
  const propertyType = parseJsonField(h.propertyType, ["Hotel"]);

  const out = {
    hotelName: toStr(h.hotelName) || `Hotel ${idx + 1}`,
    description: toStr(h.description) || "Comfortable stay",
    hotelOwnerName: toStr(h.hotelOwnerName) || "Owner",
    destination: toStr(h.destination) || toStr(h.city) || "Destination",
    onFront: parseBool(h.onFront),
    state: toStr(h.state) || "State",
    city: toStr(h.city) || "City",
    landmark: toStr(h.landmark) || "Near main market",
    pinCode: toNum(h.pinCode, 0),
    hotelCategory: toStr(h.hotelCategory) || "",
    numRooms: toNum(h.numRooms, 0),
    latitude: toStr(h.latitude) || "",
    longitude: toStr(h.longitude) || "",
    reviews: toNum(h.reviews, 0),
    rating: toNum(h.rating, 4.2),
    starRating: toStr(h.starRating) || "2",
    propertyType: Array.isArray(propertyType) ? propertyType : [propertyType],
    contact: toNum(h.contact, 9999999999),
    isAccepted: parseBool(h.isAccepted),
    salesManagerContact: toStr(h.salesManagerContact) || "",
    localId: toStr(h.localId) || "Accepted",
    hotelEmail: ensureEmail(h.hotelEmail, idx),
    customerWelcomeNote: toStr(h.customerWelcomeNote) || `Welcome to ${toStr(h.hotelName) || `Hotel ${idx + 1}`}.`,
    generalManagerContact: toStr(h.generalManagerContact) || "",
    images: images.length ? images : [pick(DEFAULT_IMAGES)],
    rooms: rooms,
    foods: foods,
    amenities: amenities,
    policies: policies,
    reviewCount: toNum(h.reviewCount, 0),
  };

  // Handle hotelId if provided from Excel (for updates/imports)
  if (h.hotelId && toStr(h.hotelId)) {
    out.hotelId = toStr(h.hotelId);
  }

  const sd = parseMaybeDate(h.startDate);
  const ed = parseMaybeDate(h.endDate);
  if (sd) out.startDate = sd;
  if (ed) out.endDate = ed;

  // Clean up empty/undefined fields
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined || out[k] === null) delete out[k];
    if (typeof out[k] === "string" && !out[k].trim()) delete out[k];
    if (out[k] === ".") delete out[k]; // Remove placeholder dots
  });

  return out;
};

const createHotelBulk = async (req, res) => {
  try {
    let payload = req.body?.payload ?? req.body?.data ?? req.body;

    if (typeof payload === "string") {
      payload = JSON.parse(payload);
    }

    if (!Array.isArray(payload)) {
      return res.status(400).json({
        status: false,
        message: "payload must be an array (send as FormData field 'payload' or raw JSON array)",
      });
    }

    const docs = payload.map((h, i) => normalizeOneHotel(h || {}, i));

    const inserted = await hotelModel.insertMany(docs, { ordered: false }); // continues on errors [web:66]

    return res.status(201).json({
      status: true,
      message: "Bulk hotels inserted",
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

module.exports = { createHotelBulk };
