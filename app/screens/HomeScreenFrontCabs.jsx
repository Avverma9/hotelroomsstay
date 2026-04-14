import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Easing,
} from "react-native";
import { router } from "../utils/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { fetchAllCabs } from "../store/slices/cabSlice";

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getFare = (cab) => {
  const isShared = String(cab?.sharingType || "").toLowerCase() === "shared";
  const seatPrices = (Array.isArray(cab?.seatConfig) ? cab.seatConfig : [])
    .map((seat) => toFiniteNumber(seat?.seatPrice))
    .filter((value) => value !== null && value >= 0);
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

const getSeatCount = (cab) => {
  const configured = Array.isArray(cab?.seatConfig) ? cab.seatConfig.length : 0;
  const seater = toNumber(cab?.seater);
  return seater > 0 ? seater : configured;
};

const isSeatBooked = (seat) => {
  const direct = normalizeBool(seat?.isBooked ?? seat?.booked ?? seat?.isSeatBooked);
  if (direct !== null) return direct;
  const status = String(seat?.status || seat?.seatStatus || "").trim().toLowerCase();
  if (status.includes("book")) return true;
  if (status.includes("open") || status.includes("available") || status.includes("vacant")) return false;
  return false;
};

const getBookedSeats = (cab) =>
  (Array.isArray(cab?.seatConfig) ? cab.seatConfig : []).filter((seat) => isSeatBooked(seat)).length;

const normalizeBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return null;
};

const getCabBookingState = (cab) => {
  const isRunning = normalizeBool(cab?.isRunning);
  if (isRunning === false) return { label: "Unavailable", tone: "rose" };

  const totalSeats = getSeatCount(cab);
  const bookedSeats = getBookedSeats(cab);
  if (totalSeats > 0 && bookedSeats >= totalSeats) {
    return { label: "Full", tone: "amber" };
  }

  const isAvailable = normalizeBool(cab?.isAvailable);
  if (isAvailable === false) return { label: "Unavailable", tone: "rose" };

  const status = String(cab?.runningStatus || "").trim().toLowerCase();
  if (status.includes("unavailable") || status.includes("not available")) {
    return { label: "Unavailable", tone: "rose" };
  }

  return { label: "Available", tone: "emerald" };
};

const formatINR = (value) => {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rs ${amount}`;
  }
};

function TinyFireIcon() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name="flame" size={13} color="#f97316" />
    </Animated.View>
  );
}

const CabCard = ({ cab, onPress }) => {
  const fare = getFare(cab);
  const seats = getSeatCount(cab);
  const bookedSeats = getBookedSeats(cab);
  const availableSeats = seats > 0 ? Math.max(seats - bookedSeats, 0) : 0;
  const image = cab?.images?.[0] || "";
  const status = getCabBookingState(cab);
  const isShared = String(cab?.sharingType || "").toLowerCase() === "shared";
  const rideTypeLabel = isShared ? "Shared" : "Private";
  const statusClasses =
    status.tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : status.tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="w-[250px] mr-4 mb-2"
    >
      <View className="bg-white rounded-[18px] shadow-sm elevation-3 border border-slate-100 overflow-hidden pb-3">
        <View className="relative">
          {image ? (
            <Image source={{ uri: image }} className="w-full h-36 bg-slate-200" resizeMode="cover" />
          ) : (
            <View className="w-full h-36 bg-slate-200 items-center justify-center">
              <Ionicons name="car-sport-outline" size={30} color="#94a3b8" />
            </View>
          )}

          <View className={`absolute top-2 right-2 px-2 py-1 rounded-full border ${statusClasses}`}>
            <Text className="text-[10px] font-extrabold">{status.label}</Text>
          </View>
        </View>

        <View className="px-3 pt-3">
          <Text className="text-slate-900 font-bold text-[15px]" numberOfLines={1}>
            {cab?.make || "Car"} {cab?.model || ""}
          </Text>

          <Text className="text-slate-500 text-[11px] font-semibold mt-0.5" numberOfLines={1}>
            {cab?.vehicleType || "Car"} | {rideTypeLabel} | {seats || 0} seats
          </Text>

          <View className="flex-row items-center mt-1.5">
            <Ionicons name="people-outline" size={12} color="#94a3b8" />
            <Text className="text-slate-500 text-[11px] font-medium ml-1" numberOfLines={1}>
              {availableSeats > 0 ? `${availableSeats} seats left` : status.label === "Full" ? "No seats left" : `${seats || 0} seats`}
            </Text>
          </View>

          <View className="flex-row items-center mt-1.5">
            <Ionicons name="location-outline" size={12} color="#94a3b8" />
            <Text className="text-slate-500 text-[11px] font-medium ml-1" numberOfLines={1}>
              {cab?.pickupP || "-"} to {cab?.dropP || "-"}
            </Text>
          </View>

          <View className="flex-row items-baseline mt-3">
            <Text className="text-[#0d3b8f] font-extrabold text-[18px]">
              {fare !== null ? formatINR(fare) : "On request"}
            </Text>
            <Text className="text-slate-500 text-[11px] font-semibold ml-1">
              {isShared ? "/ seat" : "/ trip"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreenFrontCabs() {
  const dispatch = useDispatch();
  const { items: cabItems, status, error } = useSelector((state) => state.cab || {});

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchAllCabs());
    }
  }, [dispatch, status]);

  const cabs = useMemo(() => (Array.isArray(cabItems) ? cabItems : []), [cabItems]);
  const topCabs = useMemo(() => cabs.slice(0, 4), [cabs]);

  const navigateToCabs = () => {
    router.navigate("Cabs");
  };

  return (
    <View className="flex-1 bg-white mt-1">
      <View className="px-4 pt-4">
        <View className="flex-row items-end justify-between">
          <View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Text className="text-[18px] font-extrabold text-slate-900">Our cab services</Text>
              <TinyFireIcon />
            </View>
            <Text className="text-[12px] text-slate-500 font-semibold mt-0.5">
              Live cab inventory with updated fare and route details
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={navigateToCabs}
            className="px-3 py-1.5 rounded-full bg-slate-100"
          >
            <Text className="text-[11px] font-extrabold text-slate-700">View all -></Text>
          </TouchableOpacity>
        </View>
      </View>

      {status === "loading" && topCabs.length === 0 ? (
        <View className="items-center mt-6">
          <ActivityIndicator size="small" color="#0d3b8f" />
          <Text className="text-[11px] text-slate-500 font-semibold mt-2">
            Loading cabs...
          </Text>
        </View>
      ) : status === "failed" && topCabs.length === 0 ? (
        <View className="px-4 mt-6">
          <View className="p-4 rounded-2xl bg-red-50 border border-red-100">
            <Text className="text-red-600 font-extrabold text-[13px]">
              Unable to fetch cabs
            </Text>
            <Text className="text-red-600/90 text-[12px] font-semibold mt-1">
              {String(error?.message || error || "Please try again.")}
            </Text>

            <TouchableOpacity
              onPress={() => dispatch(fetchAllCabs())}
              activeOpacity={0.85}
              className="mt-3 bg-red-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-extrabold">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : topCabs.length === 0 ? (
        <View className="px-4 mt-8 items-center">
          <View className="w-14 h-14 rounded-2xl bg-slate-100 items-center justify-center">
            <Ionicons name="car-outline" size={24} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 font-extrabold text-[14px] mt-3">
            No cabs available
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {topCabs.map((cab, idx) => (
            <CabCard
              key={cab?._id || `${cab?.make || "cab"}-${idx}`}
              cab={cab}
              onPress={navigateToCabs}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
