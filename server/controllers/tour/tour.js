const Tour = require("../../models/tour/tour");

/* =========================================================
   HELPERS (INTERNAL ONLY)
========================================================= */
const toTermsMap = (terms) => {
  if (!terms) return undefined;

  if (typeof terms === "object" && !Array.isArray(terms)) return terms;

  try {
    const parsed = JSON.parse(terms);
    return typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const normalizeVehicles = (vehicles) => {
  if (!vehicles) return [];

  let parsed = vehicles;

  if (typeof vehicles === "string") {
    try {
      parsed = JSON.parse(vehicles);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((v) => ({
    name: v.name,
    vehicleNumber: v.vehicleNumber || "",
    totalSeats: Number(v.totalSeats),
    seaterType: v.seaterType || "",

    seatConfig: v.seatConfig
      ? {
          rows: Number(v.seatConfig.rows),
          left: Number(v.seatConfig.left),
          right: Number(v.seatConfig.right),
          aisle: v.seatConfig.aisle !== false,
        }
      : undefined,

    seatLayout: Array.isArray(v.seatLayout) ? v.seatLayout : [],
    bookedSeats: Array.isArray(v.bookedSeats) ? v.bookedSeats : [],
    pricePerSeat: Number(v.pricePerSeat || 0),
    isActive: v.isActive !== false,
  }));
};

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

/* =========================================================
   CREATE TOUR
========================================================= */
exports.createTour = async (req, res) => {
  try {
    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.location)
      : [];

    const body = { ...req.body };

    const termsMap = toTermsMap(body.termsAndConditions);
    if (termsMap) body.termsAndConditions = termsMap;

    body.vehicles = normalizeVehicles(body.vehicles);
    body.amenities = parseArrayField(body.amenities);
    body.inclusion = parseArrayField(body.inclusion);
    body.exclusion = parseArrayField(body.exclusion);
    body.dayWise = parseArrayField(body.dayWise);

    const created = await Tour.create({ ...body, images });

    return res.status(201).json({
      success: true,
      message: "Tour created successfully",
      data: created,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create tour",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE TOUR
========================================================= */
exports.updateTour = async (req, res) => {
  const { id } = req.params;

  try {
    const body = { ...req.body };

    const termsMap = toTermsMap(body.termsAndConditions);
    if (termsMap) body.termsAndConditions = termsMap;

    if (body.vehicles) body.vehicles = normalizeVehicles(body.vehicles);

    ["amenities", "inclusion", "exclusion", "dayWise"].forEach((f) => {
      if (body[f]) body[f] = parseArrayField(body[f]);
    });

    const updated = await Tour.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Tour not found" });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update tour",
      error: error.message,
    });
  }
};

/* =========================================================
   IMAGE MANAGEMENT
========================================================= */
exports.changeTourImage = async (req, res) => {
  const { id } = req.params;

  try {
    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.location)
      : [];

    const updated = await Tour.findByIdAndUpdate(
      id,
      { $push: { images: { $each: images } } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Tour not found" });

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Image update failed",
    });
  }
};

exports.deleteTourImage = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;

  try {
    const tour = await Tour.findById(id);
    if (!tour)
      return res.status(404).json({ success: false, message: "Tour not found" });

    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= tour.images.length)
      return res.status(400).json({ success: false, message: "Invalid index" });

    const removed = tour.images.splice(idx, 1);
    await tour.save();

    return res.json({
      success: true,
      removed: removed[0],
      remaining: tour.images,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Delete image failed",
    });
  }
};

/* =========================================================
   FILTERS & SORTING  (⚠️ ORIGINAL NAMES PRESERVED)
========================================================= */
exports.sortByOrder = async (req, res) => {
  const order = req.query.sort === "desc" ? -1 : 1;
  const data = await Tour.find({ isAccepted: true }).sort({ price: order });
  return res.json({ success: true, data });
};

exports.sortByPrice = async (req, res) => {
  const { minPrice, maxPrice } = req.query;
  const q = { isAccepted: true };

  if (minPrice) q.price = { ...q.price, $gte: Number(minPrice) };
  if (maxPrice) q.price = { ...q.price, $lte: Number(maxPrice) };

  const data = await Tour.find(q);
  return res.json({ success: true, data });
};

exports.sortByDuration = async (req, res) => {
  const { minNights, maxNights } = req.query;
  const q = { isAccepted: true };

  if (minNights) q.nights = { ...q.nights, $gte: Number(minNights) };
  if (maxNights) q.nights = { ...q.nights, $lte: Number(maxNights) };

  const data = await Tour.find(q);
  return res.json({ success: true, data });
};

/** ⚠️ ORIGINAL NAME MAINTAINED */
exports.sortBythemes = async (req, res) => {
  const { themes } = req.query;
  const data = await Tour.find({ themes, isAccepted: true });
  return res.json({ success: true, data });
};

/* =========================================================
   FETCH TOURS
========================================================= */
exports.getTourList = async (_, res) => {
  const data = await Tour.find({ isAccepted: true }).sort({ createdAt: -1 });
  return res.json({ success: true, data });
};

exports.getTourById = async (req, res) => {
  const data = await Tour.findById(req.params.id);
  if (!data)
    return res.status(404).json({ success: false, message: "Tour not found" });
  return res.json({ success: true, data });
};

exports.getTourByOwner = async (req, res) => {
  const { email } = req.query;
  const data = await Tour.find({
    agencyEmail: { $regex: email, $options: "i" },
    isAccepted: true,
  }).sort({ createdAt: -1 });

  return res.json({ success: true, data });
};

exports.getByCity = async (req, res) => {
  const q = req.query.city
    ? { city: { $regex: req.query.city, $options: "i" }, isAccepted: true }
    : { isAccepted: true };

  const data = await Tour.find(q).sort({ createdAt: -1 });
  return res.json({ success: true, data });
};

exports.getAllCities = async (_, res) => {
  const docs = await Tour.find({ isAccepted: true }).select("city");
  const cities = [...new Set(docs.map((d) => d.city).filter(Boolean))];
  return res.json({ success: true, data: cities });
};

exports.getRequestedTour = async (_, res) => {
  const data = await Tour.find({ isAccepted: false }).sort({ createdAt: -1 });
  return res.json({ success: true, data });
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeQuery = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " "); // multiple spaces -> single

const buildLooseSpaceRegex = (value) => {
  const normalized = normalizeQuery(value);
  if (!normalized) return null;

  // escape special chars first, then make spaces flexible
  const escaped = escapeRegex(normalized);
  const pattern = escaped.replace(/\s+/g, "\\s*"); // "new york" => "new\\s*york"
  return new RegExp(pattern, "i");
};

exports.searchTours = async (req, res) => {
  try {
    const { from, to } = req.query;

    const queryObj = { isAccepted: true };
    const andFilters = [];

    const fromRegex = buildLooseSpaceRegex(from);
    if (fromRegex) {
      andFilters.push({ visitngPlaces: { $regex: fromRegex } });
    }

    const toRegex = buildLooseSpaceRegex(to);
    if (toRegex) {
      andFilters.push({ visitngPlaces: { $regex: toRegex } });
    }

    if (andFilters.length) queryObj.$and = andFilters;

    const data = await Tour.find(queryObj).sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to search tours",
      error: error.message,
    });
  }
};

/* =========================================================
   VISITING PLACES LIST
========================================================= */
exports.getAllVisitingPlaces = async (_, res) => {
  try {
    const docs = await Tour.find({ isAccepted: true }).select("visitngPlaces");
    const set = new Set();

    docs.forEach((d) => {
      const raw = d.visitngPlaces;
      if (!raw || typeof raw !== "string") return;

      raw
        .split(/[|,]/g)
        .map((p) => p.replace(/\d+\s*[Nn]\s*/g, "").trim())
        .filter(Boolean)
        .forEach((p) => set.add(p));
    });

    return res.json({ success: true, data: Array.from(set) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch visiting places",
      error: error.message,
    });
  }
};
