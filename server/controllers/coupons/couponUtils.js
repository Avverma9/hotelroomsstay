const normalizeIdList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim());
  }

  return [String(value).trim()];
};

const { DateTime } = require('luxon');

/**
 * Normalize a validity value (string/date) to a JS Date representing
 * the end of that day in Asia/Kolkata (IST). If validity already includes
 * a time component, preserve it. Returns a Date or null.
 */
const normalizeValidityToEndOfDayIST = (validity) => {
  if (!validity) return null;

  // If it's already a Date with a time component, return as Date
  if (validity instanceof Date && !Number.isNaN(validity.getTime())) {
    return validity;
  }

  // If numeric timestamp
  if (typeof validity === 'number') {
    const d = new Date(validity);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Try parseable string
  try {
    const s = String(validity).trim();
    if (!s) return null;

    // If string contains time component (T or space + hh:mm), parse directly and return
    if (/\dT\d|\d:\d/.test(s)) {
      const dt = DateTime.fromISO(s, { zone: 'utc' });
      if (dt.isValid) return dt.toJSDate();
    }

    // Otherwise interpret as a date (yyyy-mm-dd or similar) in Asia/Kolkata
    const dt = DateTime.fromISO(s, { zone: 'Asia/Kolkata' });
    if (dt.isValid) {
      return dt.endOf('day').toJSDate();
    }

    // Fallback to JS Date
    const fallback = new Date(s);
    if (!Number.isNaN(fallback.getTime())) {
      // set to end of that local day in Asia/Kolkata
      const local = DateTime.fromJSDate(fallback).setZone('Asia/Kolkata');
      return local.endOf('day').toJSDate();
    }
  } catch (err) {
    // ignore
  }

  return null;
};

const toSafeNumber = (val) => Number(val) || 0;

const getUsageLimit = (coupon) => {
  const fromMaxUsage = Number(coupon?.maxUsage);
  if (Number.isFinite(fromMaxUsage) && fromMaxUsage > 0) {
    return fromMaxUsage;
  }

  const fromQuantity = Number(coupon?.quantity);
  if (Number.isFinite(fromQuantity) && fromQuantity > 0) {
    return fromQuantity;
  }

  return 1;
};

const isCouponExpired = (coupon) => {
  if (!coupon || coupon.expired === true || !coupon.validity) {
    return true;
  }

  const expiry = new Date(coupon.validity);
  if (Number.isNaN(expiry.getTime())) {
    return true;
  }

  if (expiry < new Date()) {
    return true;
  }

  const usageLimit = getUsageLimit(coupon);
  return Number(coupon.usedCount || 0) >= usageLimit;
};

const getRemainingQuota = (coupon) => {
  const usageLimit = getUsageLimit(coupon);
  return Math.max(0, usageLimit - Number(coupon.usedCount || 0));
};

const registerCouponUsage = ({ coupon, usageCount, usageEntries = [] }) => {
  const count = Math.max(0, Number(usageCount || 0));
  coupon.usedCount = Number(coupon.usedCount || 0) + count;

  if (!Array.isArray(coupon.usageHistory)) {
    coupon.usageHistory = [];
  }
  if (usageEntries.length > 0) {
    coupon.usageHistory.push(...usageEntries);
  }

  const remaining = getRemainingQuota(coupon);
  if (remaining <= 0) {
    coupon.expired = true;
  }

  return remaining;
};

module.exports = {
  normalizeIdList,
  getUsageLimit,
  isCouponExpired,
  getRemainingQuota,
  registerCouponUsage,
  normalizeValidityToEndOfDayIST,
};
