const Tour = require("../../models/tour/tour");
const mongoose = require("mongoose");

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

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* =========================================================
   ROUTE & STATUS HELPERS
========================================================= */
/**
 * Converts visitingPlaces string like "1N Patna | 2N Delhi | 3N sasaram"
 * into a route string like "Patna->Delhi->Sasaram"
 */
const buildRouteFromVisitingPlaces = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .split(/[|,]/g)
    .map((p) => p.replace(/\d+\s*[Nn]\s*/g, "").trim())
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("->");
};

/**
 * Computes runningStatus based on tourStartDate and tourEndDate vs today.
 * - upcoming : startDate is in the future
 * - ongoing  : today falls between start and end (inclusive)
 * - completed: endDate is in the past
 */
const computeRunningStatus = (tourStartDate, tourEndDate) => {
  if (!tourStartDate) return undefined;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(tourStartDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (!tourEndDate) {
    return startDay > today ? "upcoming" : "completed";
  }
  const end = new Date(tourEndDate);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (today < startDay) return "upcoming";
  if (today > endDay) return "completed";
  return "ongoing";
};

/** Adds runningStatus to a mongoose doc or plain lean object */
const withStatus = (doc) => {
  if (!doc) return doc;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const status = computeRunningStatus(plain.tourStartDate, plain.tourEndDate);
  if (status !== undefined) plain.runningStatus = status;
  return plain;
};

const escapeRegexExact = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeSpace = (s) => String(s || "").trim().replace(/\s+/g, " ");

const sanitizeKeyword = (v) => {
  const normalized = normalizeSpace(v);
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  if (["null", "undefined"].includes(lower)) return "";
  return normalized;
};

const buildPlaceTokenRegex = (place) => {
  const normalized = normalizeSpace(place);
  if (!normalized) return null;
  const escaped = escapeRegexExact(normalized).replace(/\s+/g, "\\s+");
  const pattern = `(?:^|[|,])\\s*(?:\\d+\\s*[Nn]\\s*)?${escaped}\\s*(?=[|,]|$)`;
  return new RegExp(pattern, "i");
};

const buildLooseContainsRegex = (value) => {
  const normalized = normalizeSpace(value);
  if (!normalized) return null;
  const escaped = escapeRegexExact(normalized).replace(/\s+/g, "\\s*");
  return new RegExp(escaped, "i");
};

const normalizeMatchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\d+\s*[Nn]\s*/g, " ")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitPlaces = (rawPlaces) =>
  String(rawPlaces || "")
    .split(/[|,]/g)
    .map((part) => normalizeMatchText(part))
    .filter(Boolean);

const matchesCityLoose = (cityName, keyword) => {
  const cityNorm = normalizeMatchText(cityName);
  const keywordNorm = normalizeMatchText(keyword);
  if (!cityNorm || !keywordNorm) return false;
  return cityNorm.includes(keywordNorm) || keywordNorm.includes(cityNorm);
};

const matchesPlaceLoose = (rawPlaces, keyword) => {
  const keywordNorm = normalizeMatchText(keyword);
  if (!keywordNorm) return false;
  const rawNorm = normalizeMatchText(rawPlaces);
  if (rawNorm.includes(keywordNorm)) return true;
  const tokens = splitPlaces(rawPlaces);
  return tokens.some(
    (token) => token.includes(keywordNorm) || keywordNorm.includes(token)
  );
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

    // Auto-generate route from visitingPlaces if not provided
    const rawPlaces = body.visitngPlaces || body.visitingPlaces;
    if (rawPlaces && !body.route) {
      body.route = buildRouteFromVisitingPlaces(rawPlaces);
    }

    const created = await Tour.create({ ...body, images });
    return res.status(201).json({
      success: true,
      message: "Tour created successfully",
      data: withStatus(created),
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

    // Re-generate route if visitingPlaces is being updated
    const rawPlaces = body.visitngPlaces || body.visitingPlaces;
    if (rawPlaces) {
      body.route = buildRouteFromVisitingPlaces(rawPlaces);
    }

    const updated = await Tour.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Tour not found" });

    return res.json({ success: true, data: withStatus(updated) });
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
    return res.status(500).json({ success: false, message: "Image update failed" });
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

    return res.json({ success: true, removed: removed[0], remaining: tour.images });
  } catch {
    return res.status(500).json({ success: false, message: "Delete image failed" });
  }
};

/* =========================================================
   GET SINGLE TOUR
========================================================= */
exports.getTourById = async (req, res) => {
  const data = await Tour.findById(req.params.id);
  if (!data)
    return res.status(404).json({ success: false, message: "Tour not found" });
  return res.json({ success: true, data: withStatus(data) });
};

/* =========================================================
   ADMIN – PENDING TOUR REQUESTS
========================================================= */
exports.getRequestedTour = async (_, res) => {
  const docs = await Tour.find({ isAccepted: false }).sort({ createdAt: -1 });
  return res.json({ success: true, data: docs.map(withStatus) });
};

/* =========================================================
   OWNER TOURS
========================================================= */
exports.getTourByOwner = async (req, res) => {
  const { email } = req.query;
  const docs = await Tour.find({
    agencyEmail: { $regex: email, $options: "i" },
    isAccepted: true,
  }).sort({ createdAt: -1 });
  return res.json({ success: true, data: docs.map(withStatus) });
};

/* =========================================================
   UTILITY – CITIES & VISITING PLACES
========================================================= */
exports.getAllCities = async (_, res) => {
  const docs = await Tour.find({ isAccepted: true }).select("city");
  const cities = [...new Set(docs.map((d) => d.city).filter(Boolean))];
  return res.json({ success: true, data: cities });
};

exports.getAllVisitingPlaces = async (_, res) => {
  try {
    const docs = await Tour.find({ isAccepted: true }).select("visitngPlaces visitingPlaces");
    const set = new Set();
    docs.forEach((d) => {
      const raw = d.visitngPlaces || d.visitingPlaces;
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

exports.getAllTours = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const allowedSort = new Set(["createdAt", "price", "starRating", "nights", "tourStartDate"]);
    const sortField = allowedSort.has(sortBy) ? sortBy : "createdAt";
    const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDir };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      Tour.find({ isAccepted: true }).sort(sort).skip(skip).limit(limitNum).lean(),
      Tour.countDocuments({ isAccepted: true }),
    ]);

    return res.json({
      success: true,
      data: docs.map(withStatus),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasNextPage: skip + docs.length < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

/* =========================================================
   MAIN FILTER / SEARCH  (replaces: sortByOrder, sortByPrice,
   sortByDuration, sortBythemes, getTourList, getByCity, searchTours)
========================================================= */
exports.filterTours = async (req, res) => {
  try {
    const {
      q,
      country, state, city,
      from: fromCity,
      themes, amenities, amenitiesMode,
      fromWhere, to,
      visitingPlace, visitingPlaces,
      minPrice, maxPrice,
      minNights, maxNights,
      minRating,
      nights, price, starRating,
      fromDate, toDate: toDateQuery,
      startDate, endDate,
      agencyEmail,
      isCustomizable, hasImages, hasVehicles,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      runningStatus,
    } = req.query;

    // ── Sort setup (needed for both paths) ──────────────────
    const allowedSort = new Set(["createdAt", "price", "starRating", "nights", "tourStartDate"]);
    const sortField = allowedSort.has(sortBy) ? sortBy : "createdAt";
    const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDir };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    /* =========================================================
       SHORT-CIRCUIT: no filters at all → return everything
    ========================================================= */
    const hasAnyFilter =
      q || country || state || city || fromCity ||
      themes || amenities ||
      fromWhere || to || visitingPlace || visitingPlaces ||
      minPrice || maxPrice || minNights || maxNights || minRating ||
      nights || price || agencyEmail || starRating ||
      fromDate || toDateQuery || startDate || endDate ||
      isCustomizable || hasImages || hasVehicles || runningStatus;

    if (!hasAnyFilter) {
      const [docs, total] = await Promise.all([
        Tour.find({ isAccepted: true }).sort(sort).skip(skip).limit(limitNum).lean(),
        Tour.countDocuments({ isAccepted: true }),
      ]);

      return res.json({
        success: true,
        data: docs.map(withStatus),
        pagination: {
          page: pageNum, limit: limitNum, total,
          hasNextPage: skip + docs.length < total,
          hasPrevPage: pageNum > 1,
        },
        applied: {
          q: "", country: "", state: "", city: "", from: "",
          themes: "", amenities: "", amenitiesMode: "all",
          fromWhere: "", to: "", visitingPlace: "",
          minPrice: null, maxPrice: null,
          minNights: null, maxNights: null, minRating: null,
          fromDate: null, toDate: null,
          sortBy: sortField, sortOrder: sortDir === 1 ? "asc" : "desc",
          usedCityFallback: false, usedRouteLooseFallback: false,
        },
      });
    }

    /* =========================================================
       FILTER BUILD (only runs when at least one param exists)
    ========================================================= */
    const filter = { isAccepted: true };
    const andClauses = [];
    const routeClauses = [];
    const cityValue = sanitizeKeyword(city || fromCity);

    if (country) filter.country = new RegExp(`^${escapeRegexExact(country)}$`, "i");
    if (state) filter.state = new RegExp(`^${escapeRegexExact(state)}$`, "i");
    if (cityValue) filter.city = new RegExp(`^${escapeRegexExact(cityValue)}$`, "i");

    if (themes) {
      const list = splitList(themes);
      if (list.length)
        filter.themes = { $in: list.map((t) => new RegExp(escapeRegexExact(t), "i")) };
    }

    if (amenities) {
      const list = splitList(amenities);
      if (list.length) {
        const mode = String(amenitiesMode || "all").toLowerCase().trim();
        filter.amenities = mode === "any" ? { $in: list } : { $all: list };
      }
    }

    const routeAnd = [];
    const fromWhereValue = sanitizeKeyword(fromWhere);
    const toValue = sanitizeKeyword(to);
    const singlePlaceValue = sanitizeKeyword(visitingPlace || visitingPlaces);

    const pushFromWhereClause = (placeValue) => {
      const fromCityRegex = buildLooseContainsRegex(placeValue);
      const placeRegex = buildPlaceTokenRegex(placeValue);
      const placeLooseRegex = buildLooseContainsRegex(placeValue);
      const fromWhereOr = [{ city: fromCityRegex }];
      if (placeRegex)
        fromWhereOr.push({ visitngPlaces: placeRegex }, { visitingPlaces: placeRegex });
      if (placeLooseRegex)
        fromWhereOr.push({ visitngPlaces: placeLooseRegex }, { visitingPlaces: placeLooseRegex });
      routeAnd.push({ $or: fromWhereOr });
    };

    const pushPlaceClause = (placeValue) => {
      const placeRegex = buildPlaceTokenRegex(placeValue);
      const placeLooseRegex = buildLooseContainsRegex(placeValue);
      const placeOr = [];
      if (placeRegex)
        placeOr.push({ visitngPlaces: placeRegex }, { visitingPlaces: placeRegex });
      if (placeLooseRegex)
        placeOr.push({ visitngPlaces: placeLooseRegex }, { visitingPlaces: placeLooseRegex });
      if (placeOr.length === 0) return;
      routeAnd.push({ $or: placeOr });
    };

    if (fromWhereValue) pushFromWhereClause(fromWhereValue);
    if (toValue) pushPlaceClause(toValue);
    if (!fromWhereValue && !toValue && singlePlaceValue) pushPlaceClause(singlePlaceValue);

    if (routeAnd.length > 0) {
      routeClauses.push(...routeAnd);
      andClauses.push(...routeAnd);
    }

    const minP = toNum(minPrice), maxP = toNum(maxPrice);
    if (minP !== null || maxP !== null) {
      filter.price = {};
      if (minP !== null) filter.price.$gte = minP;
      if (maxP !== null) filter.price.$lte = maxP;
    }
    const exactPrice = toNum(price);
    if (exactPrice !== null) filter.price = exactPrice;

    const minN = toNum(minNights), maxN = toNum(maxNights);
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
    if (agencyEmail && String(agencyEmail).trim()) {
      filter.agencyEmail = new RegExp(
        `^${escapeRegexExact(String(agencyEmail).trim())}$`,
        "i"
      );
    }

    const customizable = toBool(isCustomizable);
    if (customizable !== null) filter.isCustomizable = customizable;

    const imgFlag = toBool(hasImages);
    if (imgFlag !== null)
      filter.images = imgFlag ? { $exists: true, $ne: [] } : { $in: [[], null] };

    const vehFlag = toBool(hasVehicles);
    if (vehFlag !== null)
      filter.vehicles = vehFlag ? { $exists: true, $ne: [] } : { $in: [[], null] };

    const d1 = toDate(fromDate || startDate);
    const d2 = toDate(toDateQuery || endDate);
    if (d1 || d2) {
      const range = {};
      if (d1) range.$gte = d1;
      if (d2) range.$lte = d2;
      filter.$or = [{ from: range }, { to: range }, { tourStartDate: range }];
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      const searchOr = [
        { travelAgencyName: rx }, { city: rx }, { state: rx }, { country: rx },
        { visitngPlaces: rx }, { visitingPlaces: rx }, { themes: rx }, { overview: rx },
      ];
      filter.$or ? andClauses.push({ $or: searchOr }) : (filter.$or = searchOr);
    }

    // runningStatus filter – uses stored tourStartDate / tourEndDate
    if (runningStatus) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const status = String(runningStatus).toLowerCase().trim();
      if (status === "upcoming") {
        filter.tourStartDate = { $gt: today };
      } else if (status === "ongoing") {
        filter.tourStartDate = { $lte: today };
        filter.tourEndDate = { $gte: today };
      } else if (status === "completed") {
        filter.tourEndDate = { $lt: today };
      }
    }

    if (andClauses.length > 0) filter.$and = andClauses;

    const runQuery = async (queryFilter) => {
      const [docs, count] = await Promise.all([
        Tour.find(queryFilter).sort(sort).skip(skip).limit(limitNum).lean(),
        Tour.countDocuments(queryFilter),
      ]);
      return { docs, count };
    };

    const buildFilterWithoutRouteClauses = () => {
      const cleanedFilter = { ...filter };
      if (Array.isArray(filter.$and)) {
        const remainingAnd = filter.$and.filter((c) => !routeClauses.includes(c));
        remainingAnd.length > 0
          ? (cleanedFilter.$and = remainingAnd)
          : delete cleanedFilter.$and;
      }
      return cleanedFilter;
    };

    let { docs: items, count: total } = await runQuery(filter);
    let usedCityFallback = false;
    let usedRouteLooseFallback = false;

    if (cityValue && routeClauses.length > 0 && items.length === 0) {
      ({ docs: items, count: total } = await runQuery(buildFilterWithoutRouteClauses()));
      usedCityFallback = true;
    }

    if (routeClauses.length > 0 && items.length === 0) {
      const candidates = await Tour.find(buildFilterWithoutRouteClauses()).sort(sort).lean();
      const routeMatched = candidates.filter((doc) => {
        const fromMatch = fromWhereValue
          ? matchesCityLoose(doc.city, fromWhereValue) ||
          matchesPlaceLoose(doc.visitngPlaces, fromWhereValue) ||
          matchesPlaceLoose(doc.visitingPlaces, fromWhereValue)
          : true;
        const toMatch = toValue
          ? matchesPlaceLoose(doc.visitngPlaces, toValue) ||
          matchesPlaceLoose(doc.visitingPlaces, toValue) ||
          matchesCityLoose(doc.city, toValue)
          : true;
        const singlePlaceMatch =
          !fromWhereValue && !toValue && singlePlaceValue
            ? matchesPlaceLoose(doc.visitngPlaces, singlePlaceValue) ||
            matchesPlaceLoose(doc.visitingPlaces, singlePlaceValue) ||
            matchesCityLoose(doc.city, singlePlaceValue)
            : true;
        return fromMatch && toMatch && singlePlaceMatch;
      });
      total = routeMatched.length;
      items = routeMatched.slice(skip, skip + limitNum);
      usedRouteLooseFallback = true;
    }

    return res.json({
      success: true,
      data: items.map(withStatus),
      pagination: {
        page: pageNum, limit: limitNum, total,
        hasNextPage: skip + items.length < total,
        hasPrevPage: pageNum > 1,
      },
      applied: {
        q: q || "", country: country || "", state: state || "",
        city: cityValue || "", from: sanitizeKeyword(fromCity),
        themes: themes || "", amenities: amenities || "",
        amenitiesMode: amenitiesMode || "all",
        fromWhere: sanitizeKeyword(fromWhere), to: sanitizeKeyword(to),
        visitingPlace: sanitizeKeyword(visitingPlace || visitingPlaces),
        minPrice: minP, maxPrice: maxP, minNights: minN, maxNights: maxN,
        minRating: minR,
        fromDate: d1 ? d1.toISOString() : null,
        toDate: d2 ? d2.toISOString() : null,
        sortBy: sortField, sortOrder: sortDir === 1 ? "asc" : "desc",
        runningStatus: runningStatus || null,
        usedCityFallback, usedRouteLooseFallback,
      },
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};
