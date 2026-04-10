import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { fetchAllCabs, filterCabsByQuery } from "../store/slices/cabSlice";
import CabsSkeleton from "../components/skeleton/CabsSkeleton";
import Header from "../components/Header";

const FILTERS = ["All", "Car", "Bus", "Shared", "Private"];

const FILTER_ICONS = {
  All: "grid",
  Car: "car",
  Bus: "bus",
  Shared: "users",
  Private: "lock",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

const normalizeBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes")
      return true;
    if (normalized === "false" || normalized === "0" || normalized === "no")
      return false;
  }
  return null;
};

const isSeatBooked = (seat) => {
  const direct = normalizeBool(
    seat?.isBooked ?? seat?.booked ?? seat?.isSeatBooked
  );
  if (direct !== null) return direct;
  const status = String(seat?.status || seat?.seatStatus || "")
    .trim()
    .toLowerCase();
  if (status.includes("book")) return true;
  if (
    status.includes("open") ||
    status.includes("available") ||
    status.includes("vacant")
  )
    return false;
  return false;
};

const getTotalSeats = (cab) => {
  const configured = Array.isArray(cab?.seatConfig)
    ? cab.seatConfig.length
    : 0;
  const seater = Number(cab?.seater);
  const declared =
    Number.isFinite(seater) && seater > 0 ? seater : 0;
  return Math.max(declared, configured);
};

const getBookedSeats = (cab) =>
  (Array.isArray(cab?.seatConfig) ? cab.seatConfig : []).filter((seat) =>
    isSeatBooked(seat)
  ).length;

const toFiniteNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

  return null;
};

const getCabId = (cab) =>
  String(
    cab?._id ?? cab?.carId ?? cab?.id ?? cab?.cabId ?? cab?.carID ?? cab?.cabID ?? ""
  ).trim();

const resolveCabBookingState = (cab) => {
  const isRunning = normalizeBool(cab?.isRunning);
  if (isRunning === false)
    return { key: "unavailable", label: "Unavailable", canBook: false };

  const totalSeats = getTotalSeats(cab);
  const bookedSeats = getBookedSeats(cab);
  if (totalSeats > 0 && bookedSeats >= totalSeats)
    return { key: "fullyBooked", label: "Full", canBook: false };

  const isAvailable = normalizeBool(cab?.isAvailable);
  if (isAvailable === false)
    return { key: "unavailable", label: "Unavailable", canBook: false };

  const status = String(cab?.runningStatus || "").trim().toLowerCase();
  if (status.includes("unavailable") || status.includes("not available"))
    return { key: "unavailable", label: "Unavailable", canBook: false };

  return { key: "available", label: "Available", canBook: true };
};

const matchesCabSearchQuery = (cab, query) => {
  if (!query) return true;
  const normalized = query.toLowerCase();
  const searchableFields = [
    cab?.make,
    cab?.model,
    cab?.vehicleNumber,
    cab?.fuelType,
    cab?.seater,
    cab?.pickupP,
    cab?.dropP,
    cab?.pickupD,
    cab?.dropD,
  ];
  return searchableFields.some((field) =>
    String(field ?? "").toLowerCase().includes(normalized)
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const FilterPill = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={{
      flexDirection: "row",
      alignItems: "center",
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: active ? "#1a1a2e" : "#f1f5f9",
      borderWidth: 1,
      borderColor: active ? "#1a1a2e" : "#e2e8f0",
      marginRight: 6,
      gap: 5,
    }}
  >
    <Feather
      name={FILTER_ICONS[label] || "circle"}
      size={11}
      color={active ? "#f59e0b" : "#64748b"}
    />
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color: active ? "#fff" : "#475569",
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const InfoBadge = ({ icon, label, iconLib = "feather" }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 4,
      marginRight: 5,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      gap: 4,
    }}
  >
    {iconLib === "feather" ? (
      <Feather name={icon} size={10} color="#64748b" />
    ) : (
      <MaterialCommunityIcons name={icon} size={11} color="#64748b" />
    )}
    <Text style={{ fontSize: 10.5, fontWeight: "600", color: "#64748b" }}>
      {label}
    </Text>
  </View>
);

const FilterInput = ({ label, value, onChangeText, placeholder, keyboardType }) => (
  <View style={{ flex: 1 }}>
    <Text
      style={{
        fontSize: 10,
        fontWeight: "700",
        color: "#94a3b8",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 5,
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#cbd5e1"
      keyboardType={keyboardType}
      style={{
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        paddingHorizontal: 11,
        fontSize: 13,
        fontWeight: "600",
        color: "#1e293b",
      }}
    />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function Cabs({ navigation }) {
  const dispatch = useDispatch();
  const { items: cabItems, status, error } = useSelector((s) => s.cab || {});

  const [route, setRoute] = useState({ pickup: "", drop: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDock, setShowFilterDock] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    make: "",
    model: "",
    vehicleNumber: "",
    fuelType: "",
    seater: "",
    pickupD: "",
    dropD: "",
  });
  const [selectedCabType, setSelectedCabType] = useState("All");
  const [isSearching, setIsSearching] = useState(false);

  const [pickupDateTime, setPickupDateTime] = useState(new Date());
  const [hasEditedPickupDateTime, setHasEditedPickupDateTime] = useState(false);
  const [openPicker, setOpenPicker] = useState(null);

  const activeDockFilterCount = useMemo(
    () => Object.values(advancedFilters).filter((v) => String(v || "").trim()).length,
    [advancedFilters]
  );

  const queryParams = useMemo(() => {
    const next = {};
    const pickup = route.pickup.trim();
    const drop = route.drop.trim();
    const q = searchQuery.trim();
    if (q) { next.q = q; next.searchQuery = q; }
    if (pickup) next.pickupP = pickup;
    if (drop) next.dropP = drop;
    if (hasEditedPickupDateTime) next.pickupD = pickupDateTime.toISOString();
    if (advancedFilters.make.trim()) next.make = advancedFilters.make.trim();
    if (advancedFilters.model.trim()) next.model = advancedFilters.model.trim();
    if (advancedFilters.vehicleNumber.trim()) next.vehicleNumber = advancedFilters.vehicleNumber.trim();
    if (advancedFilters.fuelType.trim()) next.fuelType = advancedFilters.fuelType.trim();
    if (advancedFilters.seater.trim()) next.seater = advancedFilters.seater.trim();
    if (advancedFilters.pickupD.trim()) next.pickupD = advancedFilters.pickupD.trim();
    if (advancedFilters.dropD.trim()) next.dropD = advancedFilters.dropD.trim();

    const hasServerFilters = Object.keys(next).length > 0;
    if (hasServerFilters) {
      if (selectedCabType === "Car" || selectedCabType === "Bus")
        next.vehicleType = selectedCabType.toLowerCase();
      if (selectedCabType === "Shared" || selectedCabType === "Private")
        next.sharingType = selectedCabType.toLowerCase();
    }
    return next;
  }, [route.pickup, route.drop, searchQuery, hasEditedPickupDateTime, pickupDateTime, advancedFilters, selectedCabType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(queryParams).length === 0) {
        dispatch(fetchAllCabs());
        return;
      }
      dispatch(filterCabsByQuery(queryParams));
    }, 350);
    return () => clearTimeout(timer);
  }, [dispatch, queryParams]);

  const filteredCabs = useMemo(() => {
    const pickup = route.pickup.trim().toLowerCase();
    const drop = route.drop.trim().toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    return (Array.isArray(cabItems) ? cabItems : []).filter((cab) => {
      const vehicleType = String(cab?.vehicleType || "").toLowerCase();
      const sharingType = String(cab?.sharingType || "").toLowerCase();
      if (selectedCabType === "Car" && vehicleType !== "car") return false;
      if (selectedCabType === "Bus" && vehicleType !== "bus") return false;
      if (selectedCabType === "Shared" && sharingType !== "shared") return false;
      if (selectedCabType === "Private" && sharingType !== "private") return false;
      if (pickup && !String(cab?.pickupP || "").toLowerCase().includes(pickup)) return false;
      if (drop && !String(cab?.dropP || "").toLowerCase().includes(drop)) return false;
      if (!matchesCabSearchQuery(cab, query)) return false;
      return true;
    });
  }, [cabItems, selectedCabType, route.pickup, route.drop, searchQuery]);

  const handleSwap = () => setRoute((p) => ({ pickup: p.drop, drop: p.pickup }));
  const updateAdvancedFilter = (field, value) =>
    setAdvancedFilters((prev) => ({ ...prev, [field]: value }));
  const clearAdvancedFilters = () =>
    setAdvancedFilters({ make: "", model: "", vehicleNumber: "", fuelType: "", seater: "", pickupD: "", dropD: "" });

  const runCabSearchRequest = async () => {
    if (Object.keys(queryParams).length === 0) return dispatch(fetchAllCabs());
    return dispatch(filterCabsByQuery(queryParams));
  };

  const handleCabSearch = async () => {
    setIsSearching(true);
    try { await runCabSearchRequest(); }
    finally { setTimeout(() => setIsSearching(false), 250); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <Header
        compact
        showHero={false}
        showBack
        leftTitle="Book Your Ride"
        onBackPress={() => {
          if (navigation.canGoBack()) { navigation.goBack(); return; }
          navigation.navigate("Search");
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ══════════════════════════════════════════════════
            INDEX 0 · SEARCH CARD
        ══════════════════════════════════════════════════ */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          }}
        >
          {/* ── Route Row ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              paddingHorizontal: 12,
              paddingVertical: 10,
              position: "relative",
            }}
          >
            {/* Dot-line indicator */}
            <View style={{ alignItems: "center", justifyContent: "center", marginRight: 10, paddingTop: 2 }}>
              <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: "#10b981" }} />
              <View style={{ width: 1.5, flex: 1, backgroundColor: "#cbd5e1", marginVertical: 4 }} />
              <View style={{ height: 8, width: 8, borderRadius: 2, backgroundColor: "#f43f5e" }} />
            </View>

            {/* Inputs */}
            <View style={{ flex: 1 }}>
              <TextInput
                value={route.pickup}
                onChangeText={(t) => setRoute((p) => ({ ...p, pickup: t }))}
                placeholder="Pickup location"
                placeholderTextColor="#94a3b8"
                style={{
                  height: 38,
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#0f172a",
                  padding: 0,
                }}
              />
              <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
              <TextInput
                value={route.drop}
                onChangeText={(t) => setRoute((p) => ({ ...p, drop: t }))}
                placeholder="Drop location"
                placeholderTextColor="#94a3b8"
                style={{
                  height: 38,
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#0f172a",
                  padding: 0,
                  marginTop: 2,
                }}
              />
            </View>

            {/* Swap */}
            <TouchableOpacity
              onPress={handleSwap}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                marginTop: -18,
                height: 36,
                width: 36,
                borderRadius: 9,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 3,
              }}
            >
              <Feather name="repeat" size={14} color="#1a1a2e" />
            </TouchableOpacity>
          </View>

          {/* ── Date / Time + Search ── */}
          <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
            {/* Date picker */}
            <TouchableOpacity
              onPress={() => setOpenPicker("date")}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                paddingHorizontal: 11,
              }}
            >
              <View>
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" }}>Date</Text>
                <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#0f172a", marginTop: 1 }}>
                  {formatDate(pickupDateTime)}
                </Text>
              </View>
              <Feather name="calendar" size={14} color="#1a1a2e" />
            </TouchableOpacity>

            {/* Time picker */}
            <TouchableOpacity
              onPress={() => setOpenPicker("time")}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                paddingHorizontal: 11,
              }}
            >
              <View>
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" }}>Time</Text>
                <Text style={{ fontSize: 12.5, fontWeight: "800", color: "#0f172a", marginTop: 1 }}>
                  {formatTime(pickupDateTime)}
                </Text>
              </View>
              <Feather name="clock" size={14} color="#1a1a2e" />
            </TouchableOpacity>

            {/* Search button */}
            <TouchableOpacity
              onPress={handleCabSearch}
              activeOpacity={0.85}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: "#1a1a2e",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              }}
            >
              {isSearching ? (
                <ActivityIndicator color="#f59e0b" size="small" />
              ) : (
                <>
                  <Feather name="search" size={14} color="#f59e0b" />
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.3 }}>
                    Search
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            INDEX 1 · STICKY FILTER BAR
        ══════════════════════════════════════════════════ */}
        <View
          style={{
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
            paddingTop: 10,
            paddingBottom: 10,
            zIndex: 10,
            elevation: 4,
            shadowColor: "#0f172a",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
          }}
        >
          {/* Type chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {FILTERS.map((type) => (
              <FilterPill
                key={type}
                label={type}
                active={selectedCabType === type}
                onPress={() => setSelectedCabType(type)}
              />
            ))}
          </ScrollView>

          {/* Search + filter icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              marginTop: 8,
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 38,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 9,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                paddingHorizontal: 10,
                gap: 7,
              }}
            >
              <Feather name="search" size={13} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="make, model, number..."
                placeholderTextColor="#94a3b8"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleCabSearch}
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#1e293b",
                  padding: 0,
                }}
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <Feather name="x" size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Advanced filter button */}
            <TouchableOpacity
              onPress={() => setShowFilterDock(true)}
              activeOpacity={0.8}
              style={{
                height: 38,
                width: 38,
                borderRadius: 9,
                backgroundColor: activeDockFilterCount > 0 ? "#1a1a2e" : "#f8fafc",
                borderWidth: 1,
                borderColor: activeDockFilterCount > 0 ? "#1a1a2e" : "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Feather
                name="sliders"
                size={14}
                color={activeDockFilterCount > 0 ? "#f59e0b" : "#475569"}
              />
              {activeDockFilterCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#f43f5e",
                    borderWidth: 1.5,
                    borderColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ fontSize: 8.5, fontWeight: "800", color: "#fff" }}>
                    {activeDockFilterCount > 9 ? "9+" : activeDockFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            INDEX 2 · RESULTS
        ══════════════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          {/* Result count */}
          {filteredCabs.length > 0 && status !== "loading" && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#94a3b8",
                letterSpacing: 0.5,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {filteredCabs.length} ride{filteredCabs.length !== 1 ? "s" : ""} found
            </Text>
          )}

          {status === "failed" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff1f2",
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
                gap: 6,
              }}
            >
              <Feather name="alert-circle" size={14} color="#f43f5e" />
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: "#f43f5e", flex: 1 }}>
                {error?.message || "Failed to load cabs"}
              </Text>
            </View>
          )}

          {status === "loading" && filteredCabs.length === 0 ? (
            <CabsSkeleton count={4} />
          ) : filteredCabs.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 56 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Feather name="car" size={32} color="#94a3b8" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                No rides found
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 19,
                  maxWidth: 220,
                }}
              >
                Try adjusting your route or filters to discover available cabs.
              </Text>
            </View>
          ) : (
            filteredCabs.map((cab, idx) => {
              const fare = resolveCabFare(cab);
              const seats = getTotalSeats(cab);
              const bookedSeats = getBookedSeats(cab);
              const availableSeats = seats - bookedSeats;
              const isShared = String(cab?.sharingType || "").toLowerCase() === "shared";
              const bookingState = resolveCabBookingState(cab);
              const canBook = bookingState.canBook;

              const statusStyle =
                bookingState.key === "available"
                  ? { dot: "#10b981", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" }
                  : bookingState.key === "fullyBooked"
                  ? { dot: "#f59e0b", bg: "#fffbeb", text: "#d97706", border: "#fde68a" }
                  : { dot: "#f43f5e", bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" };

              return (
                <View
                  key={getCabId(cab) || `cab-${idx}`}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    marginBottom: 12,
                    overflow: "hidden",
                    elevation: 2,
                    shadowColor: "#0f172a",
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                  }}
                >
                  {/* ── Top strip: image + info ── */}
                  <View style={{ flexDirection: "row", padding: 12 }}>
                    {/* Cab image */}
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: "#f1f5f9",
                        position: "relative",
                      }}
                    >
                      <Image
                        source={{ uri: cab?.images?.[0] || "https://via.placeholder.com/150?text=Cab" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      {/* Type tag */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: isShared ? "#1a1a2e" : "#1e293b",
                          paddingVertical: 3,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 8.5,
                            fontWeight: "800",
                            color: isShared ? "#f59e0b" : "#94a3b8",
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                          }}
                        >
                          {isShared ? "Shared" : "Private"}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: "800",
                            color: "#0f172a",
                            letterSpacing: -0.2,
                            marginRight: 8,
                          }}
                        >
                          {cab?.make} {cab?.model}
                        </Text>

                        {/* Price */}
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 }}>
                            {fare !== null ? `₹${fare.toLocaleString("en-IN")}` : "—"}
                          </Text>
                          <Text style={{ fontSize: 9.5, fontWeight: "600", color: "#94a3b8" }}>
                            {isShared ? "per seat" : "per trip"}
                          </Text>
                        </View>
                      </View>

                      {/* Badges row */}
                      <View style={{ flexDirection: "row", marginTop: 7, flexWrap: "wrap", gap: 4 }}>
                        <InfoBadge icon="truck" label={cab?.vehicleType || "Car"} />
                        <InfoBadge icon="users" label={`${seats} seats`} />
                        <InfoBadge icon="zap" label={cab?.fuelType || "Petrol"} />
                      </View>

                      {/* Route */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 8,
                          gap: 4,
                        }}
                      >
                        <View style={{ height: 5, width: 5, borderRadius: 3, backgroundColor: "#10b981" }} />
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 11, fontWeight: "700", color: "#475569", maxWidth: 75 }}
                        >
                          {cab?.pickupP || "Pickup"}
                        </Text>
                        <Feather name="arrow-right" size={10} color="#94a3b8" />
                        <View style={{ height: 5, width: 5, borderRadius: 1.5, backgroundColor: "#f43f5e" }} />
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 11, fontWeight: "700", color: "#475569", maxWidth: 75 }}
                        >
                          {cab?.dropP || "Drop"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── Divider ── */}
                  <View style={{ height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 12 }} />

                  {/* ── Bottom action row ── */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {/* Verified badge */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <MaterialCommunityIcons name="shield-check" size={13} color="#10b981" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#10b981" }}>Verified</Text>
                      </View>

                      {/* Status chip */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: statusStyle.bg,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: statusStyle.border,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          gap: 4,
                        }}
                      >
                        <View
                          style={{
                            height: 5,
                            width: 5,
                            borderRadius: 3,
                            backgroundColor: statusStyle.dot,
                          }}
                        />
                        <Text style={{ fontSize: 10.5, fontWeight: "700", color: statusStyle.text }}>
                          {bookingState.label}
                        </Text>
                        {isShared && bookingState.key === "available" && (
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#94a3b8" }}>
                            · {availableSeats} left
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Book button */}
                    <TouchableOpacity
                      disabled={!canBook}
                      onPress={() => {
                        if (!canBook) return;
                        const cabId = getCabId(cab);
                        navigation.navigate("CabDetails", { cabId: cabId || undefined, cab });
                      }}
                      activeOpacity={canBook ? 0.8 : 1}
                      style={{
                        height: 34,
                        paddingHorizontal: 16,
                        borderRadius: 9,
                        backgroundColor: canBook ? "#1a1a2e" : "#f1f5f9",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 5,
                      }}
                    >
                      {canBook && <Feather name="arrow-right-circle" size={12} color="#f59e0b" />}
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: "800",
                          color: canBook ? "#fff" : "#94a3b8",
                          letterSpacing: 0.2,
                        }}
                      >
                        {canBook ? "Book Now" : "Unavailable"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════
          ADVANCED FILTER BOTTOM SHEET
      ══════════════════════════════════════════════════ */}
      <Modal
        visible={showFilterDock}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterDock(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 24,
              maxHeight: "84%",
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#e2e8f0",
                alignSelf: "center",
                marginBottom: 14,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a" }}>
                  Advanced Filters
                </Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  Narrow down your search
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilterDock(false)}
                style={{
                  height: 34,
                  width: 34,
                  borderRadius: 9,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.8}
              >
                <Feather name="x" size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <FilterInput label="Make" value={advancedFilters.make} onChangeText={(v) => updateAdvancedFilter("make", v)} placeholder="Toyota" />
                <FilterInput label="Model" value={advancedFilters.model} onChangeText={(v) => updateAdvancedFilter("model", v)} placeholder="Innova" />
              </View>

              <View style={{ marginTop: 12 }}>
                <FilterInput label="Vehicle Number" value={advancedFilters.vehicleNumber} onChangeText={(v) => updateAdvancedFilter("vehicleNumber", v)} placeholder="UP32AB1234" />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <FilterInput label="Fuel Type" value={advancedFilters.fuelType} onChangeText={(v) => updateAdvancedFilter("fuelType", v)} placeholder="Petrol / Diesel" />
                <FilterInput label="Seater" value={advancedFilters.seater} onChangeText={(v) => updateAdvancedFilter("seater", v)} placeholder="4" keyboardType="number-pad" />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#f1f5f9",
                }}
              >
                <FilterInput label="Pickup Date" value={advancedFilters.pickupD} onChangeText={(v) => updateAdvancedFilter("pickupD", v)} placeholder="YYYY-MM-DD" />
                <FilterInput label="Drop Date" value={advancedFilters.dropD} onChangeText={(v) => updateAdvancedFilter("dropD", v)} placeholder="YYYY-MM-DD" />
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                onPress={clearAdvancedFilters}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 11,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#475569" }}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setShowFilterDock(false);
                  await handleCabSearch();
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1.5,
                  height: 44,
                  borderRadius: 11,
                  backgroundColor: "#1a1a2e",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Feather name="filter" size={13} color="#f59e0b" />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date / Time Pickers */}
      <DateTimePickerModal
        isVisible={openPicker === "date"}
        mode="date"
        date={pickupDateTime}
        onCancel={() => setOpenPicker(null)}
        onConfirm={(d) => {
          setPickupDateTime((prev) => {
            const next = new Date(prev);
            next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
            return next;
          });
          setHasEditedPickupDateTime(true);
          setOpenPicker(null);
        }}
      />
      <DateTimePickerModal
        isVisible={openPicker === "time"}
        mode="time"
        date={pickupDateTime}
        onCancel={() => setOpenPicker(null)}
        onConfirm={(d) => {
          setPickupDateTime((prev) => {
            const next = new Date(prev);
            next.setHours(d.getHours(), d.getMinutes(), 0, 0);
            return next;
          });
          setHasEditedPickupDateTime(true);
          setOpenPicker(null);
        }}
      />
    </SafeAreaView>
  );
}