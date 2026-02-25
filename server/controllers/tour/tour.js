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
// controllers/tour.controller.js
const mongoose = require("mongoose");

const toNum = (v) => {
  if (v === undefined || v === null) return null;
  const raw = String(v).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v) => {
  if (v === undefined) return null;
  const s = String(v).toLowerCase().trim();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return null;
};

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

const splitList = (v) =>
  String(v || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const escapeRegexExact = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeSpace = (s) => String(s || "").trim().replace(/\s+/g, " ");
const sanitizeKeyword = (v) => {
  const normalized = normalizeSpace(v);
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  if (["null", "undefined"].includes(lower)) return "";
  return normalized;
};

// Match a place token in comma/pipe separated strings, with optional prefix like "1N "
const buildPlaceTokenRegex = (place) => {
  const normalized = normalizeSpace(place);
  if (!normalized) return null;

  const escaped = escapeRegexExact(normalized).replace(/\s+/g, "\\s+");
  const pattern = `(?:^|[|,])\\s*(?:\\d+\\s*[Nn]\\s*)?${escaped}\\s*(?=[|,]|$)`;
  return new RegExp(pattern, "i");
};

exports.filterTours = async (req, res) => {
  try {
    const {
      // text search
      q,

      // location
      country,
      state,
      city,

      // themes & amenities
      themes, // comma separated: "Culture,Heritage"
      amenities, // comma separated: "Hotel Stay,Breakfast"
      amenitiesMode, // "all" (default) | "any"
      fromWhere, // match token in visitngPlaces (supports optional "1N " prefix)
      to, // match token in visitngPlaces (supports optional "1N " prefix)

      // numeric filters
      minPrice,
      maxPrice,
      minNights,
      maxNights,
      minRating, // starRating >= minRating
      nights, // exact nights (optional)
      price, // exact price (optional)
      starRating, // exact starRating (optional)

      // date filters (data me from/to/tourStartDate)
      fromDate, // e.g. 2025-02-20
      toDate: toDateQuery, // e.g. 2025-02-24
      startDate, // alias
      endDate,   // alias

      // flags
      isCustomizable,
      hasImages,
      hasVehicles,

      // pagination/sort
      page = 1,
      limit = 10,
      sortBy = "createdAt", // createdAt | price | starRating | nights | tourStartDate
      sortOrder = "desc",   // asc | desc
    } = req.query;

    const filter = { isAccepted: true };

    // --- location exact (case-insensitive safe) ---
    if (country) filter.country = new RegExp(`^${escapeRegexExact(country)}$`, "i");
    if (state) filter.state = new RegExp(`^${escapeRegexExact(state)}$`, "i");
    if (city) filter.city = new RegExp(`^${escapeRegexExact(city)}$`, "i");

    // --- themes: match ANY theme token inside string like "Culture, Heritage, Group" OR "धार्मिक यात्रा" ---
    if (themes) {
      const list = splitList(themes);
      if (list.length) {
        // themes is a string in your data, so regex OR works best
        filter.themes = { $in: list.map((t) => new RegExp(escapeRegexExact(t), "i")) };
      }
    }

    // --- amenities: data me amenities array hai (most), kabhi string bhi ho sakta ---
    if (amenities) {
      const list = splitList(amenities);
      if (list.length) {
        const mode = String(amenitiesMode || "all").toLowerCase().trim();
        if (mode === "any") {
          filter.amenities = { $in: list };
        } else {
          // default ALL
          filter.amenities = { $all: list };
        }
      }
    }

    // --- route keywords inside visitngPlaces string ---
    const routeAnd = [];
    const fromWhereValue = sanitizeKeyword(fromWhere);
    const toValue = sanitizeKeyword(to);

    // Apply route filter only when BOTH inputs are present.
    // If user clears either input, route filter is ignored and all tours can return.
    if (fromWhereValue && toValue) {
      const fromWhereRx = buildPlaceTokenRegex(fromWhereValue);
      const toRx = buildPlaceTokenRegex(toValue);

      if (fromWhereRx) {
        routeAnd.push({
          $or: [{ visitngPlaces: fromWhereRx }, { visitingPlaces: fromWhereRx }],
        });
      }

      if (toRx) {
        routeAnd.push({
          $or: [{ visitngPlaces: toRx }, { visitingPlaces: toRx }],
        });
      }
    }

    if (routeAnd.length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push(...routeAnd);
    }

    // --- numeric ranges ---
    const minP = toNum(minPrice);
    const maxP = toNum(maxPrice);
    if (minP !== null || maxP !== null) {
      filter.price = {};
      if (minP !== null) filter.price.$gte = minP;
      if (maxP !== null) filter.price.$lte = maxP;
    }
    const exactPrice = toNum(price);
    if (exactPrice !== null) filter.price = exactPrice;

    const minN = toNum(minNights);
    const maxN = toNum(maxNights);
    if (minN !== null || maxN !== null) {
      filter.nights = {};
      if (minN !== null) filter.nights.$gte = minN;
      if (maxN !== null) filter.nights.$lte = maxN;
    }
    const exactNights = toNum(nights);
    if (exactNights !== null) filter.nights = exactNights;

    const minR = toNum(minRating);
    if (minR !== null) filter.starRating = { $gte: minR };

    const exactRating = toNum(starRating);
    if (exactRating !== null) filter.starRating = exactRating;

    // --- flags ---
    const customizable = toBool(isCustomizable);
    if (customizable !== null) filter.isCustomizable = customizable;

    const imgFlag = toBool(hasImages);
    if (imgFlag !== null) {
      filter.images = imgFlag ? { $exists: true, $ne: [] } : { $in: [[], null] };
    }

    const vehFlag = toBool(hasVehicles);
    if (vehFlag !== null) {
      filter.vehicles = vehFlag ? { $exists: true, $ne: [] } : { $in: [[], null] };
    }

    // --- date range ---
    const d1 = toDate(fromDate || startDate);
    const d2 = toDate(toDateQuery || endDate);

    if (d1 || d2) {
      // your docs may have `from`, `to`, or `tourStartDate`
      // We’ll match if any of these fall in range.
      const range = {};
      if (d1) range.$gte = d1;
      if (d2) range.$lte = d2;

      filter.$or = [
        { from: range },          // if from is Date
        { to: range },            // if to is Date
        { tourStartDate: range }, // if tourStartDate is Date/String(Date)
      ];
    }

    // --- search (agency/city/places/themes) ---
    if (q && String(q).trim()) {
      const needle = escapeRegex(String(q).trim());
      const rx = new RegExp(needle, "i");

      // combine with existing $or if already present (date-range)
      const searchOr = [
        { travelAgencyName: rx },
        { city: rx },
        { state: rx },
        { country: rx },
        { visitngPlaces: rx },
        { visitingPlaces: rx },
        { themes: rx },
        { overview: rx },
      ];

      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    // --- sorting ---
    const allowedSort = new Set(["createdAt", "price", "starRating", "nights", "tourStartDate"]);
    const sortField = allowedSort.has(sortBy) ? sortBy : "createdAt";
    const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDir };

    // --- pagination ---
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Tour.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Tour.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasNextPage: skip + items.length < total,
        hasPrevPage: pageNum > 1,
      },
      applied: {
        q: q || "",
        country: country || "",
        state: state || "",
        city: city || "",
        themes: themes || "",
        amenities: amenities || "",
        amenitiesMode: amenitiesMode || "all",
        fromWhere: sanitizeKeyword(fromWhere),
        to: sanitizeKeyword(to),
        minPrice: minP,
        maxPrice: maxP,
        minNights: minN,
        maxNights: maxN,
        minRating: minR,
        fromDate: d1 ? d1.toISOString() : null,
        toDate: d2 ? d2.toISOString() : null,
        sortBy: sortField,
        sortOrder: sortDir === 1 ? "asc" : "desc",
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
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
