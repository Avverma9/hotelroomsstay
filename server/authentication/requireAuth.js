const jwt = require('jsonwebtoken');
require('dotenv').config();

const SKIP_PATH_PREFIXES = [
  '/health',
  '/auth/me',
  '/auth/refresh',
  '/auth/refresh/dashboard',
  '/mail',
  '/login/dashboard/user',
  '/forgot-password/dashboard/user',
  '/change-password/dashboard/user',
  '/create/dashboard/user',
  '/signup',
  '/signIn',
  '/signIn/google',
  '/send-otp',
  '/verify-otp',
  '/get/',
  '/get/offers/main/hotels',
  '/get-all/travel/location',
  '/monthly-set-room-price/get/by/',
  '/hotels/get-by-id/',
  '/gst/get-single-gst',
  '/get/all/users-filtered/booking/by',
  '/getreviews/hotelid',
  '/travel/get-all-car',
  '/travel/get-a-car/',
  '/travel/filter-car/by-query',
  '/travel/get-seat-data/by-id/',
  '/search-tours/from-to',
  '/tours/visiting-places',
  '/get-tour-list',
  '/sort-tour/by-price',
  '/sort-tour/by-duration',
  '/sort-tour/by-themes',
  '/sort-tour/by-order',
  '/get-tour/',
  '/tours/',
];

const getRawToken = (headerValue) => {
  if (!headerValue) {
    return '';
  }
  const value = String(headerValue).trim();
  if (!value) {
    return '';
  }
  if (/^Bearer\s+/i.test(value)) {
    return value.replace(/^Bearer\s+/i, '').trim();
  }
  return value;
};

const shouldSkipPath = (path) => {
  const normalized = String(path || '').toLowerCase();
  return SKIP_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
};

const requireAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const path = req.path || '';
  if (shouldSkipPath(path)) {
    return next();
  }

  const token = getRawToken(req.headers.authorization || req.headers['authorization']);
  if (!token) {
    return res.status(401).json({ message: 'Access denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Access denied: Token has expired' });
    }
    return res.status(403).json({ message: 'Access denied: Invalid token' });
  }
};

module.exports = requireAuth;
