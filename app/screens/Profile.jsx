import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../contexts/AuthContext";
import { fetchProfileData } from "../store/slices/userSlice";
import { fetchUserCoupons } from "../store/slices/couponSlice";
import {
  resetProfileUpdateState,
  updateUserProfile,
} from "../store/slices/profileUpdateSlice";
import { fetchFilteredBooking } from "../store/slices/bookingSlice";
import {
  createHotelComplaint,
  deleteComplaintById,
  fetchComplaintById,
  fetchUserComplaints,
  resetCreateComplaintState,
  resetDeleteComplaintState,
  resetComplaintDetailState,
  resetComplaintChatState,
  sendComplaintChat,
} from "../store/slices/complaintSlice";
import { fetchUserTourBookings } from "../store/slices/tourSlice";
import { fetchUserCabBookings } from "../store/slices/cabSlice";
import {
  ComplaintCardSkeleton,
  CouponCardSkeleton,
  HotelBookingCardSkeleton,
  ProfileHeaderSkeleton,
  ProfileTabSkeleton,
  TourBookingCardSkeleton,
} from "../components/skeleton/ProfileSkeleton";
import HotelBookingsDetailModal from "../components/HotelBookingsDetailModal";
import TourBookingDetailsModal from "../components/TourBookingDetailsModal";
import { getUserId } from "../utils/credentials";
import { router } from "../utils/navigation";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ["Bookings", "Coupons", "Complaints", "Profile"];
const BOOKING_TYPES = ["Hotel", "Tour", "Cabs"];
const BOOKING_STATUS_OPTIONS = ["All", "Confirmed", "Pending", "Checked-in", "Checked-out", "Cancelled"];
const COMPLAINT_REGARDING_OPTIONS = ["Booking", "Hotel", "Website", "Service", "Staff", "Cleanliness", "Food", "Billing", "Room", "Other"];
const INITIAL_COMPLAINT_FORM = {
  hotelId: "", regarding: "Booking", hotelName: "",
  hotelEmail: "", bookingId: "", issue: "",
};

// ─── Design System ───────────────────────────────────────────────────────────

const C = {
  // Backgrounds
  bgDeep:      "#F8F9FB",
  bgCard:      "#FFFFFF",
  bgElevated:  "#F1F3F8",
  bgGlass:     "rgba(0,0,0,0.02)",
  bgGlassMd:   "rgba(0,0,0,0.04)",

  // Gold / Brand Spectrum
  gold:        "#1E4ED8",
  goldBright:  "#3B6EF0",
  goldDeep:    "#193FBA",
  goldMuted:   "rgba(30,78,216,0.08)",
  goldBorder:  "rgba(30,78,216,0.20)",
  goldGlow:    "rgba(30,78,216,0.05)",

  // Text
  textPrimary: "#111827",
  textSec:     "#6B7280",
  textDim:     "#9CA3AF",
  textGold:    "#1E4ED8",
  textWhite:   "#FFFFFF",

  // Borders
  border:      "rgba(0,0,0,0.08)",
  borderMd:    "rgba(0,0,0,0.14)",

  // Status
  success:     "#16A34A",
  successBg:   "rgba(22,163,74,0.08)",
  successBorder:"rgba(22,163,74,0.25)",
  warning:     "#D97706",
  warningBg:   "rgba(217,119,6,0.08)",
  warningBorder:"rgba(217,119,6,0.25)",
  danger:      "#DC2626",
  dangerBg:    "rgba(220,38,38,0.08)",
  dangerBorder:"rgba(220,38,38,0.25)",
  indigo:      "#4F46E5",
  indigoBg:    "rgba(79,70,229,0.08)",
  indigoBorder:"rgba(79,70,229,0.25)",

  // Gradients (light)
  heroTop:     "#EEF2FF",
  heroBottom:  "#DBEAFE",
};

const TAB_ICONS = {
  Bookings:   "bookmark-outline",
  Coupons:    "pricetag-outline",
  Complaints: "flag-outline",
  Profile:    "person-outline",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toList = (v) => Array.isArray(v) ? v : (!v ? [] : [v]);
const toNumber = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  return Number(String(v || "").replace(/[^\d.-]/g, "")) || 0;
};
const formatCurrencyINR = (value) => {
  const n = toNumber(value);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch { return `₹${n.toLocaleString("en-IN")}`; }
};
const getFileName = (uri) => String(uri || "").split("/").pop() || `profile_${Date.now()}.jpg`;
const getMimeType = (uri) => {
  const ext = String(uri || "").split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
};
const formatLongDate = (dv) => {
  const d = new Date(dv);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const formatDateTime = (dv) => {
  const d = new Date(dv);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};
const isExpiredCoupon = (c) => {
  if (c?.expired) return true;
  const d = new Date(c?.validity);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};
const sanitizeUserId = (v) => String(v || "").trim().replace(/[<>\s]/g, "");
const normalizeText = (v) => String(v || "").trim();
const isMongoObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v || "").trim());

const statusConfig = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("confirm"))   return { color: C.success,  bg: C.successBg,  border: C.successBorder,  label: "Confirmed" };
  if (s.includes("pending"))   return { color: C.warning,  bg: C.warningBg,  border: C.warningBorder,  label: "Pending" };
  if (s.includes("cancel"))    return { color: C.danger,   bg: C.dangerBg,   border: C.dangerBorder,   label: "Cancelled" };
  if (s.includes("check"))     return { color: C.indigo,   bg: C.indigoBg,   border: C.indigoBorder,   label: status };
  if (s.includes("complet"))   return { color: C.gold,     bg: C.goldMuted,  border: C.goldBorder,     label: "Completed" };
  return { color: C.textSec, bg: C.bgGlassMd, border: C.border, label: status };
};

const resolveBookedHotelDetails = (booking) => {
  if (!booking || typeof booking !== "object") return null;
  const bookingId = [booking?.bookingId, booking?.bookingID, booking?.booking_id, booking?.bookingCode].map(normalizeText).find(Boolean) || "";
  const hotelCandidates = [booking?.hotelDetails?._id, booking?.hotelDetails?.id, booking?.hotel?._id, booking?.hotel?.id, booking?.hotelId, booking?.hotelID, booking?.hotel_id, booking?.hotelDetails?.hotelId, booking?.hotel?.hotelId].map(normalizeText).filter(Boolean);
  const hotelId = hotelCandidates.find(isMongoObjectId) || hotelCandidates[0] || "";
  if (!bookingId || !hotelId) return null;
  const hotelName = [booking?.hotelName, booking?.hotelDetails?.hotelName, booking?.hotel?.hotelName].map(normalizeText).find(Boolean) || "";
  const hotelEmail = [booking?.hotelEmail, booking?.hotelDetails?.hotelEmail, booking?.hotel?.email].map(normalizeText).find(Boolean) || "";
  return { key: `${bookingId}::${hotelId}`, bookingId, hotelId, hotelName, hotelEmail };
};

const calculateBookingCosts = (booking) => {
  const totalPaid = toNumber(booking?.price);
  const foodTotal = toList(booking?.foodDetails).reduce((sum, item) => sum + toNumber(item?.price) * toNumber(item?.quantity || 1), 0);
  const baseAmount = totalPaid > 0 ? Math.round(totalPaid / 1.12) : 0;
  const gst = totalPaid - baseAmount;
  const roomBase = Math.max(0, baseAmount - foodTotal);
  return { roomBase, foodTotal, gst, totalPaid };
};

const normalizeTourSeatLabels = (booking) => {
  const fromSeats = toList(booking?.seats).map((seat) => {
    if (typeof seat === "string" || typeof seat === "number") return String(seat).trim();
    if (seat && typeof seat === "object") return String(seat?.seatNumber || seat?.seat || seat?.number || "").trim();
    return "";
  }).filter(Boolean);
  const fromPassengers = toList(booking?.passengers).map((p) => String(p?.seatNumber || p?.seat || "").trim()).filter(Boolean);
  return Array.from(new Set([...fromSeats, ...fromPassengers]));
};

const getTourSeatCount = (booking) => {
  const seats = normalizeTourSeatLabels(booking);
  if (seats.length) return seats.length;
  return toNumber(booking?.numberOfAdults) + toNumber(booking?.numberOfChildren);
};

const getCabDisplayName = (booking) => {
  const make = booking?.carDetails?.make || booking?.carId?.make || booking?.make || "";
  const model = booking?.carDetails?.model || booking?.carId?.model || booking?.model || "";
  const combined = `${make} ${model}`.trim();
  return combined || booking?.vehicleType || "Cab Booking";
};

const getCabRideLabel = (item) => {
  const bs = String(item?.bookingStatus || "").toLowerCase();
  const rs = String(item?.rideStatus || "").toLowerCase();
  if (bs === "pending" || rs === "awaitingconfirmation") return "Payment pending — confirm karein";
  if (bs === "confirmed" && rs === "available") return "Booking confirmed — Driver aa raha hai";
  if (rs === "ride in progress") return "Trip chal rahi hai 🚗";
  if (rs === "ride completed" || bs === "completed") return "Trip completed ✓";
  if (bs === "cancelled" || rs === "cancelled") return "Booking cancelled";
  if (bs === "failed" || rs === "failed") return "Booking failed";
  return null;
};

const getTourStatusLabel = (item) => {
  const s = String(item?.status || item?.bookingStatus || "").toLowerCase();
  if (s === "pending") return "Payment pending — Complete karo";
  if (s === "confirmed") return "Booking confirmed ✓";
  if (s === "cancelled") return "Booking cancelled";
  if (s === "failed") return "Booking failed — Try again";
  return null;
};

// ─── Micro Components ─────────────────────────────────────────────────────────

const StatusBadge = ({ label }) => {
  const cfg = statusConfig(label);
  return (
    <View style={[S.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[S.badgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[S.badgeText, { color: cfg.color }]}>{String(label || "—").toUpperCase()}</Text>
    </View>
  );
};

const SectionTitle = ({ children, light }) => (
  <Text style={[S.sectionTitle, light && { color: C.textDim }]}>{children}</Text>
);

const HR = () => <View style={S.hr} />;

const InfoRow = ({ icon, label, value }) => (
  <View style={S.infoRow}>
    <View style={S.infoIcon}>
      <Ionicons name={icon} size={15} color={C.gold} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoValue} numberOfLines={1}>{value || "—"}</Text>
    </View>
  </View>
);

const GoldButton = ({ label, icon, onPress, disabled, loading, small }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.75}
    style={[S.goldBtn, small && S.goldBtnSm, (disabled || loading) && { opacity: 0.45 }]}
  >
    {loading ? (
      <ActivityIndicator size="small" color={C.bgDeep} />
    ) : (
      <>
        {icon && <Ionicons name={icon} size={small ? 12 : 15} color={C.bgDeep} />}
        <Text style={[S.goldBtnText, small && S.goldBtnTextSm]}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

const GhostButton = ({ label, icon, onPress, disabled, loading, variant }) => {
  const col = variant === "danger" ? C.danger : variant === "indigo" ? C.indigo : C.textSec;
  const bg  = variant === "danger" ? C.dangerBg : variant === "indigo" ? C.indigoBg : C.bgGlassMd;
  const brd = variant === "danger" ? C.dangerBorder : variant === "indigo" ? C.indigoBorder : C.border;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[S.ghostBtn, { backgroundColor: bg, borderColor: brd }, disabled && { opacity: 0.4 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={col} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={12} color={col} />}
          <Text style={[S.ghostBtnText, { color: col }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Booking Card ─────────────────────────────────────────────────────────────

const BookingCard = ({ item, onViewBooking }) => {
  const hotelName = item?.hotelDetails?.hotelName || "Hotel";
  const destination = item?.destination || item?.hotelDetails?.destination || "—";
  const status = item?.bookingStatus || "Pending";
  const roomType = item?.roomDetails?.[0]?.type || "—";
  const guests = toNumber(item?.guests || 0);
  const amount = formatCurrencyINR(item?.price);
  const { color, border, bg } = statusConfig(status);

  return (
    <View style={S.bookingCard}>
      {/* Left accent */}
      <View style={[S.cardStripe, { backgroundColor: color }]} />

      <View style={{ flex: 1, paddingLeft: 14 }}>
        {/* Header */}
        <View style={S.cardHead}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={S.cardTitle} numberOfLines={1}>{hotelName}</Text>
            <View style={S.cardSubRow}>
              <Ionicons name="location-outline" size={11} color={C.gold} />
              <Text style={S.cardSub}> {destination}</Text>
            </View>
            <Text style={S.cardId}>#{item?.bookingId || "—"}</Text>
          </View>
          <StatusBadge label={status} />
        </View>

        {/* Dates */}
        <View style={S.datesStrip}>
          <View style={{ flex: 1 }}>
            <Text style={S.dateKey}>CHECK-IN</Text>
            <Text style={S.dateVal}>{formatLongDate(item?.checkInDate)}</Text>
          </View>
          <View style={S.dateMid}>
            <View style={S.dateDash} />
            <Ionicons name="airplane-outline" size={14} color={C.gold} />
            <View style={S.dateDash} />
          </View>
          <View style={[{ flex: 1, alignItems: "flex-end" }]}>
            <Text style={S.dateKey}>CHECK-OUT</Text>
            <Text style={S.dateVal}>{formatLongDate(item?.checkOutDate)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={S.cardFoot}>
          <View style={S.rowC}>
            <Ionicons name="people-outline" size={12} color={C.textSec} />
            <Text style={S.cardFootTxt}> {guests} Guest{guests === 1 ? "" : "s"}</Text>
            <Text style={S.dot}>·</Text>
            <Ionicons name="bed-outline" size={12} color={C.textSec} />
            <Text style={S.cardFootTxt} numberOfLines={1}> {roomType}</Text>
          </View>
          <View style={S.rowCGap}>
            <Text style={S.amtTxt}>{amount}</Text>
            <GoldButton label="View" icon="arrow-forward" onPress={() => onViewBooking?.(item)} small />
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Main Profile Screen ──────────────────────────────────────────────────────

const Profile = () => {
  const dispatch = useDispatch();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("Bookings");
  const [bookingType, setBookingType] = useState("Hotel");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingType, setSelectedBookingType] = useState("Hotel");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintChatModal, setShowComplaintChatModal] = useState(false);
  const [showCreateComplaintModal, setShowCreateComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState(INITIAL_COMPLAINT_FORM);
  const [complaintImages, setComplaintImages] = useState([]);
  const [complaintFormError, setComplaintFormError] = useState("");
  const [selectedComplaintBookingKey, setSelectedComplaintBookingKey] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const complaintChatScrollRef = useRef(null);
  const [storedUserId, setStoredUserId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updateForm, setUpdateForm] = useState({ userName: "", email: "", mobile: "", address: "", password: "" });
  const [page, setPage] = useState(1);
  const limit = 10;

  // Redux
  const userState = useSelector((s) => s.user);
  const couponsState = useSelector((s) => s.coupons);
  const complaintsState = useSelector((s) => s.complaints);
  const profileUpdateState = useSelector((s) => s.profileUpdate);
  const tourState = useSelector((s) => s.tour);
  const bookingState = useSelector((s) => s.booking);
  const cabState = useSelector((s) => s.cab);

  const filteredBookingsEnvelope = bookingState?.filteredBookings || {};
  const filteredBookings = useMemo(() => Array.isArray(filteredBookingsEnvelope?.data) ? filteredBookingsEnvelope.data : [], [filteredBookingsEnvelope?.data]);
  const bookingLoading = bookingState?.filteredBookingsStatus === "loading";
  const bookingError = bookingState?.filteredBookingsError;
  const bookingPagination = filteredBookingsEnvelope?.pagination || null;
  const tourBookings = Array.isArray(tourState?.userTourBookings) ? tourState.userTourBookings : [];
  const tourBookingsLoading = tourState?.userTourBookingsStatus === "loading";
  const tourBookingsError = tourState?.userTourBookingsError;
  const cabBookings = Array.isArray(cabState?.userCabBookings) ? cabState.userCabBookings : [];
  const cabBookingsLoading = cabState?.userCabBookingsStatus === "loading";
  const cabBookingsError = cabState?.userCabBookingsError;
  const cabBookingsPagination = cabState?.userCabBookingsPagination || null;

  const user = userState?.data || {};
  const coupons = toList(couponsState?.items);
  const bookingHistory = useMemo(() => toList(userState?.bookingData), [userState?.bookingData]);
  const complaints = toList(complaintsState?.items);
  const isComplaintCreating = complaintsState?.createStatus === "loading";
  const isComplaintDeleting = complaintsState?.deleteStatus === "loading";
  const profileImages = Array.isArray(user?.images) ? user.images.filter(Boolean) : [];
  const profileImage = profileImages[0] || user?.profile?.[0] || null;

  const complaintItems = useMemo(() => (Array.isArray(complaints) ? complaints : []), [complaints]);
  const complaintChats = useMemo(() => {
    return [...toList(selectedComplaint?.chats)].sort((a, b) => new Date(a?.timestamp || 0).getTime() - new Date(b?.timestamp || 0).getTime());
  }, [selectedComplaint?.chats]);

  const normalizedBookedHotels = useMemo(() => {
    const uniqueMap = new Map();
    [...filteredBookings, ...bookingHistory].forEach((booking) => {
      const details = resolveBookedHotelDetails(booking);
      if (details && !uniqueMap.has(details.key)) uniqueMap.set(details.key, details);
    });
    return Array.from(uniqueMap.values());
  }, [filteredBookings, bookingHistory]);

  const userId = useMemo(() => {
    for (const candidate of [storedUserId, user?.userId, user?.id, user?._id, userState?.userId, userState?.id, userState?._id]) {
      const n = sanitizeUserId(candidate);
      if (n) return n;
    }
    return null;
  }, [storedUserId, user?.userId, user?.id, user?._id, userState?.userId, userState?.id, userState?._id]);

  // Effects
  useEffect(() => { dispatch(fetchProfileData()); dispatch(fetchUserCoupons()); }, [dispatch]);
  useEffect(() => {
    let mounted = true;
    (async () => { try { const id = await getUserId(); if (mounted) setStoredUserId(id || null); } catch { if (mounted) setStoredUserId(null); } })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => { if (userId) dispatch(fetchUserComplaints({ userId })); }, [dispatch, userId]);
  useEffect(() => { setPage(1); }, [bookingType, bookingStatusFilter]);
  useEffect(() => {
    if (activeTab !== "Bookings" || !userId) return;
    const payload = { userId, page, limit };
    if (bookingType === "Hotel" && bookingStatusFilter !== "All") payload.selectedStatus = bookingStatusFilter;
    if (bookingType === "Hotel") { dispatch(fetchFilteredBooking(payload)); return; }
    if (bookingType === "Tour") { dispatch(fetchUserTourBookings(payload)); return; }
    if (bookingType === "Cabs") dispatch(fetchUserCabBookings(payload));
  }, [dispatch, activeTab, bookingType, bookingStatusFilter, userId, page]);
  useEffect(() => {
    if (!userId || activeTab !== "Complaints") return;
    dispatch(fetchFilteredBooking({ userId, page: 1, limit: 50, selectedStatus: "All" }));
  }, [dispatch, userId, activeTab]);
  useEffect(() => {
    if (profileUpdateState?.status === "succeeded") {
      dispatch(fetchProfileData()); setShowUpdateModal(false);
      setSelectedImages([]); dispatch(resetProfileUpdateState());
    }
  }, [dispatch, profileUpdateState?.status]);
  useEffect(() => {
    if (!selectedComplaint) return;
    const updated = complaintItems.find((c) => String(c?._id || "") === String(selectedComplaint?._id || "") || String(c?.complaintId || "") === String(selectedComplaint?.complaintId || ""));
    if (updated) setSelectedComplaint(updated);
  }, [complaintItems]);
  useEffect(() => {
    if (!showComplaintChatModal) return;
    const t = setTimeout(() => complaintChatScrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(t);
  }, [showComplaintChatModal, complaintChats.length]);

  // Handlers
  const openUpdateModal = () => {
    setUpdateForm({ userName: user?.userName || "", email: user?.email || "", mobile: user?.mobile || "", address: user?.address || "", password: "" });
    setSelectedImages([]); dispatch(resetProfileUpdateState()); setShowUpdateModal(true);
  };
  const closeUpdateModal = () => { setShowUpdateModal(false); dispatch(resetProfileUpdateState()); };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, allowsMultipleSelection: false, selectionLimit: 1, quality: 0.8 });
      if (result?.canceled) return;
      const next = (result?.assets || []).filter((a) => a?.uri).map((a) => ({ uri: a.uri, name: a.fileName || getFileName(a.uri), type: a.mimeType || getMimeType(a.uri) }));
      if (next.length) setSelectedImages(next.slice(0, 1));
    } catch {}
  };

  const handleUpdateProfile = async () => {
    try {
      await dispatch(updateUserProfile({ userName: updateForm.userName?.trim(), email: updateForm.email?.trim(), mobile: updateForm.mobile?.trim(), address: updateForm.address?.trim(), password: updateForm.password?.trim(), images: selectedImages })).unwrap();
    } catch {}
  };

  const handleOpenBookingModal = (booking, type = bookingType) => {
    if (!booking) return;
    setSelectedBooking(booking); setSelectedBookingType(type); setShowBookingModal(true);
  };
  const handleCloseBookingModal = () => { setShowBookingModal(false); setSelectedBooking(null); setSelectedBookingType("Hotel"); };

  const handleOpenComplaintChat = async (complaint) => {
    if (!complaint) return;
    setSelectedComplaint(complaint); setChatMessage(""); setShowComplaintChatModal(true);
    dispatch(resetComplaintChatState()); dispatch(resetComplaintDetailState());
    const detailId = String(complaint?._id || complaint?.id || "").trim();
    if (!detailId) return;
    try {
      const detail = await dispatch(fetchComplaintById(detailId)).unwrap();
      if (detail && typeof detail === "object") setSelectedComplaint(detail);
    } catch {}
  };

  const handleCloseComplaintChat = () => {
    setShowComplaintChatModal(false); setSelectedComplaint(null); setChatMessage("");
    dispatch(resetComplaintChatState()); dispatch(resetComplaintDetailState());
  };

  const handleOpenCreateComplaintModal = () => {
    // Block if 3 or more pending complaints already exist
    const pendingCount = complaintItems.filter((c) => String(c?.status || "").toLowerCase() === "pending").length;
    if (pendingCount >= 3) {
      setComplaintFormError("You already have 3 pending complaints. Please wait for them to be resolved before raising a new one.");
      setShowCreateComplaintModal(true);
      return;
    }
    const primary = normalizedBookedHotels[0] || null;
    setSelectedComplaintBookingKey(primary?.key || "");
    setComplaintForm({ ...INITIAL_COMPLAINT_FORM, hotelId: primary?.hotelId || "", hotelName: primary?.hotelName || "", hotelEmail: primary?.hotelEmail || "", bookingId: primary?.bookingId || "" });
    setComplaintFormError(""); setComplaintImages([]); dispatch(resetCreateComplaintState()); setShowCreateComplaintModal(true);
  };

  const handleSelectComplaintBooking = (details) => {
    if (!details || typeof details !== "object") return;
    setSelectedComplaintBookingKey(details?.key || "");
    setComplaintForm((prev) => ({ ...prev, hotelId: details?.hotelId || "", hotelName: details?.hotelName || "", hotelEmail: details?.hotelEmail || "", bookingId: details?.bookingId || "" }));
  };

  const handleCloseCreateComplaintModal = () => { if (!isComplaintCreating) { setShowCreateComplaintModal(false); setSelectedComplaintBookingKey(""); } };

  const handlePickComplaintImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, allowsMultipleSelection: true, selectionLimit: 3, quality: 0.8 });
      if (result?.canceled) return;
      const next = (result?.assets || []).filter((a) => a?.uri).map((a) => ({ uri: a.uri, name: a.fileName || getFileName(a.uri), type: a.mimeType || getMimeType(a.uri) }));
      if (next.length) setComplaintImages((prev) => [...prev, ...next].slice(0, 3));
    } catch {}
  };

  const handleRemoveComplaintImage = (uri) => setComplaintImages((prev) => prev.filter((img) => img?.uri !== uri));

  const handleCreateComplaint = async () => {
    if (!userId) return;
    const hotelId = String(complaintForm.hotelId || "").trim();
    const issue = String(complaintForm.issue || "").trim();
    if (!hotelId) { setComplaintFormError("Hotel ID is required."); return; }
    if (!issue) { setComplaintFormError("Issue details are required."); return; }
    try {
      setComplaintFormError("");
      await dispatch(createHotelComplaint({ userId, hotelId, regarding: complaintForm.regarding?.trim(), hotelName: complaintForm.hotelName?.trim(), hotelEmail: complaintForm.hotelEmail?.trim(), bookingId: complaintForm.bookingId?.trim(), issue, images: complaintImages })).unwrap();
      setShowCreateComplaintModal(false); setComplaintForm(INITIAL_COMPLAINT_FORM);
      setComplaintImages([]); setComplaintFormError(""); setSelectedComplaintBookingKey("");
      dispatch(resetCreateComplaintState()); dispatch(fetchUserComplaints({ userId }));
    } catch (error) {
      const msg = String(error?.message || error?.error || "").trim();
      if (msg) setComplaintFormError(msg);
    }
  };

  const handleSendComplaintMessage = async () => {
    const message = String(chatMessage || "").trim();
    const complaintId = String(selectedComplaint?.complaintId || selectedComplaint?._id || selectedComplaint?.id || "").trim();
    if (!complaintId || !message) return;
    try {
      await dispatch(sendComplaintChat({ complaintId, message, sender: user?.userName || user?.name || user?.email || "You", receiver: "Admin" })).unwrap();
      setChatMessage("");
      if (userId) dispatch(fetchUserComplaints({ userId }));
    } catch {}
  };

  const handleDeleteComplaint = async (complaint) => {
    const detailId = String(complaint?._id || complaint?.id || complaint?.complaintId || "").trim();
    if (!detailId || !userId) return;
    try {
      await dispatch(deleteComplaintById(detailId)).unwrap();
      if (String(selectedComplaint?._id || selectedComplaint?.id || "") === detailId) handleCloseComplaintChat();
      dispatch(resetDeleteComplaintState()); dispatch(fetchUserComplaints({ userId }));
    } catch {}
  };

  // ─── Sub Renders ──────────────────────────────────────────────────────────

  const Pagination = ({ pagination, page, onPrev, onNext }) => {
    if (!pagination) return <View style={{ height: 8 }} />;
    return (
      <View style={S.paginationRow}>
        <Text style={S.paginationTxt}>Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}</Text>
        <View style={S.rowCGap}>
          <TouchableOpacity disabled={!pagination?.hasPrevPage} onPress={onPrev} style={[S.pageBtn, !pagination?.hasPrevPage && { opacity: 0.3 }]}>
            <Ionicons name="chevron-back" size={13} color={C.textPrimary} />
            <Text style={S.pageBtnTxt}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={!pagination?.hasNextPage} onPress={onNext} style={[S.pageBtn, !pagination?.hasNextPage && { opacity: 0.3 }]}>
            <Text style={S.pageBtnTxt}>Next</Text>
            <Ionicons name="chevron-forward" size={13} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyState = ({ message }) => (
    <View style={S.emptyState}>
      <View style={S.emptyIcon}>
        <Ionicons name="moon-outline" size={28} color={C.gold} />
      </View>
      <Text style={S.emptyTitle}>{message}</Text>
      <Text style={S.emptySubtitle}>Nothing to display here yet</Text>
    </View>
  );

  // ─── Bookings Tab ─────────────────────────────────────────────────────────

  const renderBookings = () => (
    <View>
      {/* Type Switcher */}
      <View style={S.typeSwitcher}>
        {BOOKING_TYPES.map((type) => {
          const active = bookingType === type;
          return (
            <TouchableOpacity key={type} onPress={() => setBookingType(type)} style={[S.typeBtn, active && S.typeBtnActive]}>
              {active && (
                <LinearGradient colors={[C.gold, C.goldDeep]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              )}
              <Text style={[S.typeBtnTxt, active && S.typeBtnTxtActive]}>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hotel Status Filters */}
      {bookingType === "Hotel" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
          {BOOKING_STATUS_OPTIONS.map((s) => {
            const active = bookingStatusFilter === s;
            return (
              <TouchableOpacity key={s} onPress={() => setBookingStatusFilter(s)} style={[S.filterChip, active && S.filterChipActive]}>
                {active && <View style={S.filterDot} />}
                <Text style={[S.filterChipTxt, active && S.filterChipTxtActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Hotel Bookings */}
      {bookingType === "Hotel" && (
        <>
          {bookingLoading && [0, 1, 2].map((i) => <HotelBookingCardSkeleton key={i} />)}
          {!!bookingError && !bookingLoading && <Text style={S.errorTxt}>{String(bookingError?.message || bookingError)}</Text>}
          {!bookingLoading && !bookingError && (
            <>
              {filteredBookings.length
                ? filteredBookings.map((item, i) => <BookingCard key={item?._id || String(i)} item={item} onViewBooking={(b) => handleOpenBookingModal(b, "Hotel")} />)
                : <EmptyState message="No hotel bookings found" />}
              <Pagination pagination={bookingPagination} page={page} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
            </>
          )}
        </>
      )}

      {/* Tour Bookings */}
      {bookingType === "Tour" && (
        <>
          {tourBookingsLoading && [0, 1, 2].map((i) => <TourBookingCardSkeleton key={i} />)}
          {!!tourBookingsError && !tourBookingsLoading && <Text style={S.errorTxt}>{String(tourBookingsError?.message || tourBookingsError)}</Text>}
          {!tourBookingsLoading && !tourBookingsError && (
            <>
              {tourBookings.length ? tourBookings.map((item, i) => {
                const status = item?.status || item?.bookingStatus || "Pending";
                const { color } = statusConfig(status);
                const tourLabel = getTourStatusLabel(item);
                const tourImage = item?.images?.[0] || null;
                return (
                  <View key={item?._id || String(i)} style={S.bookingCard}>
                    <View style={[S.cardStripe, { backgroundColor: color }]} />
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                      {!!tourImage && <Image source={{ uri: tourImage }} style={S.travelImg} resizeMode="cover" />}
                      <View style={S.cardHead}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={S.cardTitle} numberOfLines={2}>{item?.visitngPlaces || item?.travelAgencyName || "Tour Booking"}</Text>
                          <Text style={S.cardSub}>{item?.city || item?.state || "—"} · {item?.travelAgencyName || "—"}</Text>
                          <Text style={S.cardId}>#{item?.bookingCode || item?._id || "—"}</Text>
                        </View>
                        <StatusBadge label={status} />
                      </View>
                      {!!tourLabel && (
                        <View style={S.alertBanner}>
                          <Ionicons name="bus-outline" size={12} color={C.indigo} />
                          <Text style={S.alertBannerTxt}>{tourLabel}</Text>
                        </View>
                      )}
                      <View style={[S.datesStrip, { marginTop: 6 }]}>
                        <View style={{ flex: 1 }}><Text style={S.dateKey}>FROM</Text><Text style={S.dateVal}>{formatLongDate(item?.from || item?.tourStartDate)}</Text></View>
                        <View style={S.dateMid}><View style={S.dateDash} /><Ionicons name="map-outline" size={14} color={C.gold} /><View style={S.dateDash} /></View>
                        <View style={[{ flex: 1, alignItems: "flex-end" }]}><Text style={S.dateKey}>TO</Text><Text style={S.dateVal}>{formatLongDate(item?.to)}</Text></View>
                      </View>
                      <View style={S.cardFoot}>
                        <Text style={S.cardFootTxt}>{toNumber(item?.nights)}N · {toNumber(item?.days)}D · {getTourSeatCount(item)} seat(s)</Text>
                        <View style={S.rowCGap}>
                          <Text style={S.amtTxt}>{formatCurrencyINR(item?.totalAmount || item?.basePrice || item?.price)}</Text>
                          <GoldButton label="View" icon="arrow-forward" onPress={() => handleOpenBookingModal(item, "Tour")} small />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }) : <EmptyState message="No tour bookings found" />}
            </>
          )}
        </>
      )}

      {/* Cab Bookings */}
      {bookingType === "Cabs" && (
        <>
          {cabBookingsLoading && [0, 1, 2].map((i) => <HotelBookingCardSkeleton key={i} />)}
          {!!cabBookingsError && !cabBookingsLoading && <Text style={S.errorTxt}>{String(cabBookingsError?.message || cabBookingsError)}</Text>}
          {!cabBookingsLoading && !cabBookingsError && (
            <>
              {cabBookings.length ? cabBookings.map((item, i) => {
                const status = item?.bookingStatus || item?.status || "Pending";
                const rideStatus = item?.rideStatus || "";
                const { color } = statusConfig(status);
                const rideLabel = getCabRideLabel(item);
                const cabVehicleNumber = item?.vehicleNumber || item?.carDetails?.vehicleNumber || item?.carId?.vehicleNumber || "—";
                const cabImage = item?.carDetails?.images?.[0] || item?.carId?.images?.[0] || null;
                return (
                  <View key={item?._id || String(i)} style={S.bookingCard}>
                    <View style={[S.cardStripe, { backgroundColor: color }]} />
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                      {!!cabImage && <Image source={{ uri: cabImage }} style={S.travelImg} resizeMode="cover" />}
                      <View style={S.cardHead}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={S.cardTitle} numberOfLines={1}>{getCabDisplayName(item)}</Text>
                          <Text style={S.cardSub}>{cabVehicleNumber} · {item?.sharingType || "Private"}</Text>
                          <Text style={S.cardId}>#{item?.bookingId || item?._id || "—"}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <StatusBadge label={status} />
                          {!!rideStatus && (
                            <View style={[S.badge, { backgroundColor: C.indigoBg, borderColor: C.indigoBorder }]}>
                              <Ionicons name="car-sport-outline" size={9} color={C.indigo} />
                              <Text style={[S.badgeText, { color: C.indigo }]}>{rideStatus.toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {!!rideLabel && (
                        <View style={S.alertBanner}>
                          <Ionicons name="car-sport-outline" size={12} color={C.indigo} />
                          <Text style={S.alertBannerTxt}>{rideLabel}</Text>
                        </View>
                      )}
                      <View style={S.routeBox}>
                        <Ionicons name="radio-button-on-outline" size={12} color={C.success} />
                        <Text style={S.routeTxt} numberOfLines={1}>{item?.pickupP || "—"}</Text>
                      </View>
                      <View style={S.routeConnector} />
                      <View style={S.routeBox}>
                        <Ionicons name="location-outline" size={12} color={C.danger} />
                        <Text style={S.routeTxt} numberOfLines={1}>{item?.dropP || "—"}</Text>
                      </View>
                      {!!(item?.pickupCode || item?.dropCode) && (
                        <View style={S.codesRow}>
                          {!!item?.pickupCode && (
                            <View style={[S.codeChip, { borderColor: C.successBorder }]}>
                              <Ionicons name="key-outline" size={10} color={C.success} />
                              <Text style={[S.codeLbl, { color: C.success }]}>Pickup</Text>
                              <Text style={S.codeVal}>{item.pickupCode}</Text>
                            </View>
                          )}
                          {!!item?.dropCode && (
                            <View style={[S.codeChip, { borderColor: C.dangerBorder }]}>
                              <Ionicons name="key-outline" size={10} color={C.danger} />
                              <Text style={[S.codeLbl, { color: C.danger }]}>Drop</Text>
                              <Text style={S.codeVal}>{item.dropCode}</Text>
                            </View>
                          )}
                        </View>
                      )}
                      <View style={S.cardFoot}>
                        <Text style={S.cardFootTxt}>{formatLongDate(item?.pickupD)} → {formatLongDate(item?.dropD)}</Text>
                        <Text style={S.amtTxt}>{formatCurrencyINR(item?.price)}</Text>
                      </View>
                    </View>
                  </View>
                );
              }) : <EmptyState message="No cab bookings found" />}
              <Pagination pagination={cabBookingsPagination} page={page} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
            </>
          )}
        </>
      )}
    </View>
  );

  // ─── Coupons Tab ──────────────────────────────────────────────────────────

  const renderCoupons = () => (
    <View>
      {couponsState?.status === "loading" && [0, 1, 2].map((i) => <CouponCardSkeleton key={i} />)}
      {couponsState?.status === "failed" && <Text style={S.errorTxt}>{String(couponsState?.error?.message || couponsState?.error)}</Text>}
      {coupons.map((coupon, index) => {
        const expired = isExpiredCoupon(coupon);
        const code = coupon?.couponCode || `COUPON${index + 1}`;
        return (
          <View key={coupon?._id || `${code}-${index}`} style={[S.couponCard, expired && { opacity: 0.4 }]}>
            {/* Dashed separator line */}
            <View style={S.couponSep} />
            {/* Notches */}
            <View style={S.couponNotchL} />
            <View style={S.couponNotchR} />

            {/* Left: Amount */}
            <LinearGradient colors={expired ? [C.bgElevated, C.bgCard] : [C.gold, C.goldDeep]} style={S.couponLeft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={S.couponAmt}>{formatCurrencyINR(coupon?.discountPrice)}</Text>
              <Text style={S.couponOff}>OFF</Text>
            </LinearGradient>

            {/* Right: Details */}
            <View style={S.couponRight}>
              <Text style={S.couponCode}>{code}</Text>
              <Text style={S.couponName} numberOfLines={1}>{coupon?.couponName || "Special Offer"}</Text>
              <View style={S.couponMeta}>
                <Ionicons name="calendar-outline" size={11} color={C.textSec} />
                <Text style={S.couponValidity}>Valid till {formatLongDate(coupon?.validity)}</Text>
              </View>
              {expired ? (
                <View style={[S.couponStatusPill, { backgroundColor: C.dangerBg, borderColor: C.dangerBorder }]}>
                  <Text style={[S.couponStatusTxt, { color: C.danger }]}>EXPIRED</Text>
                </View>
              ) : (
                <View style={[S.couponStatusPill, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
                  <View style={[S.badgeDot, { backgroundColor: C.success, marginRight: 4 }]} />
                  <Text style={[S.couponStatusTxt, { color: C.success }]}>ACTIVE</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
      {!coupons.length && couponsState?.status !== "loading" && <EmptyState message="No coupons available" />}
    </View>
  );

  // ─── Complaints Tab ───────────────────────────────────────────────────────

  const renderComplaints = () => {
    const COMP_STATUS = {
      resolved: { label: "Resolved", color: "#22C55E", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)", icon: "checkmark-circle" },
      rejected: { label: "Rejected", color: "#F87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)", icon: "close-circle" },
      approved: { label: "Approved", color: "#818CF8", bg: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.25)", icon: "shield-checkmark" },
      working:  { label: "Working",  color: "#FBBF24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)",  icon: "construct" },
      pending:  { label: "Pending",  color: "#8B92A5", bg: "rgba(139,146,165,0.10)", border: "rgba(139,146,165,0.20)", icon: "time" },
    };
    const getCSCfg = (s) => COMP_STATUS[String(s || "pending").toLowerCase()] ?? COMP_STATUS.pending;

    return (
      <View>
        {/* Header CTA */}
        <View style={S.ctaCard}>
          <View style={S.ctaCircle1} /><View style={S.ctaCircle2} />
          <View style={[S.ctaIcon]}>
            <Ionicons name="flag" size={20} color={C.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={S.ctaTitle}>Raise a Complaint</Text>
            <Text style={S.ctaSub}>Hotel ya booking mein koi issue? Yahan resolve karein.</Text>
          </View>
          <GoldButton label="New" icon="add" onPress={handleOpenCreateComplaintModal} disabled={!userId || isComplaintCreating} loading={isComplaintCreating} small />
        </View>

        {/* Count label */}
        {complaintsState?.status !== "loading" && complaintItems.length > 0 && (
          <View style={S.countRow}>
            <View style={S.countDash} />
            <Text style={S.countTxt}>{complaintItems.length} COMPLAINT{complaintItems.length !== 1 ? "S" : ""}</Text>
            <View style={S.countDash} />
          </View>
        )}

        {complaintsState?.status === "loading" && [0, 1, 2].map((i) => <ComplaintCardSkeleton key={i} />)}

        {complaintsState?.status === "failed" && (
          <View style={S.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color={C.danger} />
            <Text style={S.errorBannerTxt}>{String(complaintsState?.error?.message || complaintsState?.error || "Something went wrong")}</Text>
          </View>
        )}

        {complaintsState?.status !== "loading" && complaintItems.map((complaint, i) => {
          const cfg = getCSCfg(complaint?.status);
          const msgCount = toList(complaint?.chats).length;
          const title = complaint?.issue || complaint?.title || complaint?.regarding || "Complaint";
          const complaintId = complaint?.complaintId || "—";
          const raisedDate = formatLongDate(complaint?.createdAt || complaint?.raisedOn);

          return (
            <View key={complaint?.id || complaint?._id || String(i)} style={S.complaintCard}>
              <View style={[S.complaintAccent, { backgroundColor: cfg.color }]} />
              <View style={{ flex: 1 }}>
                <View style={S.complaintHead}>
                  <View style={[S.complaintIconBox, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <Ionicons name={cfg.icon} size={17} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={S.rowBetween}>
                      <Text style={S.complaintTitle} numberOfLines={1}>{title}</Text>
                      <View style={[S.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <View style={[S.badgeDot, { backgroundColor: cfg.color }]} />
                        <Text style={[S.badgeText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={S.complaintMeta}>
                      <Ionicons name="pricetag-outline" size={10} color={C.textDim} />
                      <Text style={S.complaintMetaTxt}>{complaintId}</Text>
                      <View style={S.metaDot} />
                      <Ionicons name="calendar-outline" size={10} color={C.textDim} />
                      <Text style={S.complaintMetaTxt}>{raisedDate}</Text>
                    </View>
                  </View>
                </View>

                <View style={S.complaintActions}>
                  <GhostButton
                    label={msgCount > 0 ? `Chat (${msgCount})` : "Chat"}
                    icon="chatbubble-ellipses-outline"
                    onPress={() => handleOpenComplaintChat(complaint)}
                    variant="indigo"
                  />
                  <GhostButton
                    label="Delete"
                    icon="trash-outline"
                    onPress={() => handleDeleteComplaint(complaint)}
                    disabled={isComplaintDeleting}
                    loading={isComplaintDeleting}
                    variant="danger"
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── Profile Tab ──────────────────────────────────────────────────────────

  const renderProfileTab = () =>
    userState?.loading ? <ProfileTabSkeleton /> : (
      <View>
        <View style={S.infoCard}>
          <SectionTitle>CONTACT INFO</SectionTitle>
          <InfoRow icon="call-outline" label="PHONE" value={user?.mobile ? `+91 ${user.mobile}` : null} />
          <HR />
          <InfoRow icon="mail-outline" label="EMAIL" value={user?.email} />
          <HR />
          <InfoRow icon="location-outline" label="ADDRESS" value={user?.address} />
          <HR />
          <InfoRow icon="person-outline" label="NAME" value={user?.userName} />
        </View>

        <View style={S.infoCard}>
          <SectionTitle>SETTINGS</SectionTitle>
          <View style={S.settingRow}>
            <View style={S.rowC}>
              <View style={S.settingIconBox}>
                <Ionicons name="notifications-outline" size={15} color={C.gold} />
              </View>
              <Text style={S.settingLbl}>Push Notifications</Text>
            </View>
            <TouchableOpacity onPress={() => setNotificationsEnabled((p) => !p)} style={[S.toggle, notificationsEnabled && S.toggleOn]} activeOpacity={0.8}>
              <View style={[S.toggleThumb, notificationsEnabled && S.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          <HR />
          <View style={S.settingRow}>
            <View style={S.rowC}>
              <View style={[S.settingIconBox, { backgroundColor: C.dangerBg }]}>
                <Ionicons name="trash-outline" size={15} color={C.danger} />
              </View>
              <TouchableOpacity>
                <Text style={[S.settingLbl, { color: C.danger }]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={S.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={C.danger} />
          <Text style={S.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );

  const renderTabContent = () => {
    if (activeTab === "Bookings") return renderBookings();
    if (activeTab === "Coupons") return renderCoupons();
    if (activeTab === "Complaints") return renderComplaints();
    return renderProfileTab();
  };

  const isTourBookingSelected = selectedBookingType === "Tour" || Boolean(selectedBooking?.tourId);

  const STAT_DATA = [
    { icon: "calendar-outline", value: filteredBookings.length || bookingHistory.length, label: "Bookings" },
    { icon: "pricetag-outline", value: coupons.length, label: "Coupons" },
    { icon: "flag-outline", value: complaintItems.length, label: "Complaints" },
  ];

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgDeep} />

      {/* ── Hero Section ── */}
      <LinearGradient colors={[C.heroTop, C.heroBottom]} style={S.hero} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
        {/* Subtle mesh overlay */}
        <View style={S.heroMesh} pointerEvents="none" />

        {/* Top Nav */}
        <View style={S.topNav}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.goBack() : router.navigate("Search", { screen: "Home" })}
            style={S.navIconBtn}
          >
            <Ionicons name="arrow-back" size={19} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.navHeading}>My Profile</Text>
          <TouchableOpacity onPress={() => router.navigate("Notifications")} style={S.navIconBtn}>
            <Ionicons name="notifications-outline" size={19} color={C.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Block */}
        {userState?.loading ? <ProfileHeaderSkeleton /> : (
          <View style={S.profileBlock}>
            {/* Avatar */}
            <View style={S.avatarWrap}>
              <LinearGradient colors={[C.gold, C.goldDeep]} style={S.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={S.avatarInner}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={S.avatarImg} />
                  ) : (
                    <LinearGradient colors={[C.bgElevated, C.bgCard]} style={S.avatarImg}>
                      <Text style={S.avatarInitial}>{(user?.userName || "U")[0].toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              <TouchableOpacity onPress={openUpdateModal} style={S.avatarEditBtn}>
                <Ionicons name="pencil" size={10} color={C.bgDeep} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={S.heroName} numberOfLines={1}>{user?.userName || "—"}</Text>
              <View style={[S.rowC, { marginTop: 4 }]}>
                <Ionicons name="mail-outline" size={11} color={C.gold} />
                <Text style={S.heroEmail} numberOfLines={1}> {user?.email || "—"}</Text>
              </View>
              {!!user?.address && (
                <View style={[S.rowC, { marginTop: 3 }]}>
                  <Ionicons name="location-outline" size={11} color={C.textSec} />
                  <Text style={S.heroAddr} numberOfLines={1}> {user.address}</Text>
                </View>
              )}
              <TouchableOpacity onPress={openUpdateModal} style={S.editProfileBtn}>
                <Text style={S.editProfileBtnTxt}>Edit Profile</Text>
                <Ionicons name="arrow-forward" size={10} color={C.gold} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={S.statsRow}>
          {STAT_DATA.map(({ icon, value, label }, i) => (
            <View key={label} style={[S.statCell, i < STAT_DATA.length - 1 && S.statCellBorder]}>
              <Text style={S.statVal}>{value}</Text>
              <Text style={S.statLbl}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Tab Bar ── */}
      <View style={S.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={S.tabItem} activeOpacity={0.7}>
              <Ionicons name={TAB_ICONS[tab]} size={16} color={active ? C.gold : C.textDim} />
              <Text style={[S.tabTxt, active && S.tabTxtActive]}>{tab}</Text>
              {active && (
                <LinearGradient colors={[C.gold, C.goldDeep]} style={S.tabIndicator} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        {!!userState?.error && <Text style={S.errorTxt}>{String(userState?.error?.message || userState?.error)}</Text>}
        {renderTabContent()}
      </ScrollView>

      {/* ── Booking Modals ── */}
      <TourBookingDetailsModal visible={showBookingModal && isTourBookingSelected} onClose={handleCloseBookingModal} booking={selectedBooking} />
      <HotelBookingsDetailModal visible={showBookingModal && !isTourBookingSelected} onClose={handleCloseBookingModal} booking={selectedBooking} />

      {/* ── Create Complaint Modal ── */}
      <Modal animationType="slide" transparent visible={showCreateComplaintModal} onRequestClose={handleCloseCreateComplaintModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={S.modalOverlay}>
            <View style={[S.sheet, { height: "82%" }]}>
              <View style={S.sheetHandle} />

              <View style={S.sheetHead}>
                <View style={S.sheetHeadIcon}>
                  <Ionicons name="flag-outline" size={16} color={C.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={S.sheetTitle}>Create Complaint</Text>
                  <Text style={S.sheetSub}>Hotel support ticket raise karein</Text>
                </View>
                <TouchableOpacity onPress={handleCloseCreateComplaintModal} style={S.sheetCloseBtn} disabled={isComplaintCreating}>
                  <Ionicons name="close" size={16} color={C.textSec} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Booking selector */}
                {!!normalizedBookedHotels.length && (
                  <View style={{ marginBottom: 18 }}>
                    <Text style={S.fieldLabel}>Select Booking</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {normalizedBookedHotels.map((details) => {
                        const active = selectedComplaintBookingKey === details.key;
                        return (
                          <TouchableOpacity key={details.key} onPress={() => handleSelectComplaintBooking(details)}
                            style={[S.bookingChip, active && S.bookingChipActive]}>
                            <Text style={[S.bookingChipId, active && { color: C.gold }]}>{details.bookingId}</Text>
                            <Text style={S.bookingChipSub} numberOfLines={1}>{details.hotelName || details.hotelId}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {!!complaintFormError && <View style={S.errorBanner}><Ionicons name="alert-circle-outline" size={13} color={C.danger} /><Text style={S.errorBannerTxt}>{complaintFormError}</Text></View>}
                {!!complaintsState?.createError && <View style={S.errorBanner}><Text style={S.errorBannerTxt}>{String(complaintsState?.createError?.message || complaintsState?.createError)}</Text></View>}

                {[
                  ["Hotel ID *", "hotelId", "67b0f53a7a0a3d4ec1234567", false],
                  ["Hotel Name", "hotelName", "Hotel Blue Star", false],
                  ["Hotel Email", "hotelEmail", "support@hotel.com", "email-address"],
                  ["Booking ID", "bookingId", "BK-90211", false],
                ].map(([label, key, placeholder, kbType]) => (
                  <View key={key}>
                    <Text style={S.fieldLabel}>{label}</Text>
                    <TextInput
                      value={complaintForm[key]}
                      onChangeText={(t) => { setComplaintFormError(""); setSelectedComplaintBookingKey(""); setComplaintForm((prev) => ({ ...prev, [key]: t })); }}
                      placeholder={placeholder}
                      placeholderTextColor={C.textDim}
                      keyboardType={kbType || "default"}
                      autoCapitalize={kbType === "email-address" ? "none" : "sentences"}
                      style={S.textField}
                    />
                  </View>
                ))}

                <Text style={S.fieldLabel}>Regarding</Text>
                <View style={S.optGrid}>
                  {COMPLAINT_REGARDING_OPTIONS.map((opt) => {
                    const active = complaintForm.regarding === opt;
                    return (
                      <TouchableOpacity key={opt} onPress={() => { setComplaintFormError(""); setComplaintForm((p) => ({ ...p, regarding: opt })); }}
                        style={[S.optChip, active && S.optChipActive]}>
                        <Text style={[S.optChipTxt, active && S.optChipTxtActive]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={S.fieldLabel}>Issue Description *</Text>
                <TextInput
                  value={complaintForm.issue}
                  onChangeText={(t) => { setComplaintFormError(""); setComplaintForm((p) => ({ ...p, issue: t })); }}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor={C.textDim}
                  multiline textAlignVertical="top"
                  style={[S.textField, { height: 96, paddingTop: 12 }]}
                />

                {/* Image Attach */}
                <View style={S.imgAttach}>
                  <View style={S.rowBetween}>
                    <Text style={S.fieldLabel}>Attachments ({complaintImages.length}/3)</Text>
                    <TouchableOpacity onPress={handlePickComplaintImages} style={S.addImgBtn}>
                      <Ionicons name="add" size={13} color={C.gold} />
                      <Text style={S.addImgTxt}>Add Photo</Text>
                    </TouchableOpacity>
                  </View>
                  {complaintImages.map((img, idx) => (
                    <View key={img?.uri || idx} style={S.imgRow}>
                      <Ionicons name="image-outline" size={14} color={C.textSec} />
                      <Text style={S.imgName} numberOfLines={1}>{img?.name || `Image ${idx + 1}`}</Text>
                      <TouchableOpacity onPress={() => handleRemoveComplaintImage(img?.uri)}>
                        <Ionicons name="close-circle" size={17} color={C.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={S.sheetFooter}>
                <TouchableOpacity onPress={handleCloseCreateComplaintModal} disabled={isComplaintCreating} style={S.ghostActionBtn}>
                  <Text style={S.ghostActionTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateComplaint}
                  disabled={isComplaintCreating || !userId}
                  style={[S.solidActionBtn, (isComplaintCreating || !userId) && { opacity: 0.45 }]}
                >
                  {isComplaintCreating
                    ? <ActivityIndicator size="small" color={C.bgDeep} />
                    : <Text style={S.solidActionTxt}>Submit Complaint</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Complaint Chat Modal ── */}
      <Modal animationType="slide" transparent visible={showComplaintChatModal} onRequestClose={handleCloseComplaintChat}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={S.modalOverlay}>
            <View style={[S.sheet, { height: "82%" }]}>
              {/* Chat Header */}
              <View style={S.chatTopBar}>
                <View style={S.chatAvatarBox}>
                  <Ionicons name="headset-outline" size={16} color={C.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={S.chatTopTitle}>Support Chat</Text>
                  <Text style={S.chatTopSub}>{selectedComplaint?.complaintId || "—"}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseComplaintChat} style={S.sheetCloseBtn}>
                  <Ionicons name="close" size={16} color={C.textSec} />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView
                ref={complaintChatScrollRef}
                style={S.chatScroll}
                contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 14 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => showComplaintChatModal && complaintChatScrollRef.current?.scrollToEnd({ animated: true })}
              >
                {complaintsState?.detailStatus === "loading" && (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={C.gold} />
                  </View>
                )}
                {complaintChats.length ? complaintChats.map((chat, idx) => {
                  const sender = String(chat?.sender || "").toLowerCase();
                  const mine = sender === String(user?.userName || "").toLowerCase() || sender === String(user?.email || "").toLowerCase() || sender.includes("you");
                  return (
                    <View key={chat?._id || idx} style={[S.bubbleWrap, mine ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
                      <View style={[S.bubble, mine ? S.bubbleMine : S.bubbleOther]}>
                        <Text style={[S.bubbleSender, { color: mine ? C.gold : C.indigo }]}>{mine ? "You" : (chat?.sender || "Support")}</Text>
                        <Text style={S.bubbleContent}>{chat?.content || "—"}</Text>
                        <Text style={S.bubbleTime}>{formatDateTime(chat?.timestamp)}</Text>
                      </View>
                    </View>
                  );
                }) : (
                  <View style={S.emptyState}>
                    <View style={S.emptyIcon}>
                      <Ionicons name="chatbubbles-outline" size={26} color={C.gold} />
                    </View>
                    <Text style={S.emptyTitle}>No messages yet</Text>
                    <Text style={S.emptySubtitle}>Send your first message below</Text>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={S.chatInputBar}>
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Type your message..."
                  placeholderTextColor={C.textDim}
                  style={S.chatInput}
                />
                <TouchableOpacity
                  onPress={handleSendComplaintMessage}
                  disabled={complaintsState?.chatStatus === "loading" || !String(chatMessage || "").trim()}
                  style={[S.sendBtn, (!String(chatMessage || "").trim() || complaintsState?.chatStatus === "loading") && { opacity: 0.4 }]}
                >
                  {complaintsState?.chatStatus === "loading"
                    ? <ActivityIndicator size="small" color={C.bgDeep} />
                    : <Ionicons name="send" size={15} color={C.bgDeep} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Profile Modal ── */}
      <Modal animationType="slide" transparent={false} visible={showUpdateModal} onRequestClose={closeUpdateModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.bgDeep }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bgDeep }} edges={["top"]}>
            {/* Header */}
            <View style={S.editNavBar}>
              <TouchableOpacity onPress={closeUpdateModal} style={S.navIconBtn}>
                <Ionicons name="arrow-back" size={19} color={C.textPrimary} />
              </TouchableOpacity>
              <Text style={S.navHeading}>Edit Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={S.editScrollContent} showsVerticalScrollIndicator={false}>
              {/* Avatar picker */}
              <View style={S.editAvatarArea}>
                <LinearGradient colors={[C.gold, C.goldDeep]} style={S.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={S.avatarInner}>
                    {(selectedImages[0]?.uri || profileImage) ? (
                      <Image source={{ uri: selectedImages[0]?.uri || profileImage }} style={S.avatarImg} />
                    ) : (
                      <LinearGradient colors={[C.bgElevated, C.bgCard]} style={[S.avatarImg, { alignItems: "center", justifyContent: "center" }]}>
                        <Text style={S.avatarInitial}>{(user?.userName || "U")[0].toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
                <TouchableOpacity onPress={handlePickImages} style={S.changePhotoBtn}>
                  <View style={S.changePhotoIcon}>
                    <Ionicons name="camera-outline" size={14} color={C.gold} />
                  </View>
                  <Text style={S.changePhotoTxt}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Fields */}
              {[
                { label: "FULL NAME",    key: "userName", icon: "person-outline",     placeholder: "Your full name",             kb: "default",       secure: false },
                { label: "EMAIL",        key: "email",    icon: "mail-outline",        placeholder: "Email address",              kb: "email-address", secure: false },
                { label: "PHONE",        key: "mobile",   icon: "call-outline",        placeholder: "Phone number",               kb: "phone-pad",     secure: false },
                { label: "ADDRESS",      key: "address",  icon: "location-outline",    placeholder: "Your address",               kb: "default",       secure: false },
                { label: "NEW PASSWORD", key: "password", icon: "lock-closed-outline", placeholder: "Leave blank to keep current", kb: "default",       secure: true  },
              ].map(({ label, key, icon, placeholder, kb, secure }) => (
                <View key={key} style={S.fieldWrap}>
                  <Text style={S.fieldLabel}>{label}</Text>
                  <View style={S.editFieldRow}>
                    <Ionicons name={icon} size={15} color={C.gold} />
                    <TextInput
                      value={updateForm[key]}
                      onChangeText={(t) => setUpdateForm((p) => ({ ...p, [key]: key === "mobile" ? t.replace(/[^\d]/g, "") : t }))}
                      placeholder={placeholder}
                      placeholderTextColor={C.textDim}
                      keyboardType={kb}
                      autoCapitalize={kb === "email-address" ? "none" : "sentences"}
                      secureTextEntry={secure}
                      style={S.editFieldInput}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Save Footer */}
            <View style={S.editFooter}>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={profileUpdateState?.status === "loading"}
                style={[S.saveBtn, profileUpdateState?.status === "loading" && { opacity: 0.5 }]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[C.goldBright, C.goldDeep]} style={S.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {profileUpdateState?.status === "loading"
                    ? <ActivityIndicator color={C.bgDeep} />
                    : <><Text style={S.saveBtnTxt}>Save Changes</Text><Ionicons name="checkmark" size={18} color={C.bgDeep} /></>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bgDeep },

  // ── Hero ──
  hero: { paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 52 : 34, paddingBottom: 20 },
  heroMesh: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(201,168,76,0.02)", borderBottomWidth: 1, borderBottomColor: C.border },

  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 26 },
  navIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgGlassMd, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  navHeading: { fontSize: 16, fontWeight: "700", color: C.textPrimary, letterSpacing: 0.6 },

  profileBlock: { flexDirection: "row", alignItems: "center", marginBottom: 22 },

  avatarWrap: { position: "relative" },
  avatarRing: { width: 76, height: 76, borderRadius: 38, padding: 2.5, alignItems: "center", justifyContent: "center" },
  avatarInner: { width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", backgroundColor: C.bgCard, alignItems: "center", justifyContent: "center" },
  avatarImg: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 28, fontWeight: "900", color: C.gold },
  avatarEditBtn: { position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderRadius: 8, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.bgDeep },

  heroName: { fontSize: 22, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
  heroEmail: { fontSize: 12, color: C.textSec },
  heroAddr: { fontSize: 11, color: C.textDim },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-start", backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  editProfileBtnTxt: { fontSize: 11, fontWeight: "700", color: C.gold },

  statsRow: { flexDirection: "row", backgroundColor: C.bgGlass, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: C.border },
  statVal: { fontSize: 22, fontWeight: "900", color: C.gold },
  statLbl: { fontSize: 10, color: C.textSec, fontWeight: "600", marginTop: 2, letterSpacing: 0.6 },

  // ── Tab Bar ──
  tabBar: { flexDirection: "row", backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 11, gap: 3, position: "relative" },
  tabTxt: { fontSize: 10, fontWeight: "700", color: C.textDim, letterSpacing: 0.4 },
  tabTxtActive: { color: C.gold },
  tabIndicator: { position: "absolute", bottom: 0, height: 2, width: "70%", borderRadius: 2 },

  // ── Scroll ──
  scroll: { flex: 1, backgroundColor: C.bgDeep },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },

  // ── Booking Card ──
  bookingCard: { flexDirection: "row", backgroundColor: C.bgCard, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden", padding: 14 },
  cardStripe: { width: 3.5, borderRadius: 4, minHeight: 80 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.2 },
  cardSubRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  cardSub: { fontSize: 11, color: C.textSec },
  cardId: { fontSize: 10, color: C.textDim, marginTop: 3, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  cardFootTxt: { fontSize: 11, color: C.textSec },
  amtTxt: { fontSize: 14, fontWeight: "900", color: C.goldBright },

  datesStrip: { flexDirection: "row", alignItems: "center", backgroundColor: C.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 10 },
  dateKey: { fontSize: 9, fontWeight: "800", color: C.textDim, letterSpacing: 1 },
  dateVal: { fontSize: 13, fontWeight: "700", color: C.textPrimary, marginTop: 2 },
  dateMid: { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
  dateDash: { height: 1, width: 14, backgroundColor: C.border },

  travelImg: { width: "100%", height: 100, borderRadius: 10, marginBottom: 10 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.indigoBg, borderRadius: 8, borderWidth: 1, borderColor: C.indigoBorder, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  alertBannerTxt: { fontSize: 11, fontWeight: "600", color: C.indigo, flex: 1 },

  routeBox: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  routeConnector: { width: 1, height: 9, backgroundColor: C.border, marginLeft: 6 },
  routeTxt: { fontSize: 12, color: C.textSec, flex: 1 },
  codesRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  codeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bgElevated, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  codeLbl: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  codeVal: { fontSize: 12, fontWeight: "900", color: C.textPrimary, letterSpacing: 1 },

  // ── Badges ──
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.8 },

  // ── Type Switcher ──
  typeSwitcher: { flexDirection: "row", backgroundColor: C.bgCard, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 14, overflow: "hidden" },
  typeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", overflow: "hidden" },
  typeBtnActive: {},
  typeBtnTxt: { fontSize: 12, fontWeight: "700", color: C.textDim },
  typeBtnTxtActive: { color: C.bgDeep },

  // ── Filters ──
  filterRow: { paddingBottom: 14, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
  filterChipActive: { borderColor: C.goldBorder, backgroundColor: C.goldMuted },
  filterDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gold },
  filterChipTxt: { fontSize: 11, fontWeight: "700", color: C.textSec },
  filterChipTxtActive: { color: C.gold },

  // ── Pagination ──
  paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  paginationTxt: { fontSize: 11, color: C.textSec },
  pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, marginLeft: 8 },
  pageBtnTxt: { fontSize: 11, fontWeight: "700", color: C.textPrimary },

  // ── Coupons ──
  couponCard: { flexDirection: "row", backgroundColor: C.bgCard, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden", position: "relative", height: 110 },
  couponSep: { position: "absolute", left: 100, top: 0, bottom: 0, width: 1, borderStyle: "dashed", borderRightWidth: 1, borderColor: C.border, zIndex: 1 },
  couponNotchL: { position: "absolute", left: -10, top: "50%", marginTop: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: C.bgDeep, zIndex: 2 },
  couponNotchR: { position: "absolute", right: -10, top: "50%", marginTop: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: C.bgDeep, zIndex: 2 },
  couponLeft: { width: 100, alignItems: "center", justifyContent: "center" },
  couponAmt: { fontSize: 17, fontWeight: "900", color: C.goldBright, textAlign: "center" },
  couponOff: { fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 2, marginTop: 3 },
  couponRight: { flex: 1, padding: 14, justifyContent: "center" },
  couponCode: { fontSize: 19, fontWeight: "900", color: C.textPrimary, letterSpacing: 1 },
  couponName: { fontSize: 11, color: C.textSec, marginTop: 2 },
  couponMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  couponValidity: { fontSize: 10, color: C.textDim },
  couponStatusPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  couponStatusTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  // ── Complaints ──
  ctaCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1.5, borderColor: C.goldBorder, backgroundColor: C.goldMuted, overflow: "hidden", position: "relative" },
  ctaCircle1: { position: "absolute", right: -30, top: -30, width: 90, height: 90, borderRadius: 45, borderWidth: 16, borderColor: C.goldGlow },
  ctaCircle2: { position: "absolute", right: 15, bottom: -38, width: 70, height: 70, borderRadius: 35, borderWidth: 12, borderColor: "rgba(30,78,216,0.05)" },
  ctaIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center" },
  ctaTitle: { fontSize: 14, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.2 },
  ctaSub: { fontSize: 11, color: C.textSec, marginTop: 3, lineHeight: 16 },

  countRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  countDash: { flex: 1, height: 1, backgroundColor: C.border },
  countTxt: { fontSize: 10, fontWeight: "800", color: C.textDim, letterSpacing: 1.2 },

  errorBanner: { flexDirection: "row", alignItems: "center", backgroundColor: C.dangerBg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.dangerBorder, gap: 8, marginBottom: 12 },
  errorBannerTxt: { fontSize: 12, fontWeight: "600", color: C.danger, flex: 1 },

  complaintCard: { flexDirection: "row", backgroundColor: C.bgCard, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10, overflow: "hidden" },
  complaintAccent: { width: 3, borderRadius: 2 },
  complaintHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, flex: 1, padding: 12, paddingBottom: 0 },
  complaintIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0 },
  complaintTitle: { fontSize: 13.5, fontWeight: "800", color: C.textPrimary, flex: 1, marginRight: 8, letterSpacing: -0.1 },
  complaintMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  complaintMetaTxt: { fontSize: 10, color: C.textDim, fontWeight: "600" },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textDim },
  complaintActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 0 },

  // ── Profile Info Tab ──
  infoCard: { backgroundColor: C.bgCard, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: "800", color: C.gold, letterSpacing: 1.5, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoLabel: { fontSize: 9, fontWeight: "800", color: C.textDim, letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginTop: 2 },
  hr: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  settingIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.goldMuted, alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingLbl: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, justifyContent: "center", paddingHorizontal: 3 },
  toggleOn: { backgroundColor: C.goldMuted, borderColor: C.goldBorder },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.textDim, alignSelf: "flex-start" },
  toggleThumbOn: { backgroundColor: C.gold, alignSelf: "flex-end" },

  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, backgroundColor: C.dangerBg, borderRadius: 16, borderWidth: 1, borderColor: C.dangerBorder },
  signOutTxt: { fontSize: 14, fontWeight: "800", color: C.danger },

  // ── Buttons ──
  goldBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  goldBtnSm: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  goldBtnText: { fontSize: 13, fontWeight: "800", color: C.bgDeep },
  goldBtnTextSm: { fontSize: 11 },
  ghostBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 32, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1 },
  ghostBtnText: { fontSize: 11.5, fontWeight: "700" },

  // ── Empty / Error ──
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 44, gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 14, color: C.textSec, fontWeight: "700" },
  emptySubtitle: { fontSize: 11, color: C.textDim },
  errorTxt: { fontSize: 11, color: C.danger, fontWeight: "700", marginBottom: 10 },

  // ── Modals ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "90%", borderTopWidth: 1, borderTopColor: C.border },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 20 },

  sheetHead: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  sheetHeadIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 17, fontWeight: "900", color: C.textPrimary, letterSpacing: -0.2 },
  sheetSub: { fontSize: 11, color: C.textSec, marginTop: 2 },
  sheetCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.bgElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  sheetFooter: { flexDirection: "row", paddingTop: 16, gap: 10, borderTopWidth: 1, borderTopColor: C.border, marginTop: 8 },
  ghostActionBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  ghostActionTxt: { fontSize: 13, fontWeight: "700", color: C.textSec },
  solidActionBtn: { flex: 1.5, height: 50, borderRadius: 14, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  solidActionTxt: { fontSize: 13, fontWeight: "900", color: C.bgDeep },

  // ── Form Fields ──
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 10, fontWeight: "800", color: C.textSec, letterSpacing: 1, marginBottom: 8 },
  textField: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated, paddingHorizontal: 14, fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 14 },

  bookingChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated, minWidth: 150 },
  bookingChipActive: { borderColor: C.goldBorder, backgroundColor: C.goldMuted },
  bookingChipId: { fontSize: 11, fontWeight: "800", color: C.textSec },
  bookingChipSub: { fontSize: 10, color: C.textDim, marginTop: 2 },

  optGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  optChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated },
  optChipActive: { borderColor: C.goldBorder, backgroundColor: C.goldMuted },
  optChipTxt: { fontSize: 12, fontWeight: "700", color: C.textSec },
  optChipTxtActive: { color: C.gold },

  imgAttach: { backgroundColor: C.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 },
  addImgBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldMuted },
  addImgTxt: { fontSize: 11, fontWeight: "700", color: C.gold },
  imgRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 6 },
  imgName: { flex: 1, fontSize: 11, color: C.textSec },

  // ── Chat ──
  chatTopBar: { flexDirection: "row", alignItems: "center", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  chatAvatarBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center" },
  chatTopTitle: { fontSize: 16, fontWeight: "800", color: C.textPrimary },
  chatTopSub: { fontSize: 10, color: C.textSec, marginTop: 2 },
  chatScroll: { flex: 1, backgroundColor: C.bgDeep },
  bubbleWrap: { marginBottom: 12 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 18 },
  bubbleMine: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleSender: { fontSize: 10, fontWeight: "800", marginBottom: 4, letterSpacing: 0.3 },
  bubbleContent: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: C.textDim, marginTop: 6 },
  chatInputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  chatInput: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated, paddingHorizontal: 18, fontSize: 13, color: C.textPrimary },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },

  // ── Edit Profile ──
  editNavBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  editScrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  editAvatarArea: { alignItems: "center", paddingVertical: 30 },
  changePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  changePhotoIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.goldMuted, borderWidth: 1, borderColor: C.goldBorder, alignItems: "center", justifyContent: "center" },
  changePhotoTxt: { fontSize: 13, fontWeight: "700", color: C.gold },
  editFieldRow: { flexDirection: "row", alignItems: "center", height: 52, backgroundColor: C.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, gap: 10 },
  editFieldInput: { flex: 1, fontSize: 14, color: C.textPrimary, fontWeight: "500" },
  editFooter: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border },
  saveBtn: { borderRadius: 16, overflow: "hidden" },
  saveBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54 },
  saveBtnTxt: { fontSize: 16, fontWeight: "900", color: C.bgDeep },

  // ── Misc ──
  rowC: { flexDirection: "row", alignItems: "center" },
  rowCGap: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dot: { color: C.border, marginHorizontal: 6, fontSize: 14 },
});

export default Profile;