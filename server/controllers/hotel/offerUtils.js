const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRoomBasePrice = (room = {}) => {
  const explicitOriginal = toNumber(room.originalPrice);
  if (explicitOriginal !== null) {
    return explicitOriginal;
  }

  const currentPrice = toNumber(room.price) ?? 0;
  const discount = toNumber(room.offerPriceLess) ?? 0;

  // Backward compatibility: old flow stored discounted price directly in `price`.
  if (room.isOffer && discount > 0) {
    return currentPrice + discount;
  }

  return currentPrice;
};

const isOfferActive = (room = {}, at = new Date()) => {
  if (!room.isOffer) {
    return false;
  }

  const discount = toNumber(room.offerPriceLess) ?? 0;
  if (discount <= 0) {
    return false;
  }

  if (!room.offerExp) {
    return true;
  }

  const expiryDate = new Date(room.offerExp);
  if (Number.isNaN(expiryDate.getTime())) {
    return true;
  }

  return expiryDate >= at;
};

const getOfferAdjustedPrice = ({
  room = {},
  listPrice,
  isSpecialPrice = false,
  at = new Date(),
}) => {
  const safeListPrice = toNumber(listPrice);
  const baseListPrice = safeListPrice !== null ? safeListPrice : getRoomBasePrice(room);

  if (!isOfferActive(room, at)) {
    return {
      finalPrice: baseListPrice,
      offerApplied: false,
    };
  }

  // Legacy offers (without originalPrice) already had discounted `price` persisted.
  const hasOriginalPrice =
    room.originalPrice !== undefined &&
    room.originalPrice !== null &&
    room.originalPrice !== "";

  if (!isSpecialPrice && !hasOriginalPrice) {
    return {
      finalPrice: baseListPrice,
      offerApplied: true,
    };
  }

  const discount = toNumber(room.offerPriceLess) ?? 0;
  return {
    finalPrice: Math.max(0, baseListPrice - discount),
    offerApplied: true,
  };
};

module.exports = {
  toNumber,
  getRoomBasePrice,
  isOfferActive,
  getOfferAdjustedPrice,
};
