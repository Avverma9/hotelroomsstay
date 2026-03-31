const normalizeIdList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim());
  }

  return [String(value).trim()];
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
};
