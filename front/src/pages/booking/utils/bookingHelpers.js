/**
 * Booking Helper Functions
 * Extracted from Booknow.jsx for modularity
 */

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1501117716987-c8e1ecb21014?auto=format&fit=crop&w=900&q=80&ixlib=rb-4.0.3';

export const DEFAULT_AMENITIES = ['Free Wi-Fi', 'Breakfast available', 'Air conditioning', 'Daily housekeeping'];

export const formatCurrency = (value) => 
  new Intl.NumberFormat('en-IN').format(Math.max(Math.round(value || 0), 0));

export const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ensureIsoDate = (value, offsetFallback = 0) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const base = new Date();
  base.setDate(base.getDate() + offsetFallback);
  return base.toISOString();
};

export const normalizeHotelId = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

export const deriveHotelId = (hotel) => {
  if (!hotel) return '';
  const candidates = [hotel.hotelId, hotel._id, hotel.id, hotel.hotelCode, hotel.slug];
  for (const candidate of candidates) {
    const normalized = normalizeHotelId(candidate);
    if (normalized) return normalized;
  }
  return '';
};

export const normalizeAmenities = (amenities, fallback = []) => {
  if (!amenities) return fallback;
  if (Array.isArray(amenities)) {
    return amenities
      .flatMap((item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (Array.isArray(item.amenities)) return item.amenities;
        if (typeof item === 'object') return Object.values(item).filter((value) => typeof value === 'string');
        return [];
      })
      .map((x) => (typeof x === 'string' ? x.trim() : x))
      .filter(Boolean);
  }
  if (typeof amenities === 'string') return amenities.split(',').map((item) => item.trim()).filter(Boolean);
  return fallback;
};

export const extractPriceCandidate = (payload) => {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload;
  if (typeof payload === 'string') {
    const parsed = Number(payload.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const candidate = extractPriceCandidate(entry);
      if (candidate !== null) return candidate;
    }
    return null;
  }
  if (typeof payload === 'object') {
    const preferred = ['finalPrice', 'price', 'discountedPrice', 'amount', 'total'];
    for (const key of preferred) {
      if (payload[key] !== undefined) {
        const candidate = extractPriceCandidate(payload[key]);
        if (candidate !== null) return candidate;
      }
    }
  }
  return null;
};

export const sumFoodSelections = (items = []) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const qty = Math.max(parseNumber(item?.quantity ?? 0, 0), 0);
    if (!qty) return sum;
    const unitFromPrice = parseNumber(item?.price ?? 0, 0);
    const unitFromTotal = item?.totalPrice ? parseNumber(item.totalPrice, 0) / Math.max(qty, 1) : 0;
    const unit = unitFromPrice > 0 ? unitFromPrice : unitFromTotal;
    return sum + qty * Math.max(unit, 0);
  }, 0);

export const calculateStayNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
};

export const deriveRoomAvailability = (room) => {
  const explicit = room?.isAvailable;
  if (typeof explicit === 'boolean') return explicit;
  if (room?.soldOut === true) return false;
  const availableCount = parseNumber(room?.availableCount ?? room?.countRooms ?? room?.totalCount ?? 0, 0);
  const totalRooms = parseNumber(room?.totalRooms ?? 0, 0);
  if (totalRooms > 0) return availableCount > 0;
  return availableCount > 0;
};

export const requiredRoomsForGuests = (guests) => Math.max(Math.ceil(parseNumber(guests, 1) / 3), 1);

export const dateRangesOverlap = (startA, endA, startB, endB) => {
  const aStart = new Date(startA);
  const aEnd = new Date(endA);
  const bStart = new Date(startB);
  const bEnd = new Date(endB);
  if ([aStart, aEnd, bStart, bEnd].some((d) => Number.isNaN(d.getTime()))) return false;
  return aStart < bEnd && bStart < aEnd;
};

export const pickMonthlyOverride = (monthlyData, roomId, checkInIso, checkOutIso) => {
  if (!Array.isArray(monthlyData) || !monthlyData.length) return null;
  if (!roomId || !checkInIso || !checkOutIso) return null;
  
  return monthlyData.find((entry) => {
    const entryRoomId = entry?.roomId || entry?._id || entry?.room?._id;
    if (!entryRoomId || String(entryRoomId) !== String(roomId)) return false;
    return dateRangesOverlap(checkInIso, checkOutIso, entry?.startDate, entry?.endDate);
  }) || null;
};

export const badgeForPolicy = (val) => {
  const raw = val === undefined || val === null ? '' : String(val).trim();
  const norm = raw.toLowerCase();
  const yes = ['yes', 'allowed', 'accepted', 'both', 'true'].includes(norm);
  const no = ['no', 'not allowed', 'not accepted', 'false'].includes(norm);
  if (yes) return { text: raw || 'Allowed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  if (no) return { text: raw || 'Not allowed', cls: 'bg-rose-50 text-rose-700 border-rose-100' };
  if (!raw) return { text: 'N/A', cls: 'bg-gray-50 text-gray-700 border-gray-100' };
  return { text: raw, cls: 'bg-blue-50 text-blue-700 border-blue-100' };
};
