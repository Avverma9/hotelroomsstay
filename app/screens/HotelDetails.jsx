import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  Share,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";

import { getHotelById } from "../store/slices/hotelSlice";
import {
  createBooking,
  resetBookingState,
  applyCouponCode,
  resetCoupon,
  fetchMonthlyData,
  getGstForHotelData,
} from "../store/slices/bookingSlice";
import { getUserId } from "../utils/credentials";
import { getAmenityDisplayName, getAmenityIconName } from "../utils/amenities";
import {
  getRoomFinalPrice as resolveRoomFinalPrice,
  getRoomOriginalPrice as resolveRoomOriginalPrice,
  isRoomOfferActive,
} from "../utils/hotelOffers";
import HotelDetailsSkeleton from "../components/skeleton/HotelDetailsSkeleton";
import { useAppModal } from "../contexts/AppModalContext";

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  navy: "#0E1B35",
  navyMid: "#162449",
  gold: "#C4974A",
  goldLight: "#F0D9A8",
  cream: "#FAFAF7",
  white: "#FFFFFF",
  slate1: "#F4F3F0",
  slate2: "#E8E5DF",
  slate3: "#C5BFB4",
  slate4: "#9A9189",
  slate5: "#6B6460",
  text1: "#1A1713",
  text2: "#4A4540",
  text3: "#9A9189",
  green: "#1E7A4E",
  greenBg: "#EDFAF3",
  red: "#C0392B",
  redBg: "#FEF0EE",
  blue: "#1E4ED8",
  blueBg: "#EFF4FF",
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const MAX_GUESTS = 20;
const MAX_ROOMS = 10;
const MAX_GUESTS_PER_ROOM = 3;
const PREVIEW_POLICY_COUNT = 3;
const POLICY_EXCLUDED_KEYS = new Set([
  "_id", "__v", "id", "hotelId", "createdAt", "updatedAt", "onDoubleSharing",
  "onQuadSharing", "onBulkBooking", "onTrippleSharing", "onMoreThanFour",
  "offDoubleSharing", "offQuadSharing", "offBulkBooking", "offTrippleSharing",
  "offMoreThanFour", "onDoubleSharingAp", "onQuadSharingAp", "onBulkBookingAp",
  "onTrippleSharingAp", "onMoreThanFourAp", "onDoubleSharingMAp", "onQuadSharingMAp",
  "onBulkBookingMAp", "onTrippleSharingMAp", "onMoreThanFourMAp", "offDoubleSharingAp",
  "offQuadSharingAp", "offBulkBookingAp", "offTrippleSharingAp", "offMoreThanFourAp",
  "offDoubleSharingMAp", "offQuadSharingMAp", "offBulkBookingMAp", "offTrippleSharingMAp",
  "offMoreThanFourMAp",
]);
const getRequiredRoomsForGuests = (guests) => {
  const n = clamp(Number(guests) || 1, 1, MAX_GUESTS);
  return Math.max(1, Math.ceil(n / MAX_GUESTS_PER_ROOM));
};
const parseNumber = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v.replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const normalizeBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const n = value.trim().toLowerCase();
    if (n === "true" || n === "yes" || n === "1") return true;
    if (n === "false" || n === "no" || n === "0") return false;
  }
  return null;
};
const toList = (value) => { if (Array.isArray(value)) return value; if (!value) return []; return [value]; };
const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatCurrencyINR = (value) => `₹${Math.round(parseNumber(value)).toLocaleString("en-IN")}`;
const formatFullDate = (d) => {
  try { return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; }
};
const getMonthMatrix = (date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startWeekday = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const weeks = []; let week = [];
  const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  for (let i = 0; i < startWeekday; i++) week.push({ day: prevMonthEnd - (startWeekday - 1 - i), inMonth: false, monthOffset: -1 });
  for (let d = 1; d <= daysInMonth; d++) { week.push({ day: d, inMonth: true, monthOffset: 0 }); if (week.length === 7) { weeks.push(week); week = []; } }
  let nextDay = 1; while (week.length < 7 && week.length > 0) week.push({ day: nextDay++, inMonth: false, monthOffset: 1 });
  if (week.length > 0) weeks.push(week);
  return weeks;
};
const dateRangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const aS = toDateOnly(new Date(aStart)).getTime(), aE = toDateOnly(new Date(aEnd)).getTime();
  const bS = toDateOnly(new Date(bStart)).getTime(), bE = toDateOnly(new Date(bEnd)).getTime();
  return aS <= bE && bS <= aE;
};
const extractFoods = (hotel) => {
  const direct = hotel?.basicInfo?.foods || hotel?.foods || hotel?.menu || hotel?.basicInfo?.menu || null;

  const flattenFoodCandidates = (value) => {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(flattenFoodCandidates);
    if (typeof value !== "object") return [];

    const nestedCollections = [
      value.items,
      value.foods,
      value.menu,
      value.categories,
      value.sections,
      value.children,
      value.list,
      value.data,
    ].filter(Boolean);

    if (nestedCollections.length > 0) {
      const flattenedNested = nestedCollections.flatMap(flattenFoodCandidates);
      if (flattenedNested.length > 0) return flattenedNested;
    }

    return [value];
  };

  const isLikelyFoodItem = (value) => {
    if (typeof value === "string") return true;
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Boolean(
      value.name ||
      value.title ||
      value.foodId ||
      value.id ||
      value._id ||
      value.price !== undefined ||
      value.about ||
      value.description ||
      value.foodType ||
      value.type
    );
  };

  const normalizedPriceLabel = (rawLabel) =>
    String(rawLabel || "")
      .replace(/â‚¹/g, "₹")
      .replace(/\s+/g, " ")
      .trim();

  const candidates = flattenFoodCandidates(direct).filter(isLikelyFoodItem);

  return candidates.map((food, index) => {
    if (typeof food === "string") {
      return {
        id: `food-${index}`,
        name: food,
        type: "Veg",
        description: "Description not available.",
        images: [],
        price: 0,
        displayPrice: "Price on request",
      };
    }

    const images = Array.isArray(food?.images)
      ? food.images.filter(Boolean)
      : food?.image
        ? [food.image]
        : [];
    const type = String(food?.type || food?.foodType || "Veg").trim() || "Veg";
    const price = parseNumber(food?.price);
    const serverPriceLabel = normalizedPriceLabel(food?.displayPrice || food?.priceLabel || food?.formattedPrice);

    return {
      id: food?.id || food?.foodId || food?._id || `food-${index}`,
      name: food?.name || food?.title || `Food Item ${index + 1}`,
      type,
      description: String(food?.description || food?.about || "Description not available.").trim(),
      images,
      price,
      displayPrice: serverPriceLabel || (price > 0 ? formatCurrencyINR(price) : "Price on request"),
    };
  });
};

const getFoodAccent = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "veg") return { color: C.green, bg: C.greenBg, icon: "leaf-outline" };
  if (normalized === "vegan") return { color: "#047857", bg: "#ECFDF5", icon: "nutrition-outline" };
  return { color: C.red, bg: C.redBg, icon: "restaurant-outline" };
};

// ─── DESIGN PRIMITIVES ───────────────────────────────────────────────────────

/** Thin gold divider */
const GoldDivider = () => (
  <View style={{ height: 1, backgroundColor: C.slate2, marginVertical: 14 }} />
);

/** Section label — uppercase, tight tracked */
const SectionLabel = ({ title, action, actionLabel }) => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.gold }} />
      <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.4, color: C.text2, textTransform: "uppercase" }}>
        {title}
      </Text>
    </View>
    {!!action && (
      <TouchableOpacity onPress={action}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.gold, letterSpacing: 0.4 }}>{actionLabel || "View all"}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/** Counter row */
const CounterRow = ({ label, value, onDec, onInc, minVal, maxVal }) => (
  <View style={{ alignItems: "center", flex: 1 }}>
    <Text style={{ fontSize: 10, fontWeight: "700", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{label}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <TouchableOpacity
        onPress={onDec} disabled={value <= minVal}
        style={[s.counterBtn, value <= minVal && s.counterBtnDisabled]}>
        <Ionicons name="remove" size={13} color={value <= minVal ? C.slate3 : C.text1} />
      </TouchableOpacity>
      <Text style={{ fontSize: 16, fontWeight: "800", color: C.text1, minWidth: 22, textAlign: "center" }}>{value}</Text>
      <TouchableOpacity
        onPress={onInc} disabled={value >= maxVal}
        style={[s.counterBtn, value >= maxVal && s.counterBtnDisabled]}>
        <Ionicons name="add" size={13} color={value >= maxVal ? C.slate3 : C.text1} />
      </TouchableOpacity>
    </View>
  </View>
);

/** Amenity pill */
const AmenityPill = ({ icon, label }) => (
  <View style={s.amenityPill}>
    <Ionicons name={icon} size={13} color={C.green} />
    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "600", color: C.text2, marginLeft: 6, flexShrink: 1 }}>{label}</Text>
  </View>
);

/** Tag badge */
const Badge = ({ label, color, bg, icon }) => (
  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: bg }}>
    {!!icon && <Ionicons name={icon} size={9} color={color} style={{ marginRight: 4 }} />}
    <Text style={{ fontSize: 9, fontWeight: "800", color, letterSpacing: 0.3 }}>{label}</Text>
  </View>
);

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.slate2 },
  cardSm: { backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.slate2 },
  counterBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.slate2, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  counterBtnDisabled: { backgroundColor: C.slate1, borderColor: C.slate2 },
  amenityPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.slate2, backgroundColor: C.white, flex: 1 },
  input: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: "600", color: C.text1 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.slate1, borderWidth: 1, borderColor: C.slate2, borderRadius: 14, paddingHorizontal: 14, height: 48 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.slate2, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 },
  bookBtn: { backgroundColor: C.navy, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate2 },
  priceTag: { backgroundColor: C.navyMid, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  roomCard: { backgroundColor: C.white, borderRadius: 18, marginBottom: 10, borderWidth: 1.5, borderColor: C.slate2, overflow: "hidden" },
  roomCardSel: { borderColor: C.navy },
  summaryBox: { backgroundColor: C.navy, borderRadius: 14, padding: 14 },
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const HotelDetails = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { showError, showSuccess } = useAppModal();

  const {
    hotelId, checkInDate: paramCheckIn, checkOutDate: paramCheckOut,
    guests: paramGuests, countRooms: paramRooms,
  } = route?.params || {};

  const { selectedHotel: hotel, selectedHotelLoading: loading, selectedHotelError: error } = useSelector((state) => state.hotel);
  const { bookingStatus, bookingError, monthlyData, gstData, couponStatus, couponError, discountAmount, appliedCoupon, couponResult, createdBookingStatus, createdBookingPendingReason } = useSelector((state) => state.booking);
  const userState = useSelector((state) => state.user);
  const user = userState?.user || userState?.data || null;

  const [checkInDate, setCheckInDate] = useState(paramCheckIn ? new Date(paramCheckIn) : new Date());
  const [checkOutDate, setCheckOutDate] = useState(paramCheckOut ? new Date(paramCheckOut) : new Date(Date.now() + 86400000));

  const initialGuestsCount = clamp(Number(paramGuests) || 2, 1, MAX_GUESTS);
  const initialRoomsCount = Math.max(clamp(Number(paramRooms) || 1, 1, MAX_ROOMS), getRequiredRoomsForGuests(initialGuestsCount));

  const [guestsCount, setGuestsCount] = useState(initialGuestsCount);
  const [roomsCount, setRoomsCount] = useState(initialRoomsCount);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [guestName, setGuestName] = useState(user?.userName || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.mobile || "");

  const [showDateModal, setShowDateModal] = useState(false);
  const [dateModalTarget, setDateModalTarget] = useState("in");
  const [calendarBase, setCalendarBase] = useState(new Date());
  const lastGstQueryRef = useRef(null);
  const couponRoomKeyRef = useRef(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [paymentMode, setPaymentMode] = useState("offline");
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedFood, setSelectedFood] = useState([]);
  const galleryScrollRef = useRef(null);

  useEffect(() => {
    if (!hotelId) return;
    const cin = paramCheckIn
      ? new Date(paramCheckIn).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const cout = paramCheckOut
      ? new Date(paramCheckOut).toISOString().split("T")[0]
      : new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const rooms = Number(paramRooms) || 1;
    dispatch(getHotelById({ id: hotelId, checkInDate: cin, checkOutDate: cout, countRooms: rooms }));
    dispatch(fetchMonthlyData(hotelId));
    dispatch(resetCoupon());
    setCouponCodeInput("");
    couponRoomKeyRef.current = null;
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (!user) return;
    setGuestName(user?.userName || user?.name || "");
    setGuestEmail(user?.email || "");
    setGuestPhone(user?.mobile || user?.phone || "");
  }, [user]);

  // Pre-fill guest details from logged-in user each time the booking modal opens
  useEffect(() => {
    if (bookingModalVisible && user) {
      setGuestName(user?.userName || user?.name || "");
      setGuestEmail(user?.email || "");
      setGuestPhone(user?.mobile || user?.phone || "");
    }
  }, [bookingModalVisible]);

  const getRoomId = useCallback((room) =>
    room?.id ?? room?._id ?? room?.roomId ?? room?.roomID ?? room?.hotelRoomId ?? room?.typeId ??
    room?.roomTypeID ?? room?.room_type_id ?? room?.roomTypeId ?? room?.roomType?._id ?? room?.roomType?.id ?? null, []);

  const getRoomAvailabilityMeta = useCallback((room) => {
    const candidates = [room?.inventory?.available, room?.inventory?.availableCount, room?.inventory?.roomsLeft, room?.inventory?.availableRooms, room?.availableRooms, room?.roomsLeft, room?.remainingRooms, room?.available, room?.availability?.available, room?.availabilityCount];
    const rawAvailable = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== "");
    const hasExplicitAvailable = rawAvailable !== undefined;
    const availableCount = hasExplicitAvailable ? parseNumber(rawAvailable) : 0;
    const soldOutFlag = normalizeBool(room?.inventory?.isSoldOut) ?? normalizeBool(room?.isSoldOut) ?? normalizeBool(room?.soldOut);
    const statusText = String(room?.inventory?.status || room?.status || room?.availabilityStatus || "").trim().toLowerCase();
    const statusSaysSoldOut = statusText.includes("sold") || statusText.includes("unavailable") || statusText.includes("full");
    const soldOut = hasExplicitAvailable ? availableCount <= 0 : soldOutFlag !== null ? soldOutFlag : statusSaysSoldOut;
    return { soldOut, availableCount, hasExplicitAvailable };
  }, []);

  const isRoomSoldOut = useCallback((room) => getRoomAvailabilityMeta(room).soldOut, [getRoomAvailabilityMeta]);

  const pickMonthlyOverride = useCallback((data, roomId, inDate, outDate) => {
    if (!Array.isArray(data) || !roomId) return null;
    const relevant = data.filter((e) => { const id = e?.roomId ?? e?._id ?? e?.id; return id && String(id) === String(roomId); });
    if (!relevant.length) return null;
    const bS = toDateOnly(new Date(inDate)), bE = toDateOnly(new Date(outDate));
    return relevant.find((e) => { if (!e?.startDate || !e?.endDate) return true; return dateRangesOverlap(bS, bE, e.startDate, e.endDate); }) || null;
  }, []);

  const getRoomBasePrice = useCallback((room) => {
    const pricing = room?.pricing || {};
    const direct = parseNumber(pricing.basePrice) || parseNumber(pricing.price) || parseNumber(room?.price);
    if (direct > 0) return direct;
    const fp = parseNumber(pricing.finalPrice) || parseNumber(room?.finalPrice);
    const tp = parseNumber(pricing.taxPercent || pricing.gstPercent || room?.taxPercent || room?.gstPercent);
    const ta = parseNumber(pricing.taxAmount || room?.taxAmount);
    if (fp > 0 && tp > 0) return fp / (1 + tp / 100);
    if (fp > 0 && ta > 0 && fp > ta) return fp - ta;
    return fp > 0 ? fp : 0;
  }, []);

  const nights = useMemo(() => {
    const diff = Math.ceil((toDateOnly(checkOutDate).getTime() - toDateOnly(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  const mustPayOnline = roomsCount > 3 || nights > 3;

  useEffect(() => {
    if (mustPayOnline) {
      setPaymentMode((prev) => prev === "offline" ? "online_partial" : prev);
    } else {
      setPaymentMode((prev) => (prev === "online_full" || prev === "online_partial") ? "offline" : prev);
    }
  }, [mustPayOnline]);

  const basicInfo = hotel?.basicInfo || {};
  const pricingOverview = hotel?.pricingOverview || {};
  const rawPolicies = hotel?.policies ?? basicInfo?.policies ?? hotel?.policy ?? basicInfo?.policy ?? null;

  const policies = useMemo(() => {
    const merge = (a, b) => {
      if (b === undefined || b === null || b === "") return a;
      if (a === undefined || a === null || a === "") return b;
      const aArr = Array.isArray(a), bArr = Array.isArray(b);
      if (aArr || bArr) return [...(aArr ? a : [a]), ...(bArr ? b : [b])].filter(x => x !== undefined && x !== null && x !== "");
      const aObj = typeof a === "object" && !Array.isArray(a), bObj = typeof b === "object" && !Array.isArray(b);
      if (aObj && bObj) { const m = { ...a }; Object.entries(b).forEach(([k, v]) => { m[k] = merge(m[k], v); }); return m; }
      const at = String(a).trim(), bt = String(b).trim();
      if (!at) return b; if (!bt) return a; if (at === bt) return a;
      return `${at}\n${bt}`;
    };
    const norm = (src) => {
      if (Array.isArray(src)) return src.reduce((m, e) => { if (!e || typeof e !== "object" || Array.isArray(e)) return m; Object.entries(e).forEach(([k, v]) => { m[k] = merge(m[k], v); }); return m; }, {});
      if (src && typeof src === "object") return src;
      return {};
    };
    return norm(rawPolicies);
  }, [rawPolicies]);

  const gstConfig = hotel?.gstConfig || null;
  const amenities = hotel?.amenities || [];
  const foods = useMemo(() => extractFoods(hotel), [hotel]);
  const selectedFoodTotal = useMemo(
    () => selectedFood.reduce((sum, item) => sum + parseNumber(item?.price) * parseNumber(item?.quantity || 1), 0),
    [selectedFood]
  );
  const monthlyDataSource = useMemo(() => {
    if (Array.isArray(monthlyData) && monthlyData.length) return monthlyData;
    if (Array.isArray(hotel?.monthlyData) && hotel.monthlyData.length) return hotel.monthlyData;
    if (Array.isArray(hotel?.monthlyPrices) && hotel.monthlyPrices.length) return hotel.monthlyPrices;
    if (Array.isArray(hotel?.monthlyRoomPrices) && hotel.monthlyRoomPrices.length) return hotel.monthlyRoomPrices;
    if (Array.isArray(hotel?.monthlyPricing) && hotel.monthlyPricing.length) return hotel.monthlyPricing;
    return [];
  }, [monthlyData, hotel]);

  const formatPolicyValue = useCallback((key, value) => {
    const toLabel = (k) => String(k || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    const ser = (ck, cv, d = 0) => {
      if (d > 3 || cv === undefined || cv === null || cv === "") return null;
      if (typeof cv === "boolean") { const l = String(ck).toLowerCase(); if (l.includes("required")) return cv ? "Required" : "Not required"; if (l.includes("allowed")) return cv ? "Allowed" : "Not allowed"; return cv ? "Yes" : "No"; }
      if (Array.isArray(cv)) { const p = cv.map(i => ser(ck, i, d + 1)).filter(Boolean); return p.length ? p.join("\n") : null; }
      if (typeof cv === "object") { const lines = Object.entries(cv).filter(([k]) => !POLICY_EXCLUDED_KEYS.has(k)).map(([k, v]) => { const fv = ser(k, v, d + 1); return fv ? `${toLabel(k)}: ${fv}` : null; }).filter(Boolean); return lines.length ? lines.join("\n") : null; }
      const n = String(cv).trim(); return n ? n : null;
    };
    return ser(key, value);
  }, []);

  const policyItems = useMemo(() => {
    const restrictions = policies?.restrictions && typeof policies.restrictions === "object" ? policies.restrictions : {};
    const rSrc = { ...policies, ...restrictions };
    const used = new Set();
    const getV = (keys = [], src = policies) => { for (const k of keys) { const v = formatPolicyValue(k, src?.[k]); if (v) { used.add(k); return v; } } return null; };
    const toLabel = (k) => String(k).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const mk = ({ key, label, icon, value }) => !value ? null : { key, label, icon, value, previewEligible: !value.includes("\n") && value.length <= 80 };
    const candidates = [
      { key: "checkIn", keys: ["checkIn", "checkInPolicy"], label: "Check-in", icon: "log-in-outline" },
      { key: "checkOut", keys: ["checkOut", "checkOutPolicy"], label: "Check-out", icon: "log-out-outline" },
      { key: "outsideFood", keys: ["outsideFoodPolicy"], label: "Outside Food", icon: "restaurant-outline" },
      { key: "paymentMode", keys: ["paymentMode"], label: "Payment", icon: "card-outline" },
      { key: "unmarriedCouplesAllowed", keys: ["unmarriedCouplesAllowed"], label: "Unmarried Couples", icon: "heart-outline" },
      { key: "bachelorAllowed", keys: ["bachelorAllowed"], label: "Bachelors", icon: "people-outline" },
      { key: "internationalGuestAllowed", keys: ["internationalGuestAllowed"], label: "Intl. Guests", icon: "globe-outline" },
      { key: "petsAllowed", keys: ["petsAllowed"], label: "Pets", icon: "paw-outline", source: rSrc },
      { key: "smokingAllowed", keys: ["smokingAllowed"], label: "Smoking", icon: "flame-outline", source: rSrc },
      { key: "alcoholAllowed", keys: ["alcoholAllowed"], label: "Alcohol", icon: "wine-outline", source: rSrc },
      { key: "idProofRequired", keys: ["idProofRequired"], label: "ID Proof", icon: "card-outline" },
      { key: "childPolicy", keys: ["childPolicy"], label: "Children", icon: "happy-outline" },
      { key: "extraBed", keys: ["extraBed"], label: "Extra Bed", icon: "bed-outline" },
      { key: "cancellation", keys: ["cancellationText", "cancellationPolicy"], label: "Cancellation", icon: "calendar-outline" },
      { key: "refund", keys: ["refundPolicy"], label: "Refund", icon: "cash-outline" },
    ];
    const base = candidates.map(i => mk({ key: i.key, label: i.label, icon: i.icon, value: getV(i.keys, i.source || policies) })).filter(Boolean);
    const rules = Array.isArray(policies?.rules) ? policies.rules : [];
    if (rules.length) base.push({ key: "rules", label: "House Rules", icon: "list-outline", value: rules.join(" | "), previewEligible: false });
    Object.entries(policies || {}).forEach(([k, v]) => {
      if (used.has(k) || POLICY_EXCLUDED_KEYS.has(k) || k === "restrictions" || k === "rules") return;
      const fv = formatPolicyValue(k, v); if (!fv) return;
      base.push(mk({ key: k, label: toLabel(k), icon: "document-text-outline", value: fv }));
    });
    return base;
  }, [policies, formatPolicyValue]);

  const checkInPolicyValue = useMemo(() => formatPolicyValue("checkIn", policies?.checkIn || policies?.checkInPolicy), [policies, formatPolicyValue]);
  const checkOutPolicyValue = useMemo(() => formatPolicyValue("checkOut", policies?.checkOut || policies?.checkOutPolicy), [policies, formatPolicyValue]);
  const checkInChipText = useMemo(() => { const v = String(checkInPolicyValue || "").trim(); if (!v) return null; const l = v.toLowerCase(); if (l.includes("check in") || l.includes("check-in")) return v; return `Check-in ${v}`; }, [checkInPolicyValue]);
  const checkOutChipText = useMemo(() => { const v = String(checkOutPolicyValue || "").trim(); if (!v) return null; const l = v.toLowerCase(); if (l.includes("check out") || l.includes("check-out")) return v; return `Check-out ${v}`; }, [checkOutPolicyValue]);

  const galleryImages = useMemo(() => toList(basicInfo?.images).filter(Boolean), [basicInfo?.images]);
  const mainImage = galleryImages[0];
  const otherImages = galleryImages.slice(1, 9);
  const screenWidth = Dimensions.get("window").width;

  const openGalleryAt = useCallback((i) => { if (!galleryImages.length) return; setGalleryIndex(clamp(i, 0, galleryImages.length - 1)); setGalleryModalVisible(true); }, [galleryImages]);
  const goToGalleryIndex = useCallback((i, animated = true) => { if (!galleryImages.length) return; const si = clamp(i, 0, galleryImages.length - 1); setGalleryIndex(si); galleryScrollRef.current?.scrollTo({ x: si * screenWidth, y: 0, animated }); }, [galleryImages.length, screenWidth]);

  useEffect(() => { if (!galleryModalVisible) return; const id = requestAnimationFrame(() => { galleryScrollRef.current?.scrollTo({ x: galleryIndex * screenWidth, y: 0, animated: false }); }); return () => cancelAnimationFrame(id); }, [galleryModalVisible, galleryIndex, screenWidth]);

  const roomsWithPricing = useMemo(() => {
    const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
    return rooms.map((room) => {
      const roomId = getRoomId(room);
      const mo = pickMonthlyOverride(monthlyDataSource, roomId, checkInDate, checkOutDate);
      const base = getRoomBasePrice(room);
      const offerActive = isRoomOfferActive(room);
      const offerFP = resolveRoomFinalPrice(room);
      const offerOP = resolveRoomOriginalPrice(room);
      const effBase = offerFP > 0 ? offerFP : base;
      const effOrig = offerOP > 0 ? offerOP : Math.max(base, effBase, 0);
      const offerDisc = offerActive ? Math.max(parseNumber(room?.offerPriceLess), Math.max(effOrig - effBase, 0)) : 0;
      const offerLabel = String(room?.offerName || room?.features?.offerText || room?.features?.offerName || "Offer").trim();
      const overridePrice = parseNumber(mo?.monthPrice);
      const nightlyPrice = overridePrice > 0 ? overridePrice : effBase;
      const isOverride = overridePrice > 0;
      const showOffer = !isOverride && offerActive && effOrig > nightlyPrice && offerDisc > 0;
      return { ...room, __pricing: { basePrice: base, effectiveBasePrice: effBase, originalPrice: effOrig, nightlyPrice, monthlyOverride: mo, isOverrideApplied: isOverride, offerActive, offerDiscount: offerDisc, offerLabel, showOfferPricing: showOffer } };
    });
  }, [hotel, monthlyDataSource, checkInDate, checkOutDate, getRoomId, getRoomBasePrice, pickMonthlyOverride]);

  useEffect(() => {
    if (!roomsWithPricing.length) return;
    const avail = roomsWithPricing.find((r) => !isRoomSoldOut(r) && getRoomId(r));
    if (!selectedRoomId || !roomsWithPricing.some((r) => String(getRoomId(r)) === String(selectedRoomId) && !isRoomSoldOut(r))) {
      if (avail) setSelectedRoomId(getRoomId(avail));
    }
  }, [roomsWithPricing, selectedRoomId, getRoomId, isRoomSoldOut]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const rk = `${String(hotelId || "")}:${String(selectedRoomId)}`;
    if (couponRoomKeyRef.current && couponRoomKeyRef.current !== rk) { dispatch(resetCoupon()); setCouponCodeInput(""); }
    couponRoomKeyRef.current = rk;
  }, [dispatch, hotelId, selectedRoomId]);

  const selectedRoomData = useMemo(() => roomsWithPricing.find((r) => String(getRoomId(r)) === String(selectedRoomId)), [roomsWithPricing, selectedRoomId, getRoomId]);
  const currencySymbol = pricingOverview?.currencySymbol || selectedRoomData?.pricing?.currencySymbol || selectedRoomData?.pricing?.currency || "₹";

  const pricing = useMemo(() => {
    if (!selectedRoomData) return { base: 0, tax: 0, foodTotal: 0, total: 0, discount: 0, finalTotal: 0, couponApplied: false, perNight: 0, appliedTaxPercent: 0, taxLabel: "" };
    const pn = selectedRoomData.__pricing?.nightlyPrice ?? getRoomBasePrice(selectedRoomData);
    const bt = pn * roomsCount * nights;
    const rtp = parseNumber(selectedRoomData?.pricing?.taxPercent || selectedRoomData?.pricing?.gstPercent);
    const rta = parseNumber(selectedRoomData?.pricing?.taxAmount);
    const isMO = !!selectedRoomData?.__pricing?.isOverrideApplied;
    let gt = 0, atp = 0, tl = "";
    if (isMO) { atp = 12; gt = (bt * atp) / 100; tl = "GST (12%)"; }
    else if (rtp > 0) { atp = rtp; gt = (bt * atp) / 100; tl = `GST (${atp}%)`; }
    else if (rta > 0) { gt = rta * roomsCount * nights; tl = "Taxes"; }
    else if (gstConfig?.enabled && parseNumber(gstConfig?.rate) >= 0) { atp = parseNumber(gstConfig.rate); gt = (bt * atp) / 100; tl = `GST (${atp}%)`; }
    else if (gstData?.gstPrice) { atp = parseNumber(gstData.gstPrice); gt = (bt * atp) / 100; tl = `GST (${atp}%)`; }
    else { const minThresh = parseNumber(gstData?.gstMinThreshold) || 1000; const maxThresh = parseNumber(gstData?.gstMaxThreshold) || 7500; if (pn > maxThresh) atp = 18; else if (pn > minThresh) atp = parseNumber(gstData?.gstPrice) || 12; else atp = 0; gt = (bt * atp) / 100; tl = atp ? `GST (${atp}%)` : "No GST"; }
    const rd = parseNumber(discountAmount || couponResult?.discountPrice || couponResult?.discountAmount);
    const discountedRoomGross = Math.max(bt + gt - Math.min(Math.max(rd, 0), Math.max(bt + gt, 0)), 0);
    const foodTotal = selectedFoodTotal;
    const finalTotal = discountedRoomGross + foodTotal;
    return {
      base: bt,
      tax: gt,
      foodTotal,
      total: bt + gt + foodTotal,
      discount: Math.min(Math.max(rd, 0), Math.max(bt + gt, 0)),
      finalTotal,
      couponApplied: rd > 0,
      perNight: pn,
      appliedTaxPercent: atp,
      taxLabel: tl,
    };
  }, [selectedRoomData, roomsCount, nights, getRoomBasePrice, gstData, gstConfig, discountAmount, couponResult, selectedFoodTotal]);

  const getRoomOfferDisplayDiscount = useCallback((room, np) => { const ed = parseNumber(room?.__pricing?.offerDiscount); if (ed > 0) return ed; return Math.max(parseNumber(room?.__pricing?.originalPrice) - parseNumber(np), 0); }, []);

  useEffect(() => {
    if (!pricing?.perNight) return;
    if (lastGstQueryRef.current === pricing.perNight && gstData) return;
    lastGstQueryRef.current = pricing.perNight;
    dispatch(getGstForHotelData({ type: "Hotel", gstThreshold: pricing.perNight }));
  }, [dispatch, pricing?.perNight, gstData]);

  const navigateToHomeScreen = useCallback(() => {
    const p = navigation?.getParent?.();
    if (p?.navigate) { p.navigate("Search", { screen: "Home" }); return; }
    navigation?.navigate?.("MainTabs", { screen: "Search", params: { screen: "Home" } });
  }, [navigation]);

  useEffect(() => {
    if (bookingStatus === "succeeded") {
      setBookingModalVisible(false);
      dispatch(resetBookingState());
      const isActuallyPending = createdBookingStatus === "Pending";
      if (isActuallyPending) {
        const reason = createdBookingPendingReason || "Awaiting manual confirmation";
        showSuccess(
          "Booking Submitted (Pending)",
          `Your booking is pending review.\n\nReason: ${reason}\n\nWe will notify you once confirmed. If not confirmed within 2 hours, it will be auto-cancelled.`,
          { onPrimary: navigateToHomeScreen }
        );
      } else {
        showSuccess(
          paymentMode !== "offline" ? "Booking Submitted" : "Booking Confirmed",
          paymentMode !== "offline" ? "Your booking is pending payment. Please complete payment to confirm." : "Your booking is confirmed!",
          { onPrimary: navigateToHomeScreen }
        );
      }
    }
    if (bookingStatus === "failed") { showError("Booking Failed", String(bookingError?.message || bookingError || "Something went wrong.")); dispatch(resetBookingState()); }
  }, [bookingStatus, bookingError, createdBookingStatus, createdBookingPendingReason, dispatch, navigateToHomeScreen, showError, showSuccess]);

  const openCheckIn = () => { setDateModalTarget("in"); setCalendarBase(new Date(checkInDate)); setShowDateModal(true); };
  const openCheckOut = () => { setDateModalTarget("out"); setCalendarBase(new Date(checkOutDate)); setShowDateModal(true); };

  const applySelectedDate = (sel) => {
    const picked = toDateOnly(new Date(sel));
    if (dateModalTarget === "in") { setCheckInDate(picked); if (toDateOnly(checkOutDate).getTime() <= picked.getTime()) setCheckOutDate(new Date(picked.getTime() + 86400000)); }
    else { const inD = toDateOnly(checkInDate).getTime(); if (picked.getTime() <= inD) setCheckOutDate(new Date(inD + 86400000)); else setCheckOutDate(picked); }
    setShowDateModal(false);
  };

  const handleBookNow = () => { if (!selectedRoomId) return; setBookingModalVisible(true); };
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

  const handleGuestsCountChange = useCallback((ng) => {
    const n = clamp(ng, 1, MAX_GUESTS); const rr = clamp(getRequiredRoomsForGuests(n), 1, MAX_ROOMS);
    setGuestsCount(n); setRoomsCount(rr);
  }, []);
  const handleRoomsCountChange = useCallback((nr) => {
    const n = clamp(nr, 1, MAX_ROOMS); const mg = n * MAX_GUESTS_PER_ROOM;
    setRoomsCount(n); setGuestsCount((pg) => clamp(Math.min(pg, mg), 1, MAX_GUESTS));
  }, []);

  const handleCouponInputChange = (v) => { const n = String(v || "").trimStart().toUpperCase(); setCouponCodeInput(n); if (couponStatus !== "idle" || appliedCoupon || discountAmount > 0) dispatch(resetCoupon()); };
  const handleApplyCoupon = async () => {
    const code = String(couponCodeInput || "").trim().toUpperCase(); if (!code || !hotelId || !selectedRoomId) return;
    const userId = await getUserId(); if (!userId) return;
    try { await dispatch(applyCouponCode({ couponCode: code, hotelIds: [String(hotelId)], roomIds: [String(selectedRoomId)], userIds: [String(userId)] })).unwrap(); setCouponCodeInput(code); } catch { }
  };
  const handleClearCoupon = () => { dispatch(resetCoupon()); setCouponCodeInput(""); };

  const upsertFood = useCallback((foodItem, quantity) => {
    const normalizedQty = Math.max(0, Number(quantity) || 0);
    const normalizedFood = {
      foodId: String(foodItem?.id || foodItem?.foodId || foodItem?._id || ""),
      name: String(foodItem?.name || "Food Item"),
      price: parseNumber(foodItem?.price),
      quantity: normalizedQty,
      type: String(foodItem?.type || foodItem?.foodType || ""),
    };
    setSelectedFood((current) => {
      const next = current.filter((item) => String(item.foodId || item.id || "") !== normalizedFood.foodId);
      if (normalizedQty <= 0) return next;
      return [...next, normalizedFood];
    });
  }, []);

  const getFoodQuantity = useCallback((foodId) => {
    const match = selectedFood.find((item) => String(item.foodId || item.id || "") === String(foodId));
    return Number(match?.quantity) || 0;
  }, [selectedFood]);

  const submitBooking = async () => {
    const name = String(guestName || "").trim(), phone = String(guestPhone || "").trim(), email = String(guestEmail || "").trim();
    if (!name || !phone || !email) { showError("Missing Details", "Please fill all guest details."); return; }
    if (!validateEmail(email)) { showError("Invalid Email", "Please enter a valid email address."); return; }
    if (!selectedRoomId) { showError("Select Room", "Please select a room first."); return; }
    if (guestsCount > roomsCount * MAX_GUESTS_PER_ROOM) { showError("Guest Limit Exceeded", `Only ${MAX_GUESTS_PER_ROOM} guests are allowed per room.`); return; }
    const userId = await getUserId(); if (!userId) { showError("Login Required", "Please login to continue booking."); return; }
    const sp = parseNumber(selectedRoomData?.__pricing?.nightlyPrice ?? getRoomBasePrice(selectedRoomData));
    dispatch(createBooking({
      userId: String(userId),
      hotelId: String(hotelId),
      checkInDate: toDateOnly(checkInDate).toISOString(),
      checkOutDate: toDateOnly(checkOutDate).toISOString(),
      guests: guestsCount,
      numRooms: roomsCount,
      guestDetails: [{ fullName: name, mobile: phone, email }],
      foodDetails: selectedFood.map((food) => ({
        foodId: String(food.foodId || ""),
        name: String(food.name || "Food Item"),
        price: parseNumber(food.price),
        quantity: Number(food.quantity) || 1,
        type: String(food.type || ""),
      })),
      roomDetails: [{ roomId: String(selectedRoomId), type: String(selectedRoomData?.name || selectedRoomData?.type || "Room"), bedTypes: String(selectedRoomData?.bedTypes || selectedRoomData?.bedType || ""), price: sp }],
      pm: paymentMode === "offline" ? "offline" : "online",
      bookingSource: "app",
      bookingStatus: paymentMode !== "offline" ? "Pending" : "Confirmed",
      ...(paymentMode === "online_partial" ? { advancePercent: 25 } : {}),
      couponCode: appliedCoupon || undefined,
      discountPrice: pricing.discount || 0,
      hotelDetails: {
        hotelName: basicInfo?.name || hotel?.hotelName || "",
        hotelEmail: basicInfo?.email || hotel?.email || hotel?.hotelEmail || "",
        hotelCity: basicInfo?.location?.city || hotel?.hotelCity || "",
        hotelOwnerName: basicInfo?.ownerName || hotel?.hotelOwnerName || hotel?.createdBy?.user || "",
        destination: basicInfo?.location?.city || basicInfo?.location?.state || hotel?.destination || ""
      }
    }));
  };

  const handleGoBack = () => { if (navigation?.canGoBack?.()) navigation.goBack(); else navigateToHomeScreen(); };
  const handleShareHotel = useCallback(async () => {
    const name = String(basicInfo?.name || "Hotel Details").trim();
    const addr = [basicInfo?.location?.address, basicInfo?.location?.city, basicInfo?.location?.state].filter(Boolean).join(", ");
    try { await Share.share({ title: name, message: [name, addr, mainImage].filter(Boolean).join("\n") }); } catch { }
  }, [basicInfo, mainImage]);
  const handleViewAllPolicies = useCallback(() => { navigation?.navigate?.("PolicyScreen", { hotelName: basicInfo?.name || hotel?.hotelName || "Hotel", policyItems }); }, [navigation, basicInfo?.name, hotel?.hotelName, policyItems]);

  const sbPad = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const heroTop = sbPad + (Platform.OS === "android" ? 10 : 44);

  const safeAmenities = useMemo(() => { if (!amenities) return []; if (Array.isArray(amenities)) return amenities.flat?.() ? amenities.flat() : amenities; return []; }, [amenities]);
  const amenitiesToShow = useMemo(() => showAllAmenities ? safeAmenities : safeAmenities.slice(0, 8), [safeAmenities, showAllAmenities]);
  const amenityRows = useMemo(() => { const rows = []; for (let i = 0; i < amenitiesToShow.length; i += 2) rows.push(amenitiesToShow.slice(i, i + 2)); return rows; }, [amenitiesToShow]);
  const previewPolicies = useMemo(() => { const c = policyItems.filter(i => i?.previewEligible); return c.length >= PREVIEW_POLICY_COUNT ? c.slice(0, PREVIEW_POLICY_COUNT) : policyItems.slice(0, PREVIEW_POLICY_COUNT); }, [policyItems]);

  if (loading) return <HotelDetailsSkeleton />;
  if (error || !hotel) return (
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
      <Ionicons name="alert-circle-outline" size={56} color={C.red} />
      <Text style={{ fontSize: 18, fontWeight: "800", color: C.text1, marginTop: 16, marginBottom: 8 }}>Unable to load details</Text>
      <TouchableOpacity onPress={handleGoBack} style={{ backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
        <Text style={{ color: C.white, fontWeight: "700", fontSize: 14 }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <View style={{ height: 300 }}>
          {mainImage ? (
            <TouchableOpacity activeOpacity={0.95} onPress={() => openGalleryAt(0)} style={{ flex: 1 }}>
              <Image source={{ uri: mainImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1, backgroundColor: C.slate2, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={40} color={C.slate4} />
            </View>
          )}

          {/* Gradient overlay */}
          <View style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
            background: "linear-gradient(transparent,rgba(10,15,30,0.85))"
          }} />

          {/* Top actions */}
          <View style={{ position: "absolute", left: 0, right: 0, top: heroTop, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, zIndex: 20 }}>
            <TouchableOpacity onPress={handleGoBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareHotel} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
              <Ionicons name="share-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Thumbnail strip */}
          {!!otherImages.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ position: "absolute", bottom: 12, left: 0, right: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {otherImages.map((img, i) => (
                <TouchableOpacity key={`${img}-${i}`} activeOpacity={0.85} onPress={() => openGalleryAt(i + 1)}>
                  <Image source={{ uri: img }} style={{ width: 54, height: 54, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── CONTENT SHEET ───────────────────────────────────────── */}
        <View style={{ backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}>

          {/* Hotel Identity */}
          <View style={[s.card, { marginBottom: 12 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: C.text1, letterSpacing: -0.5, lineHeight: 28 }}>{basicInfo?.name || "Hotel"}</Text>
                {!!basicInfo?.location && (
                  <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 6 }}>
                    <Ionicons name="location-sharp" size={13} color={C.slate4} style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 12, color: C.slate5, marginLeft: 4, flex: 1, lineHeight: 17 }}>
                      {[basicInfo?.location?.address, basicInfo?.location?.city, basicInfo?.location?.state].filter(Boolean).join(", ")}
                      {basicInfo?.location?.pinCode ? ` — ${basicInfo.location.pinCode}` : ""}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ backgroundColor: C.navy, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={11} color={C.gold} />
                <Text style={{ color: C.white, fontWeight: "800", fontSize: 12 }}>{basicInfo?.starRating || 0}</Text>
              </View>
            </View>

            {/* Check-in / Check-out chips */}
            {(!!checkInChipText || !!checkOutChipText) && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {!!checkInChipText && (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.slate1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, gap: 5 }}>
                    <Ionicons name="enter-outline" size={13} color={C.gold} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.text2, flex: 1 }} numberOfLines={1}>{checkInChipText}</Text>
                  </View>
                )}
                {!!checkOutChipText && (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.slate1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, gap: 5 }}>
                    <Ionicons name="exit-outline" size={13} color={C.gold} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.text2, flex: 1 }} numberOfLines={1}>{checkOutChipText}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Starting from */}
            {!!pricingOverview?.lowestBasePrice && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 }}>
                <Text style={{ fontSize: 11, color: C.slate4, fontWeight: "600" }}>Starts from</Text>
                <Text style={{ fontSize: 14, color: C.navy, fontWeight: "800" }}>{currencySymbol}{parseNumber(pricingOverview.lowestBasePrice).toLocaleString()}</Text>
                <Text style={{ fontSize: 11, color: C.slate4, fontWeight: "600" }}>/night</Text>
              </View>
            )}
          </View>

          {/* ── FULLY BOOKED BANNER ───────────────────────────────── */}
          {!!hotel?.availability?.isFullyBooked && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.redBg, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, gap: 8 }}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: C.red }}>Fully Booked</Text>
                <Text style={{ fontSize: 11, color: "#991B1B", marginTop: 1 }}>No rooms available for selected dates</Text>
              </View>
            </View>
          )}

          {/* About */}
          {!!basicInfo?.description && (
            <View style={[s.card, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: C.slate4, textTransform: "uppercase", marginBottom: 8 }}>About</Text>
              <Text style={{ fontSize: 13, color: C.text2, lineHeight: 20 }}>{basicInfo.description}</Text>
            </View>
          )}

          {/* ── WELCOME NOTE ──────────────────────────────────────── */}
          {!!hotel?.customerWelcomeNote && (
            <View style={[s.card, { marginBottom: 12, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: C.goldLight }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="heart-outline" size={14} color={C.gold} />
                <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: C.gold, textTransform: "uppercase" }}>Welcome Note</Text>
              </View>
              <Text style={{ fontSize: 13, color: C.text2, lineHeight: 20, fontStyle: "italic" }}>"{hotel.customerWelcomeNote}"</Text>
            </View>
          )}

          {/* ── RATINGS & REVIEWS ─────────────────────────────────── */}
          {(!!hotel?.rating || !!hotel?.reviewCount) && (
            <View style={{ marginBottom: 12 }}>
              <SectionLabel title="Ratings & Reviews" />
              <View style={s.card}>

                {/* Score + count row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 40, fontWeight: "900", color: C.navy, lineHeight: 44 }}>{parseNumber(hotel.rating).toFixed(1)}</Text>
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                      {[1,2,3,4,5].map(i => (
                        <Ionicons key={i} name={i <= Math.round(hotel.rating) ? "star" : "star-outline"} size={11} color={C.gold} />
                      ))}
                    </View>
                    {!!hotel.reviewCount && (
                      <Text style={{ fontSize: 10, color: C.slate4, marginTop: 2 }}>{hotel.reviewCount} reviews</Text>
                    )}
                  </View>

                  {/* Breakdown bars */}
                  {!!hotel?.ratingBreakdown && (
                    <View style={{ flex: 1, gap: 5 }}>
                      {Object.entries(hotel.ratingBreakdown).map(([key, val]) => {
                        const label = key === "valueForMoney" ? "Value" : key.charAt(0).toUpperCase() + key.slice(1);
                        const pct = Math.min((parseNumber(val) / 5) * 100, 100);
                        return (
                          <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 10, color: C.slate5, width: 68 }} numberOfLines={1}>{label}</Text>
                            <View style={{ flex: 1, height: 5, backgroundColor: C.slate2, borderRadius: 3, overflow: "hidden" }}>
                              <View style={{ width: `${pct}%`, height: 5, backgroundColor: C.gold, borderRadius: 3 }} />
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: C.text2, width: 24, textAlign: "right" }}>{parseNumber(val).toFixed(1)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Star distribution */}
                {!!hotel?.ratingDistribution && (
                  <View style={{ borderTopWidth: 1, borderTopColor: C.slate2, paddingTop: 10, gap: 4 }}>
                    {[["fiveStar",5],["fourStar",4],["threeStar",3],["twoStar",2],["oneStar",1]].map(([key, stars]) => {
                      const cnt = parseNumber(hotel.ratingDistribution[key]);
                      const total = Object.values(hotel.ratingDistribution).reduce((s,v) => s + parseNumber(v), 0);
                      const pct = total > 0 ? (cnt / total) * 100 : 0;
                      return (
                        <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 1, width: 62 }}>
                            {[1,2,3,4,5].slice(0, stars).map(i => (
                              <Ionicons key={i} name="star" size={9} color={C.gold} />
                            ))}
                          </View>
                          <View style={{ flex: 1, height: 5, backgroundColor: C.slate2, borderRadius: 3, overflow: "hidden" }}>
                            <View style={{ width: `${pct}%`, height: 5, backgroundColor: "#FCD34D", borderRadius: 3 }} />
                          </View>
                          <Text style={{ fontSize: 10, color: C.slate4, width: 20, textAlign: "right" }}>{cnt}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

        

          {/* ── AMENITIES ─────────────────────────────────────────── */}
          {!!safeAmenities.length && (
            <View style={{ marginBottom: 12 }}>
              <SectionLabel title="Amenities" action={safeAmenities.length > 8 ? () => setShowAllAmenities(v => !v) : null} actionLabel={showAllAmenities ? "Show less" : "View all"} />
              <View style={[s.card, { gap: 8 }]}>
                {amenityRows.map((row, ri) => (
                  <View key={`ar-${ri}`} style={{ flexDirection: "row", gap: 8 }}>
                    {row.map((item, ci) => {
                      const raw = typeof item === "string" ? item : item?.name || item?.title || item?.label || String(item);
                      return <AmenityPill key={`${raw}-${ri}-${ci}`} icon={getAmenityIconName(raw)} label={getAmenityDisplayName(raw)} />;
                    })}
                    {row.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── ROOMS ─────────────────────────────────────────────── */}
          <View style={{ marginBottom: 12 }}>
            <SectionLabel
              title="Select Room"
              action={null}
            />
            {!!selectedRoomData && (
              <View style={[s.priceTag, { marginBottom: 10, alignSelf: "flex-start" }]}>
                <Ionicons name="pricetag-outline" size={11} color={C.gold} />
                <Text style={{ fontSize: 11, fontWeight: "800", color: C.white }}>{currencySymbol}{Math.round(pricing.perNight).toLocaleString()} / night</Text>
              </View>
            )}

            {roomsWithPricing.map((room, idx) => {
              const roomId = getRoomId(room);
              const isSel = String(selectedRoomId) === String(roomId);
              const avMeta = getRoomAvailabilityMeta(room);
              const soldOut = avMeta.soldOut;
              const np = room.__pricing?.nightlyPrice ?? getRoomBasePrice(room);
              const taxPct = parseNumber(room?.pricing?.taxPercent || room?.pricing?.gstPercent) ||
                (room?.__pricing?.isOverrideApplied ? 12 : pricing.appliedTaxPercent || 12);
              const avText = soldOut ? "Sold Out" : avMeta.hasExplicitAvailable ? `${avMeta.availableCount} left` : "Available";

              return (
                <TouchableOpacity
                  key={roomId ?? room?.name ?? idx}
                  activeOpacity={0.88}
                  onPress={() => { if (soldOut || !roomId) return; setSelectedRoomId(roomId); }}
                  style={[s.roomCard, isSel && s.roomCardSel, soldOut && { opacity: 0.55 }]}
                >
                  {/* Selection indicator line */}
                  {isSel && <View style={{ height: 3, backgroundColor: C.navy, borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />}

                  <View style={{ flexDirection: "row", padding: 12, gap: 10 }}>
                    {/* Room image */}
                    {room?.images?.[0] ? (
                      <Image source={{ uri: room.images[0] }} style={{ width: 88, height: 88, borderRadius: 12 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="bed-outline" size={24} color={C.slate3} />
                      </View>
                    )}

                    {/* Details */}
                    <View style={{ flex: 1, justifyContent: "space-between", minWidth: 0 }}>
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: C.text1, flex: 1, paddingRight: 6 }}>{room?.name || "Room"}</Text>
                          {isSel && !soldOut && (
                            <View style={{ backgroundColor: C.navy, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Ionicons name="checkmark" size={10} color={C.white} />
                              <Text style={{ color: C.white, fontSize: 9, fontWeight: "800" }}>Picked</Text>
                            </View>
                          )}
                        </View>
                        {!!room?.bedType && <Text numberOfLines={1} style={{ fontSize: 11, color: C.text3, fontWeight: "600", marginBottom: 5 }}>{room.bedType}</Text>}

                        {/* Badges */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                          <Badge
                            label={avText}
                            color={soldOut ? C.red : C.green}
                            bg={soldOut ? C.redBg : C.greenBg}
                            icon={soldOut ? "alert-circle-outline" : "checkmark-circle-outline"}
                          />
                          {!!room?.__pricing?.isOverrideApplied && <Badge label="Monthly" color={C.blue} bg={C.blueBg} icon="flash-outline" />}
                          {!!room?.__pricing?.offerActive && <Badge label={room?.__pricing?.offerLabel || "Offer"} color="#9D174D" bg="#FFF0F6" icon="pricetag-outline" />}
                        </View>
                      </View>

                      {/* Price + CTA */}
                      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
                        <View>
                          <Text style={{ fontSize: 18, fontWeight: "800", color: C.text1, lineHeight: 22 }}>
                            {currencySymbol}{Math.round(np).toLocaleString()}
                          </Text>
                          {room?.__pricing?.showOfferPricing && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                              <Text style={{ fontSize: 10, color: C.slate3, fontWeight: "600", textDecorationLine: "line-through" }}>
                                {currencySymbol}{Math.round(parseNumber(room?.__pricing?.originalPrice)).toLocaleString()}
                              </Text>
                              <Text style={{ fontSize: 10, color: C.red, fontWeight: "800" }}>
                                -{currencySymbol}{Math.round(getRoomOfferDisplayDiscount(room, np)).toLocaleString()}
                              </Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 9, color: C.slate4, marginTop: 2 }}>+{taxPct}% GST</Text>
                        </View>

                        <TouchableOpacity
                          disabled={soldOut}
                          onPress={() => !soldOut && setSelectedRoomId(roomId)}
                          style={{
                            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
                            backgroundColor: soldOut ? C.slate1 : isSel ? C.navy : C.cream,
                            borderWidth: 1, borderColor: soldOut ? C.slate2 : isSel ? C.navy : C.navy
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "800", color: soldOut ? C.slate3 : isSel ? C.white : C.navy }}>
                            {soldOut ? "Unavailable" : isSel ? "Selected" : "Select"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

         

          {/* ── FOODS ─────────────────────────────────────────────── */}
          {!!foods.length && (
            <View style={{ marginBottom: 12 }}>
              <SectionLabel title="Restaurant / Menu" />
              {foods.slice(0, 24).map((food, index) => {
                const accent = getFoodAccent(food.type);
                const foodQty = getFoodQuantity(food.id);
                return (
                  <View key={`${food.id}-${index}`} style={s.roomCard}>
                    <View style={{ flexDirection: "row", padding: 12, gap: 10 }}>
                      {food?.images?.[0] ? (
                        <Image source={{ uri: food.images[0] }} style={{ width: 88, height: 88, borderRadius: 12 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="restaurant-outline" size={24} color={C.slate3} />
                        </View>
                      )}

                      <View style={{ flex: 1, justifyContent: "space-between", minWidth: 0 }}>
                        <View>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 }}>
                            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: C.text1, flex: 1, paddingRight: 6 }}>
                              {food.name}
                            </Text>
                            <View style={{ backgroundColor: accent.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Ionicons name={accent.icon} size={10} color={accent.color} />
                              <Text style={{ color: accent.color, fontSize: 9, fontWeight: "800" }}>{food.type}</Text>
                            </View>
                          </View>

                          <Text numberOfLines={2} style={{ fontSize: 11, color: C.text3, fontWeight: "600", marginBottom: 5 }}>
                            {food.description}
                          </Text>

                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                            <Badge
                              label={food.images?.length ? `${food.images.length} Photos` : "No Photos"}
                              color={C.blue}
                              bg={C.blueBg}
                              icon="images-outline"
                            />
                            <Badge
                              label={food.price > 0 ? "Priced" : "Ask Price"}
                              color={food.price > 0 ? C.green : C.gold}
                              bg={food.price > 0 ? C.greenBg : "#FFF9EC"}
                              icon={food.price > 0 ? "cash-outline" : "help-circle-outline"}
                            />
                          </View>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
                          <View>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text1, lineHeight: 22 }}>
                              {food.displayPrice}
                            </Text>
                            <Text style={{ fontSize: 9, color: C.slate4, marginTop: 2 }}>
                              Per item
                            </Text>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => upsertFood(food, Math.max(foodQty - 1, 0))}
                              disabled={foodQty <= 0}
                              style={[s.counterBtn, foodQty <= 0 && s.counterBtnDisabled]}
                            >
                              <Ionicons name="remove" size={13} color={foodQty <= 0 ? C.slate3 : C.text1} />
                            </TouchableOpacity>
                            <View style={{ minWidth: 22, alignItems: "center" }}>
                              <Text style={{ fontSize: 15, fontWeight: "800", color: foodQty > 0 ? C.navy : C.text1 }}>
                                {foodQty}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => upsertFood(food, foodQty + 1)}
                              style={s.counterBtn}
                            >
                              <Ionicons name="add" size={13} color={C.text1} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {!!selectedFood.length && (
            <View style={{ marginBottom: 12 }}>
              <SectionLabel title="Selected Food" />
              <View style={s.card}>
                {selectedFood.map((item, index) => (
                  <View key={`${item.foodId}-${index}`}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: C.text1 }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          {item.quantity} × {formatCurrencyINR(item.price)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: C.navy }}>
                        {formatCurrencyINR(parseNumber(item.price) * parseNumber(item.quantity))}
                      </Text>
                    </View>
                    {index < selectedFood.length - 1 && <GoldDivider />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── POLICIES ──────────────────────────────────────────── */}
          <View style={{ marginBottom: 12 }}>
            <SectionLabel title="Hotel Policies" />
            <View style={s.card}>
              {policyItems.length === 0 ? (
                <Text style={{ fontSize: 12, color: C.text3 }}>No policies available.</Text>
              ) : (
                previewPolicies.map((item, idx) => (
                  <View key={`${item.key}-${idx}`}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                          <Ionicons name={item.icon} size={12} color={C.slate4} />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: C.text3 }}>{item.label}</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: C.text1, textAlign: "right", flex: 1 }}>{item.value}</Text>
                    </View>
                    {idx < previewPolicies.length - 1 && <GoldDivider />}
                  </View>
                ))
              )}
              {policyItems.length > previewPolicies.length && (
                <>
                  <GoldDivider />
                  <TouchableOpacity onPress={handleViewAllPolicies} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.slate1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: C.navy }}>View all policies</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.navy} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────── */}
      <View style={s.bottomBar}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "700", color: C.text3, letterSpacing: 0.5, marginBottom: 2 }}>
              {roomsCount} room · {guestsCount} guest · {nights} night{nights > 1 ? "s" : ""}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: C.navy, letterSpacing: -0.5 }}>
              {currencySymbol}{Math.round(pricing.finalTotal).toLocaleString()}
            </Text>
            <Text style={{ fontSize: 10, color: C.slate4, marginTop: 1 }}>
              {currencySymbol}{Math.round(pricing.base).toLocaleString()} + {currencySymbol}{Math.round(pricing.tax).toLocaleString()} tax{!!pricing.foodTotal ? ` + ${currencySymbol}${Math.round(pricing.foodTotal).toLocaleString()} food` : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={handleBookNow} style={s.bookBtn}>
            <Text style={{ color: C.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 }}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── GALLERY MODAL ───────────────────────────────────────────── */}
      <Modal animationType="fade" transparent visible={galleryModalVisible} onRequestClose={() => setGalleryModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: 12 + sbPad, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, zIndex: 10 }}>
            <TouchableOpacity onPress={() => setGalleryModalVisible(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={22} color={C.white} />
            </TouchableOpacity>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: "700", backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
              {galleryImages.length ? `${galleryIndex + 1} / ${galleryImages.length}` : "0 / 0"}
            </Text>
          </View>
          <ScrollView ref={galleryScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flex: 1 }} onMomentumScrollEnd={(e) => { const i = Math.round(e.nativeEvent.contentOffset.x / screenWidth); setGalleryIndex(clamp(i, 0, Math.max(galleryImages.length - 1, 0))); }}>
            {galleryImages.map((img, i) => (
              <View key={`${img}-${i}`} style={{ width: screenWidth, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }}>
                <Image source={{ uri: img }} style={{ width: "100%", height: "75%" }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          {galleryImages.length > 1 && (
            <View style={{ position: "absolute", bottom: 40, left: 0, right: 0, paddingHorizontal: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => goToGalleryIndex(galleryIndex > 0 ? galleryIndex - 1 : galleryImages.length - 1)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-back" size={22} color={C.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goToGalleryIndex(galleryIndex < galleryImages.length - 1 ? galleryIndex + 1 : 0)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-forward" size={22} color={C.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── BOOKING CONFIRM MODAL ───────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={bookingModalVisible} onRequestClose={() => setBookingModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" }}>
              <View style={s.modalHeader}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: C.text1 }}>Confirm Booking</Text>
                <TouchableOpacity onPress={() => setBookingModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="close" size={16} color={C.slate4} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">

                {/* ── BOOKING DETAILS ─────────────────────────────── */}
                <View style={{ marginTop: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Booking Details</Text>
                  <View style={{ backgroundColor: C.slate1, borderRadius: 16, padding: 16 }}>

                    {/* Check-in / Check-out row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <TouchableOpacity onPress={openCheckIn} style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: C.slate2 }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Check-In</Text>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: C.text1 }}>{checkInDate ? `${checkInDate.getDate().toString().padStart(2, "0")} ${checkInDate.toLocaleString("en", { month: "short" })} ${checkInDate.getFullYear()}` : "—"}</Text>
                      </TouchableOpacity>
                      <Ionicons name="arrow-forward" size={16} color={C.slate4} />
                      <TouchableOpacity onPress={openCheckOut} style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: C.slate2 }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Check-Out</Text>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: C.text1 }}>{checkOutDate ? `${checkOutDate.getDate().toString().padStart(2, "0")} ${checkOutDate.toLocaleString("en", { month: "short" })} ${checkOutDate.getFullYear()}` : "—"}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Guests + Rooms counters */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      {[
                        { label: "Guests", value: guestsCount, onMinus: () => handleGuestsCountChange(guestsCount - 1), onPlus: () => handleGuestsCountChange(guestsCount + 1), min: 1, max: MAX_GUESTS },
                        { label: "Rooms", value: roomsCount, onMinus: () => handleRoomsCountChange(roomsCount - 1), onPlus: () => handleRoomsCountChange(roomsCount + 1), min: 1, max: MAX_ROOMS },
                      ].map((item) => (
                        <View key={item.label} style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: C.slate2, alignItems: "center" }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{item.label}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                            <TouchableOpacity onPress={item.onMinus} disabled={item.value <= item.min} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.value <= item.min ? C.slate1 : C.slate2, alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: 18, fontWeight: "700", color: item.value <= item.min ? C.slate3 : C.text2, lineHeight: 22 }}>−</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 20, fontWeight: "800", color: C.text1, minWidth: 20, textAlign: "center" }}>{item.value}</Text>
                            <TouchableOpacity onPress={item.onPlus} disabled={item.value >= item.max} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.value >= item.max ? C.slate1 : C.slate2, alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: 18, fontWeight: "700", color: item.value >= item.max ? C.slate3 : C.text2, lineHeight: 22 }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Summary line */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
                      <Ionicons name="moon-outline" size={12} color={C.slate4} />
                      <Text style={{ fontSize: 12, color: C.text3, fontWeight: "600" }}>
                        {nights} night{nights !== 1 ? "s" : ""} · {guestsCount} guest{guestsCount !== 1 ? "s" : ""} · {roomsCount} room{roomsCount !== 1 ? "s" : ""}
                      </Text>
                    </View>

                  </View>
                </View>

                {/* Summary banner */}
                <View style={[s.summaryBox, { marginTop: 16, marginBottom: 20 }]}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                    {!!selectedRoomData?.images?.[0] && (
                      <Image source={{ uri: selectedRoomData.images[0] }} style={{ width: 60, height: 60, borderRadius: 12 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "800", color: C.white, fontSize: 14, marginBottom: 2 }}>{basicInfo?.name}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 4 }}>{selectedRoomData?.name} · {roomsCount} room · {guestsCount} guest</Text>
                      <Text style={{ color: C.gold, fontWeight: "700", fontSize: 12 }}>{formatFullDate(checkInDate)} → {formatFullDate(checkOutDate)}</Text>
                      {!!selectedRoomData?.__pricing?.isOverrideApplied && <Text style={{ color: "#86EFAC", fontSize: 10, fontWeight: "700", marginTop: 3 }}>Monthly rate applied</Text>}
                    </View>
                  </View>
                </View>

                {/* Guest form */}
                <Text style={{ fontSize: 12, fontWeight: "800", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Guest Details</Text>

                {[
                  { label: "Full Name", icon: "person-outline", placeholder: "John Doe", value: guestName, setter: setGuestName, kb: "default" },
                  { label: "Phone", icon: "call-outline", placeholder: "+91 98765 43210", value: guestPhone, setter: setGuestPhone, kb: "phone-pad" },
                  { label: "Email", icon: "mail-outline", placeholder: "john@example.com", value: guestEmail, setter: setGuestEmail, kb: "email-address", ac: "none" },
                ].map((f, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{f.label}</Text>
                    <View style={s.inputRow}>
                      <Ionicons name={f.icon} size={16} color={C.slate4} />
                      <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={C.slate3} value={f.value} onChangeText={f.setter} keyboardType={f.kb} autoCapitalize={f.ac || "words"} />
                    </View>
                  </View>
                ))}

                {/* Price breakdown */}
                <View style={{ backgroundColor: C.slate1, borderRadius: 16, padding: 14, marginTop: 4, marginBottom: 28 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: C.text2, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Price Breakdown</Text>

                  {[
                    { label: `Room × ${nights} night${nights > 1 ? "s" : ""}`, val: pricing.base },
                    { label: pricing.taxLabel || "GST / Taxes", val: pricing.tax },
                    ...(pricing.foodTotal > 0 ? [{ label: "Food & Beverages", val: pricing.foodTotal }] : []),
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: C.text3, fontWeight: "600" }}>{row.label}</Text>
                      <Text style={{ fontSize: 12, color: C.text2, fontWeight: "700" }}>{currencySymbol}{Math.round(row.val).toLocaleString()}</Text>
                    </View>
                  ))}

                  {pricing.couponApplied && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: C.green, fontWeight: "700" }}>Coupon {appliedCoupon ? `(${appliedCoupon})` : ""}</Text>
                      <Text style={{ fontSize: 12, color: C.green, fontWeight: "800" }}>-{currencySymbol}{Math.round(pricing.discount).toLocaleString()}</Text>
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: C.slate2, marginVertical: 10 }} />

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: C.text1 }}>Total</Text>
                    <Text style={{ fontSize: 22, fontWeight: "800", color: C.navy, letterSpacing: -0.5 }}>{currencySymbol}{Math.round(pricing.finalTotal).toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: C.slate4, marginTop: 6 }}>* Final amount subject to hotel confirmation.</Text>
                </View>

                {!!selectedFood.length && (
                  <View style={{ backgroundColor: C.slate1, borderRadius: 16, padding: 14, marginTop: -8, marginBottom: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: C.text2, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Selected Food</Text>
                    {selectedFood.map((item, index) => (
                      <View key={`${item.foodId}-${index}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: index === selectedFood.length - 1 ? 0 : 8 }}>
                        <Text style={{ fontSize: 12, color: C.text3, fontWeight: "600", flex: 1, paddingRight: 8 }}>
                          {item.name} × {item.quantity}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.text2, fontWeight: "700" }}>
                          {formatCurrencyINR(parseNumber(item.price) * parseNumber(item.quantity))}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Coupon Code */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Coupon Code</Text>
                  <View style={{ backgroundColor: C.slate1, borderRadius: 16, padding: 4, flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
                      <Ionicons name="pricetag-outline" size={15} color={C.slate4} />
                      <TextInput
                        style={{ flex: 1, fontSize: 13, fontWeight: "600", color: C.text1, paddingVertical: 10 }}
                        placeholder="ENTER CODE"
                        placeholderTextColor={C.slate3}
                        value={couponCodeInput}
                        onChangeText={setCouponCodeInput}
                        autoCapitalize="characters"
                        editable={!appliedCoupon}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={appliedCoupon ? handleClearCoupon : handleApplyCoupon}
                      disabled={couponStatus === "loading" || (!appliedCoupon && !couponCodeInput.trim())}
                      style={{ backgroundColor: appliedCoupon ? C.green : C.navy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, opacity: (couponStatus === "loading" || (!appliedCoupon && !couponCodeInput.trim())) ? 0.5 : 1 }}
                    >
                      {couponStatus === "loading" ? (
                        <ActivityIndicator size="small" color={C.white} />
                      ) : (
                        <Text style={{ color: C.white, fontWeight: "800", fontSize: 13 }}>{appliedCoupon ? "Remove" : "Apply"}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {!!couponError && <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600", marginTop: 6, marginLeft: 4 }}>{couponError}</Text>}
                  {!!appliedCoupon && <Text style={{ fontSize: 11, color: C.green, fontWeight: "700", marginTop: 6, marginLeft: 4 }}>"{appliedCoupon}" applied!</Text>}
                </View>

                {/* Payment Mode */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Payment Mode</Text>
                  {mustPayOnline ? (
                    <>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF9EC", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: C.goldLight }}>
                        <Ionicons name="information-circle-outline" size={14} color={C.gold} />
                        <Text style={{ fontSize: 11, fontWeight: "600", color: C.gold, flex: 1 }}>
                          {roomsCount > 3 && nights > 3 ? `${roomsCount} rooms & ${nights} nights` : roomsCount > 3 ? `${roomsCount} rooms` : `${nights} nights`} booking requires online payment
                        </Text>
                      </View>

                      {/* 25% Advance */}
                      <TouchableOpacity
                        onPress={() => setPaymentMode("online_partial")}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: paymentMode === "online_partial" ? C.navy : C.slate2, backgroundColor: paymentMode === "online_partial" ? C.navyMid + "15" : C.white, marginBottom: 8 }}
                      >
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: paymentMode === "online_partial" ? C.navy : C.slate3, alignItems: "center", justifyContent: "center" }}>
                          {paymentMode === "online_partial" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.navy }} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: C.text1 }}>Pay 25% Now</Text>
                          <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Advance ₹{Math.ceil(pricing.finalTotal * 0.25).toLocaleString("en-IN")} · rest at hotel</Text>
                        </View>
                        <Ionicons name="card-outline" size={18} color={paymentMode === "online_partial" ? C.navy : C.slate4} />
                      </TouchableOpacity>

                      {/* Full payment */}
                      <TouchableOpacity
                        onPress={() => setPaymentMode("online_full")}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: paymentMode === "online_full" ? C.navy : C.slate2, backgroundColor: paymentMode === "online_full" ? C.navyMid + "15" : C.white, marginBottom: 8 }}
                      >
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: paymentMode === "online_full" ? C.navy : C.slate3, alignItems: "center", justifyContent: "center" }}>
                          {paymentMode === "online_full" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.navy }} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: C.text1 }}>Pay Full Amount</Text>
                          <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>₹{pricing.finalTotal.toLocaleString("en-IN")} now · hassle-free stay</Text>
                        </View>
                        <Ionicons name="shield-checkmark-outline" size={18} color={paymentMode === "online_full" ? C.navy : C.slate4} />
                      </TouchableOpacity>

                      {/* Disabled Pay at Hotel */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.slate2, backgroundColor: C.slate1, opacity: 0.45 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.slate3 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: C.slate4 }}>Pay at Hotel</Text>
                          <Text style={{ fontSize: 11, color: C.slate4, marginTop: 2 }}>Not available for this booking</Text>
                        </View>
                        <Ionicons name="business-outline" size={18} color={C.slate4} />
                      </View>
                    </>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.navyMid + "22" }}>
                        <Ionicons name="business-outline" size={15} color={C.navy} />
                        <Text style={{ fontSize: 12, fontWeight: "800", color: C.navy }}>Pay at Hotel</Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.slate2 }}>
                <TouchableOpacity
                  onPress={submitBooking}
                  disabled={bookingStatus === "loading"}
                  style={[s.bookBtn, { width: "100%", paddingVertical: 16, opacity: bookingStatus === "loading" ? 0.6 : 1 }]}
                >
                  {bookingStatus === "loading" ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={{ color: C.white, fontWeight: "800", fontSize: 16 }}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DATE PICKER MODAL ───────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={showDateModal} onRequestClose={() => setShowDateModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text1 }}>
                Select {dateModalTarget === "in" ? "Check-in" : "Check-out"} Date
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close-circle" size={24} color={C.slate3} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setCalendarBase(new Date(calendarBase.getFullYear(), calendarBase.getMonth() - 1, 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-back" size={18} color={C.text2} />
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: "800", color: C.text1 }}>
                {calendarBase.toLocaleString("default", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity onPress={() => setCalendarBase(new Date(calendarBase.getFullYear(), calendarBase.getMonth() + 1, 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.slate1, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-forward" size={18} color={C.text2} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <Text key={i} style={{ width: "13%", textAlign: "center", fontSize: 11, fontWeight: "800", color: C.slate4, letterSpacing: 0.5 }}>{d}</Text>
              ))}
            </View>

            {getMonthMatrix(calendarBase).map((week, wi) => (
              <View key={wi} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                {week.map((dObj, di) => {
                  const sd = new Date(calendarBase.getFullYear(), calendarBase.getMonth() + dObj.monthOffset, dObj.day);
                  const active = dateModalTarget === "in" ? checkInDate : checkOutDate;
                  const isSel = toDateOnly(sd).toDateString() === toDateOnly(active).toDateString();
                  const dis = !dObj.inMonth;
                  return (
                    <TouchableOpacity
                      key={di} disabled={dis} onPress={() => applySelectedDate(sd)}
                      style={{ width: "13%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 100, backgroundColor: isSel ? C.navy : "transparent" }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: dis ? "transparent" : isSel ? C.white : C.text1 }}>{dObj.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
              <TouchableOpacity onPress={() => setCalendarBase(new Date())} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.slate1, alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: C.text2, fontSize: 13 }}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDateModal(false)} style={{ flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.navy, alignItems: "center" }}>
                <Text style={{ fontWeight: "800", color: C.white, fontSize: 13 }}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default HotelDetails;
