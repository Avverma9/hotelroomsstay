import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createCabBooking,
  fetchAllCabs,
  fetchCabById,
  fetchSeatData,
  resetCabBookingState,
  resetSeatData,
  resetSelectedCab,
} from "../store/slices/cabSlice";
import { useAppModal } from "../contexts/AppModalContext";
import { getUserId } from "../utils/credentials";
import Header from "../components/Header";

// ─── helpers ──────────────────────────────────────────────────────────────────

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFiniteNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getCabId = (cab) =>
  String(
    cab?._id ?? cab?.carId ?? cab?.id ?? cab?.cabId ?? cab?.carID ?? cab?.cabID ?? ""
  ).trim();

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return null;
};

const isSeatBooked = (seat) => {
  const direct = normalizeBool(seat?.isBooked ?? seat?.booked ?? seat?.isSeatBooked);
  if (direct !== null) return direct;
  const status = String(seat?.status || seat?.seatStatus || "").trim().toLowerCase();
  if (status.includes("book")) return true;
  if (status.includes("open") || status.includes("available") || status.includes("vacant")) return false;
  return false;
};

const resolveCabBookingState = (cab, seatStats) => {
  const isRunning = normalizeBool(cab?.isRunning);
  if (isRunning === false) return { key: "unavailable", label: "Unavailable", canBook: false };

  const totalSeats = Number(seatStats?.total || 0);
  const bookedSeats = Number(seatStats?.booked || 0);
  if (totalSeats > 0 && bookedSeats >= totalSeats)
    return { key: "fullyBooked", label: "Fully Booked", canBook: false };

  const isAvailable = normalizeBool(cab?.isAvailable);
  if (isAvailable === false) return { key: "unavailable", label: "Unavailable", canBook: false };

  const status = String(cab?.runningStatus || "").trim().toLowerCase();
  if (status.includes("unavailable") || status.includes("not available"))
    return { key: "unavailable", label: "Unavailable", canBook: false };

  return { key: "available", label: "Available", canBook: true };
};

const validateEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const normalizeSeatToken = (seat) => {
  if (typeof seat === "number") return Number.isFinite(seat) ? seat : null;
  const text = String(seat || "").trim();
  if (!text) return null;
  const asNumber = Number(text);
  return Number.isFinite(asNumber) ? asNumber : text;
};

const getSeatId = (seat) => {
  const raw = seat?._id ?? seat?.id ?? seat?.seatId ?? seat?.seatID ?? null;
  const id = String(raw || "").trim();
  return id || null;
};

const resolveCabFare = (cab) => {
  const isShared = String(cab?.sharingType || "").toLowerCase() === "shared";
  const seatPrices = (Array.isArray(cab?.seatConfig) ? cab.seatConfig : [])
    .map((seat) => toFiniteNumber(seat?.seatPrice))
    .filter((n) => n !== null && n >= 0);
  const seatDerivedFare = seatPrices.length ? Math.min(...seatPrices) : null;

  const candidates = isShared
    ? [cab?.perPersonCost, cab?.price, seatDerivedFare]
    : [cab?.price, cab?.perPersonCost, seatDerivedFare];

  for (const value of candidates) {
    const numeric = toFiniteNumber(value);
    if (numeric !== null && numeric >= 0) return numeric;
  }

  return 0;
};

const getBookingResponseId = (response) =>
  response?.bookingId ||
  response?.data?.bookingId ||
  response?.data?._id ||
  response?.result?.bookingId ||
  response?._id ||
  null;

// ─── small reusable pieces ────────────────────────────────────────────────────

/** Single label+value cell used in the Vehicle Info grid */
const InfoCell = ({ label, value }) => (
  <View style={{ width: "50%", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderRightWidth: 0.5, borderColor: "#E8EDF2" }}>
    <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: "#94A3B8" }}>
      {label}
    </Text>
    <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E293B", marginTop: 3 }} numberOfLines={1}>
      {value || "—"}
    </Text>
  </View>
);

/** Section header inside a card */
const SectionHeader = ({ title }) => (
  <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 0.5, borderColor: "#E8EDF2" }}>
    <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, color: "#64748B" }}>
      {title}
    </Text>
  </View>
);

/** Input row used in booking modal */
const FormField = ({ label, ...inputProps }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </Text>
    <TextInput
      placeholderTextColor="#CBD5E1"
      style={{
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        fontSize: 13,
        fontWeight: "600",
        color: "#1E293B",
      }}
      {...inputProps}
    />
  </View>
);

// ─── main component ───────────────────────────────────────────────────────────

export default function CabDetails({ navigation, route }) {
  const dispatch = useDispatch();
  const { showError, showInfo, showSuccess } = useAppModal();
  const { cabId, cab: previewCab } = route?.params || {};
  const requestedCabId = String(cabId || getCabId(previewCab) || "").trim();

  const {
    selectedCab,
    selectedCabStatus,
    selectedCabError,
    cabBookingStatus,
    seatData: liveSeatData,
  } = useSelector((state) => state.cab || {});

  const userState = useSelector((state) => state.user);
  const loggedUser = userState?.user || userState?.data || null;

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  // passengers[0] is always the primary passenger (pre-filled from logged-in user)
  // length always mirrors selectedSeatIds.length for shared, or stays [1] for private
  const makePassenger = (user = null) => ({
    name:   user?.userName  || "",
    mobile: user?.mobile    || "",
    email:  user?.email     || "",
  });
  const [passengers, setPassengers] = useState([makePassenger(loggedUser)]);

  const updatePassenger = useCallback((idx, field, value) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  // Keep passengers list in sync with seat count
  const syncPassengersToCount = useCallback((count) => {
    setPassengers((prev) => {
      if (count <= 0) return [makePassenger(loggedUser)];
      if (count === prev.length) return prev;
      if (count > prev.length) {
        // Add empty slots
        return [...prev, ...Array(count - prev.length).fill(null).map(() => makePassenger())];
      }
      // Trim to count (always keep at least passenger[0])
      return prev.slice(0, count);
    });
  }, [loggedUser]);

  const cab = selectedCab || previewCab || null;
  const resolvedCabId = getCabId(cab) || requestedCabId;
  const isShared = String(cab?.sharingType || "").toLowerCase() === "shared";

  useEffect(() => {
    if (requestedCabId) dispatch(fetchCabById(requestedCabId));
    return () => {
      dispatch(resetSelectedCab());
      dispatch(resetCabBookingState());
      dispatch(resetSeatData());
    };
  }, [dispatch, requestedCabId]);

  useEffect(() => {
    if (isShared && resolvedCabId) dispatch(fetchSeatData(resolvedCabId));
  }, [dispatch, isShared, resolvedCabId]);

  const effectiveSeats = useMemo(() => {
    if (isShared && Array.isArray(liveSeatData) && liveSeatData.length > 0) return liveSeatData;
    return Array.isArray(cab?.seatConfig) ? cab.seatConfig : [];
  }, [isShared, liveSeatData, cab?.seatConfig]);

  const seatStats = useMemo(() => {
    const seats = effectiveSeats;
    const declared = safeNumber(cab?.seater, 0);
    const total = Math.max(declared > 0 ? declared : 0, seats.length);
    const booked = seats.filter((s) => isSeatBooked(s)).length;
    return { total, booked, available: Math.max(total - booked, 0), seats };
  }, [effectiveSeats, cab?.seater]);

  const totalFare = resolveCabFare(cab);
  const bookingState = useMemo(() => resolveCabBookingState(cab, seatStats), [cab, seatStats]);
  const isAvailable = bookingState.canBook;
  const isBookingSubmitting = cabBookingStatus === "loading";

  const availableSeatChoices = useMemo(
    () =>
      (Array.isArray(seatStats?.seats) ? seatStats.seats : [])
        .filter((seat) => !isSeatBooked(seat))
        .map((seat) => {
          const seatId = getSeatId(seat);
          const seatLabel =
            normalizeSeatToken(seat?.seatNumber ?? seat?.number ?? seat?.seatNo) ??
            seatId?.slice(-4) ??
            "";
          return seatId ? { seatId, seatLabel } : null;
        })
        .filter(Boolean),
    [seatStats?.seats]
  );

  const closeBookingModal = useCallback(() => {
    if (isBookingSubmitting) return;
    setBookingModalVisible(false);
  }, [isBookingSubmitting]);

  const resetFormState = useCallback(() => {
    setSelectedSeatIds([]);
    setPassengers([makePassenger(loggedUser)]);
  }, [loggedUser]);

  const openBookingModal = useCallback(() => {
    if (!isAvailable) {
      showInfo(
        bookingState.key === "fullyBooked" ? "Fully Booked" : "Cab Unavailable",
        bookingState.key === "fullyBooked"
          ? "All seats are booked for this cab right now."
          : "This cab is currently unavailable for booking."
      );
      return;
    }
    // Pre-fill primary passenger with latest user data on each open
    setPassengers((prev) => {
      const updated = [...prev];
      updated[0] = {
        name:   prev[0]?.name   || loggedUser?.userName  || "",
        mobile: prev[0]?.mobile || loggedUser?.mobile    || "",
        email:  prev[0]?.email  || loggedUser?.email     || "",
      };
      return updated;
    });
    setBookingModalVisible(true);
  }, [bookingState.key, isAvailable, showInfo, loggedUser]);

  const toggleSeatSelection = useCallback((seatId) => {
    const token = String(seatId);
    setSelectedSeatIds((prev) => {
      const exists = prev.some((item) => String(item) === token);
      const next = exists ? prev.filter((item) => String(item) !== token) : [...prev, token];
      // Sync passenger forms to new seat count
      syncPassengersToCount(next.length || 1);
      return next;
    });
  }, [syncPassengersToCount]);

  const submitCabBooking = async () => {
    if (isBookingSubmitting) return;
    if (!resolvedCabId) { showError("Cab Not Found", "Unable to identify the selected cab."); return; }

    const loggedInUserId = await getUserId();
    if (!loggedInUserId) { showError("Login Required", "Please login to continue booking."); return; }

    // Validate all passenger forms
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const label = passengers.length > 1 ? ` (Passenger ${i + 1})` : "";
      if (!p.name.trim()) { showError("Missing Details", `Please enter passenger name${label}.`); return; }
      const mob = p.mobile.replace(/[^\d]/g, "");
      if (!mob || mob.length < 10) { showError("Invalid Mobile", `Enter valid 10-digit mobile${label}.`); return; }
      if (!validateEmail(p.email)) { showError("Invalid Email", `Enter valid email${label}.`); return; }
    }

    if (isShared && availableSeatChoices.length === 0) { showError("Seat Data Missing", "No seat IDs found for this shared cab."); return; }
    if (isShared && availableSeatChoices.length > 0 && selectedSeatIds.length === 0) { showError("Select Seats", "Please select at least one seat for shared booking."); return; }
    if (isShared && selectedSeatIds.length > seatStats.available) { showError("Seat Limit Exceeded", `Only ${seatStats.available} seats are available.`); return; }

    const primary = passengers[0];
    const payload = {
      userId: String(loggedInUserId),
      carId: resolvedCabId,
      customerMobile: primary.mobile.replace(/[^\d]/g, ""),
      customerEmail: primary.email.trim(),
      passengerName: primary.name.trim(),
      bookedBy: primary.mobile.replace(/[^\d]/g, ""),
      paymentMethod: "Online",
      isPaid: false,
      confirmOnCreate: false,
    };

    // Attach extra passengers if more than 1
    if (passengers.length > 1) {
      payload.passengers = passengers.map((p) => ({
        name:   p.name.trim(),
        mobile: p.mobile.replace(/[^\d]/g, ""),
        email:  p.email.trim(),
      }));
    }

    const cabSharingType = String(cab?.sharingType || "").trim();
    if (cabSharingType) payload.sharingType = cabSharingType;
    const cabVehicleType = String(cab?.vehicleType || "").trim();
    if (cabVehicleType) payload.vehicleType = cabVehicleType;
    if (isShared) payload.seats = selectedSeatIds;

    try {
      const response = await dispatch(createCabBooking(payload)).unwrap();
      const bookingId = getBookingResponseId(response);
      const bookingData = response?.data || response || {};
      const pickupCode = bookingData?.pickupCode || "";
      const dropCode = bookingData?.dropCode || "";
      const rideStatus = bookingData?.rideStatus || "";

      setBookingModalVisible(false);
      resetFormState();
      dispatch(resetCabBookingState());
      if (resolvedCabId) dispatch(fetchCabById(resolvedCabId));
      dispatch(fetchAllCabs());

      const codeParts = [];
      if (pickupCode) codeParts.push(`Pickup Code: ${pickupCode}`);
      if (dropCode) codeParts.push(`Drop Code: ${dropCode}`);
      if (rideStatus) codeParts.push(`Status: ${rideStatus}`);

      showSuccess(
        "Booking Confirmed",
        [bookingId ? `Booking ID: ${bookingId}` : "Cab booking created successfully.", ...codeParts]
          .filter(Boolean)
          .join("\n")
      );
    } catch (error) {
      showError("Booking Failed", String(error?.message || "Unable to create cab booking right now."));
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (selectedCabStatus === "loading" && !cab) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#94A3B8", marginTop: 12 }}>
          Loading cab details…
        </Text>
      </SafeAreaView>
    );
  }

  // ── Not-found state ──────────────────────────────────────────────────────────
  if (!cab) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B", marginTop: 14 }}>Cab not found</Text>
        <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>
          {selectedCabError?.message || "Unable to load selected cab details."}
        </Text>
        <TouchableOpacity
          onPress={() => requestedCabId ? dispatch(fetchCabById(requestedCabId)) : navigation.goBack()}
          activeOpacity={0.85}
          style={{ marginTop: 20, height: 44, paddingHorizontal: 28, borderRadius: 10, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
            {requestedCabId ? "Retry" : "Go Back"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Booking state colors ─────────────────────────────────────────────────────
  const stateColors = {
    available:   { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    fullyBooked: { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
    unavailable: { bg: "#FFF1F2", border: "#FECDD3", text: "#BE123C" },
  };
  const sc = stateColors[bookingState.key] || stateColors.unavailable;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F5F9" }} edges={["left", "right", "bottom"]}>
      <Header
        compact
        showHero={false}
        showBack
        showNotification={false}
        leftTitle="Cab Details"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 12, marginTop: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 0.5, borderColor: "#E2E8F0", overflow: "hidden" }}>

          {/* Image */}
          <View style={{ height: 200, backgroundColor: "#F1F5F9" }}>
            <Image
              source={{ uri: cab?.images?.[0] || "https://via.placeholder.com/800x500?text=Cab" }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Availability badge over image */}
            <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: sc.bg, borderWidth: 0.5, borderColor: sc.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: sc.text }}>{bookingState.label}</Text>
            </View>
          </View>

          {/* Title + tags */}
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }} numberOfLines={1}>
                  {cab?.make} {cab?.model}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                  {cab?.vehicleType || "Car"} · {safeNumber(cab?.seater, seatStats.total)} Seats · {cab?.fuelType || "—"}
                </Text>
              </View>
              {/* Sharing type pill */}
              <View style={{ backgroundColor: "#EFF6FF", borderWidth: 0.5, borderColor: "#BFDBFE", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1D4ED8" }}>
                  {cab?.sharingType || "Private"}
                </Text>
              </View>
            </View>
          </View>

          {/* Route strip */}
          <View style={{ marginHorizontal: 14, marginTop: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 0.5, borderColor: "#E2E8F0", padding: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-sharp" size={13} color="#1D4ED8" />
              <Text style={{ marginLeft: 5, fontSize: 13, fontWeight: "600", color: "#1E293B", flex: 1 }} numberOfLines={1}>
                {cab?.pickupP || "—"} → {cab?.dropP || "—"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", marginTop: 6, gap: 14 }}>
              <Text style={{ fontSize: 11, color: "#64748B" }}>
                <Text style={{ fontWeight: "600" }}>Pickup: </Text>{formatDateTime(cab?.pickupD)}
              </Text>
              <Text style={{ fontSize: 11, color: "#64748B" }}>
                <Text style={{ fontWeight: "600" }}>Drop: </Text>{formatDateTime(cab?.dropD)}
              </Text>
            </View>
          </View>

          {/* Fare row */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: "#94A3B8" }}>
                {isShared ? "Per Seat" : "Trip Fare"}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#1D4ED8", lineHeight: 32, marginTop: 2 }}>
                {`\u20B9${totalFare.toLocaleString("en-IN")}`}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: "#94A3B8" }}>
                Status
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginTop: 3 }}>
                {cab?.runningStatus || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Vehicle Info card ─────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 0.5, borderColor: "#E2E8F0", overflow: "hidden" }}>
          <SectionHeader title="Vehicle Info" />
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <InfoCell label="Vehicle No." value={cab?.vehicleNumber} />
            <InfoCell label="Year" value={String(cab?.year || "—")} />
            <InfoCell label="Fuel" value={cab?.fuelType} />
            <InfoCell label="Transmission" value={cab?.transmission} />
            <InfoCell label="Mileage" value={cab?.mileage ? `${cab.mileage} km/l` : "—"} />
            <InfoCell label="Color" value={cab?.color} />
            <InfoCell label="Extra Km" value={cab?.extraKm ? `${cab.extraKm} km` : "—"} />
            <InfoCell
              label={isShared ? "Per Person" : "Trip Cost"}
              value={`\u20B9${totalFare.toLocaleString("en-IN")}`}
            />
          </View>
        </View>

        {/* ── Seat Availability card (shared only) ─────────────────────────── */}
        {isShared && (
          <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 0.5, borderColor: "#E2E8F0", overflow: "hidden" }}>
            <SectionHeader title="Seat Availability" />

            {/* Stat row */}
            <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
              {/* Total */}
              <View style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 0.5, borderColor: "#E2E8F0", padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: "#94A3B8" }}>Total</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#0F172A", marginTop: 4 }}>{seatStats.total}</Text>
              </View>
              {/* Booked */}
              <View style={{ flex: 1, backgroundColor: "#FFF1F2", borderRadius: 10, borderWidth: 0.5, borderColor: "#FECDD3", padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: "#BE123C" }}>Booked</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#BE123C", marginTop: 4 }}>{seatStats.booked}</Text>
              </View>
              {/* Available */}
              <View style={{ flex: 1, backgroundColor: "#F0FDF4", borderRadius: 10, borderWidth: 0.5, borderColor: "#BBF7D0", padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: "#15803D" }}>Available</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#15803D", marginTop: 4 }}>{seatStats.available}</Text>
              </View>
            </View>

            {/* Seat chips */}
            {!!seatStats.seats.length && (
              <>
                <View style={{ height: 0.5, backgroundColor: "#E2E8F0", marginHorizontal: 12 }} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 7 }}>
                  {seatStats.seats.slice(0, 14).map((seat) => {
                    const booked = isSeatBooked(seat);
                    return (
                      <View
                        key={seat?._id || `seat-${seat?.seatNumber}`}
                        style={{
                          height: 32,
                          minWidth: 48,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          borderWidth: 0.5,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: booked ? "#FFF1F2" : "#F0FDF4",
                          borderColor: booked ? "#FECDD3" : "#BBF7D0",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: booked ? "#BE123C" : "#15803D" }}>
                          S{seat?.seatNumber}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Verification badge card ───────────────────────────────────────── */}
        <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 0.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#15803D" />
          </View>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#475569" }}>
            Verified vehicle — documents checked &amp; approved
          </Text>
        </View>
      </ScrollView>

      {/* ── Bottom CTA ────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#E2E8F0" }}>
        <TouchableOpacity
          disabled={!isAvailable}
          onPress={openBookingModal}
          activeOpacity={0.88}
          style={{
            height: 50,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isAvailable ? "#1D4ED8" : "#CBD5E1",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", letterSpacing: 0.2 }}>
            {isAvailable
              ? "Proceed to Booking"
              : bookingState.key === "fullyBooked"
              ? "Fully Booked"
              : "Currently Unavailable"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Booking Modal ─────────────────────────────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={bookingModalVisible}
        onRequestClose={closeBookingModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" }}
        >
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, maxHeight: "88%" }}>

            {/* Modal header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>Complete Booking</Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Fill passenger details to confirm</Text>
              </View>
              <TouchableOpacity
                onPress={closeBookingModal}
                disabled={isBookingSubmitting}
                activeOpacity={0.85}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Cab summary strip */}
              <View style={{ backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 0.5, borderColor: "#E2E8F0", padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A" }}>
                  {cab?.make} {cab?.model}
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                  {cab?.pickupP || "—"} → {cab?.dropP || "—"} · {cab?.sharingType || "Private"}
                </Text>
              </View>

              {/* Passenger forms — one per selected seat (or 1 for private) */}
              {passengers.map((p, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: idx === 0 ? "#F0F9FF" : "#F8FAFC",
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: idx === 0 ? "#BAE6FD" : "#E2E8F0",
                    padding: 13,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: idx === 0 ? "#1D4ED8" : "#64748B",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>{idx + 1}</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                        {idx === 0 ? "Primary Passenger" : `Passenger ${idx + 1}`}
                        {isShared && selectedSeatIds[idx] ? (
                          <Text style={{ fontWeight: "600", color: "#64748B" }}>{"  ·  S"}{selectedSeatIds[idx]?.toString().slice(-4)}</Text>
                        ) : null}
                      </Text>
                    </View>
                    {idx > 0 && (
                      <TouchableOpacity
                        onPress={() => setPassengers((prev) => prev.filter((_, i) => i !== idx))}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <FormField
                    label="Full Name"
                    value={p.name}
                    onChangeText={(v) => updatePassenger(idx, "name", v)}
                    placeholder="Full name"
                  />
                  <FormField
                    label="Mobile"
                    value={p.mobile}
                    onChangeText={(v) => updatePassenger(idx, "mobile", v)}
                    keyboardType="number-pad"
                    maxLength={15}
                    placeholder="10-digit mobile"
                  />
                  <FormField
                    label="Email"
                    value={p.email}
                    onChangeText={(v) => updatePassenger(idx, "email", v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="email@example.com"
                  />
                </View>
              ))}

              {/* Add another passenger button — shown when seats allow more */}
              {(() => {
                const maxPassengers = isShared ? selectedSeatIds.length : 1;
                if (maxPassengers > 1 && passengers.length < maxPassengers) {
                  return (
                    <TouchableOpacity
                      onPress={() => setPassengers((prev) => [...prev, makePassenger()])}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "#1D4ED8",
                        borderRadius: 10,
                        paddingVertical: 11,
                        marginBottom: 14,
                      }}
                    >
                      <Ionicons name="person-add-outline" size={16} color="#1D4ED8" />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#1D4ED8" }}>
                        Add Passenger {passengers.length + 1} of {maxPassengers}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}

              {/* Seat selection (shared only) */}
              {isShared && availableSeatChoices.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Select Seats
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                    {availableSeatChoices.map((seat) => {
                      const active = selectedSeatIds.some((item) => String(item) === String(seat.seatId));
                      return (
                        <TouchableOpacity
                          key={seat.seatId}
                          onPress={() => toggleSeatSelection(seat.seatId)}
                          activeOpacity={0.85}
                          style={{
                            height: 36,
                            paddingHorizontal: 14,
                            borderRadius: 8,
                            borderWidth: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: active ? "#1D4ED8" : "#F8FAFC",
                            borderColor: active ? "#1D4ED8" : "#E2E8F0",
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : "#475569" }}>
                            S{seat.seatLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 7 }}>
                    Selected: {selectedSeatIds.length}
                  </Text>
                </View>
              ) : isShared ? (
                <View style={{ backgroundColor: "#FFFBEB", borderRadius: 10, borderWidth: 0.5, borderColor: "#FDE68A", padding: 12, marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#B45309" }}>
                    Seat IDs are not available for booking.
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 0.5, borderColor: "#E2E8F0", padding: 12, marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>
                    Private booking — full cab will be reserved.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal action buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={closeBookingModal}
                disabled={isBookingSubmitting}
                activeOpacity={0.85}
                style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={submitCabBooking}
                disabled={isBookingSubmitting}
                activeOpacity={0.88}
                style={{ flex: 1.5, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: isBookingSubmitting ? "#CBD5E1" : "#1D4ED8" }}
              >
                {isBookingSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}