const jwt = require("jsonwebtoken");
const DashboardUser = require("../models/dashboardUser");
const { getUserRouteAccess } = require("../controllers/addtionalSettings/routePermissionService");

require("dotenv").config();

const SKIP_PATH_PREFIXES = [
  "/health",
  "/auth/me",
  "/auth/refresh",
  "/auth/refresh/dashboard",
  "/mail",
  "/signup",
  "/signIn",
  "/signIn/google",
  "/send-otp",
  "/verify-otp",
  "/login/dashboard/user",
  "/forgot-password/dashboard/user",
  "/change-password/dashboard/user",
  "/create/dashboard/user",
  "/get/",
  "/additional/route-permissions/",
  "/additional/sidebar-links/",
  "/get/offers/main/hotels",
  "/get-all/travel/location",
  "/monthly-set-room-price/get/by/",
  "/hotels/get-by-id/",
  "/gst/get-single-gst",
  "/get/all/users-filtered/booking/by",
  "/getReviews/hotelId",
  "/travel/get-all-car",
  "/travel/get-a-car/",
  "/travel/filter-car/by-query",
  "/travel/get-seat-data/by-id/",
  "/search-tours/from-to",
  "/tours/visiting-places",
  "/get-tour-list",
  "/sort-tour/by-price",
  "/sort-tour/by-duration",
  "/sort-tour/by-themes",
  "/sort-tour/by-order",
  "/get-tour/",
  "/tours/",
];

const getRawToken = (headerValue) => {
  if (!headerValue) {
    return "";
  }

  const value = String(headerValue).trim();
  if (!value) {
    return "";
  }

  if (/^Bearer\s+/i.test(value)) {
    return value.replace(/^Bearer\s+/i, "").trim();
  }

  return value;
};

const shouldSkipPath = (path) => {
  return SKIP_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const routeAccess = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }

    const apiPath = String(req.path || "");
    if (shouldSkipPath(apiPath)) {
      return next();
    }

    // Use the panel page route sent by the frontend (x-page-route header).
    // If header is absent (non-panel clients), skip the check entirely.
    const pageRoute = req.headers["x-page-route"];
    if (!pageRoute) {
      return next();
    }

    const token = getRawToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next();
    }

    if (!decoded?.id) {
      return next();
    }

    const user = await DashboardUser.findById(decoded.id)
      .select("role routePermissions")
      .lean();

    if (!user) {
      return next();
    }

    const access = getUserRouteAccess({
      user,
      routePath: pageRoute,
    });

    if (!access.hasAccess) {
      return res.status(403).json({
        message: "Access denied for this route",
        data: {
          routePath: pageRoute,
          matchedRuleType: access.matchedRuleType,
          matchedPattern: access.matchedPattern,
          mode: access.mode,
        },
      });
    }

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = routeAccess;
