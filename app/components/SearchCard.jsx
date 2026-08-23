import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../utils/api";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getCleanToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateLabel = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
};

const CalendarPickerModal = ({ visible, checkIn, checkOut, onSave, onClose }) => {
  const today = getCleanToday();

  const [inDate, setInDate] = useState(
    checkIn ? new Date(checkIn).setHours(0, 0, 0, 0) : today.getTime()
  );
  const [outDate, setOutDate] = useState(
    checkOut
      ? new Date(checkOut).setHours(0, 0, 0, 0)
      : today.getTime() + 86400000
  );

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    const target = new Date(viewYear, viewMonth, day, 0, 0, 0, 0).getTime();
    if (target < today.getTime()) return;

    if (!inDate || (inDate && outDate)) {
      setInDate(target);
      setOutDate(null);
    } else if (inDate && !outDate) {
      if (target > inDate) {
        setOutDate(target);
      } else {
        setInDate(target);
        setOutDate(null);
      }
    }
  };

  const calculateNights = () => {
    if (inDate && outDate) {
      return Math.round((outDate - inDate) / 86400000);
    }
    return 0;
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(i);
  }

  const isPrevDisabled =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

          <View style={{ flexDirection: "row", justifyContent: "between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>Select Dates</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563EB", marginTop: 2 }}>
                {!inDate ? "Choose Check-in" : !outDate ? "Choose Check-out" : `${calculateNights()} Night(s) Stay`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 16, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" }}>
            <View style={{ flex: 1, padding: 8, borderRadius: 12, backgroundColor: inDate && !outDate ? "#FFFFFF" : "transparent" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#94A3B8" }}>CHECK-IN</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B", marginTop: 2 }}>{inDate ? formatDateLabel(inDate) : "--"}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#E2E8F0", marginVertical: 4 }} />
            <View style={{ flex: 1, padding: 8, borderRadius: 12, backgroundColor: inDate && outDate ? "#FFFFFF" : "transparent" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#94A3B8" }}>CHECK-OUT</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B", marginTop: 2 }}>{outDate ? formatDateLabel(outDate) : "--"}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={handlePrev}
                disabled={isPrevDisabled}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 8, opacity: isPrevDisabled ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-back" size={16} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="chevron-forward" size={16} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <Text key={i} style={{ width: 40, textAlign: "center", fontSize: 12, fontWeight: "600", color: "#94A3B8" }}>{d}</Text>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((day, idx) => {
              if (!day) return <View key={idx} style={{ width: "14.28%", height: 40 }} />;

              const thisTime = new Date(viewYear, viewMonth, day, 0, 0, 0, 0).getTime();
              const isPast = thisTime < today.getTime();
              const isStart = inDate === thisTime;
              const isEnd = outDate === thisTime;
              const inRange = inDate && outDate && thisTime > inDate && thisTime < outDate;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  disabled={isPast}
                  onPress={() => handleSelectDay(day)}
                  style={{
                    width: "14.28%",
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: inRange ? "#EFF6FF" : isStart && outDate ? "#EFF6FF" : isEnd ? "#EFF6FF" : "transparent",
                    borderTopLeftRadius: isStart ? 20 : 0,
                    borderBottomLeftRadius: isStart ? 20 : 0,
                    borderTopRightRadius: isEnd ? 20 : 0,
                    borderBottomRightRadius: isEnd ? 20 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: isStart || isEnd ? "#2563EB" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isStart || isEnd || inRange ? "700" : "500",
                        color: isPast ? "#CBD5E1" : isStart || isEnd ? "#FFFFFF" : inRange ? "#2563EB" : "#1E293B",
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            disabled={!inDate || !outDate}
            onPress={() => {
              onSave(new Date(inDate), new Date(outDate));
              onClose();
            }}
            style={{
              marginTop: 18,
              height: 48,
              borderRadius: 16,
              backgroundColor: inDate && outDate ? "#2563EB" : "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: inDate && outDate ? "#FFFFFF" : "#94A3B8" }}>
              Apply Dates
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const SearchCard = ({
  searchCity,
  setSearchCity,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guests = 2,
  setGuests,
  rooms = 1,
  setRooms,
  isSearching = false,
  onSearch,
  isLocatingCurrentLocation = false,
  onUseCurrentLocation = () => {},
}) => {
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const selectedSuggestionRef = useRef("");

  useEffect(() => {
    const query = String(searchCity || "").trim();
    if (query.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    if (selectedSuggestionRef.current === query) {
      setSuggestions([]);
      return undefined;
    }
    selectedSuggestionRef.current = "";

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!cancelled) setSuggestionsLoading(true);
        const response = await api.get("/hotels/suggestions", { params: { q: query, limit: 8 } });
        if (!cancelled) setSuggestions(response?.data?.data || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchCity]);

  const safeCheckIn = checkInDate || new Date();
  const safeCheckOut = checkOutDate || new Date(Date.now() + 86400000);

  const handleAddGuest = () => {
    const next = guests + 1;
    setGuests(next);
    if (next > rooms * 3) {
      setRooms(Math.ceil(next / 3));
    }
  };

  const handleRemoveGuest = () => {
    if (guests > 1) {
      const next = guests - 1;
      setGuests(next);
      if (rooms > next) {
        setRooms(next);
      }
    }
  };

  const handleAddRoom = () => {
    const next = rooms + 1;
    setRooms(next);
    if (guests < next) {
      setGuests(next);
    }
  };

  const handleRemoveRoom = () => {
    if (rooms > 1) {
      const next = rooms - 1;
      setRooms(next);
      if (guests > next * 3) {
        setGuests(next * 3);
      }
    }
  };

  return (
    <>
      <View
        style={{
          marginTop: -24,
          marginHorizontal: 16,
          padding: 14,
          borderRadius: 24,
          position: "relative",
          zIndex: 20,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#F1F5F9",
          elevation: 6,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            height: 50,
            borderRadius: 16,
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search-outline" size={19} color="#64748B" />
          <TextInput
            placeholder="Where are you going?"
            placeholderTextColor="#94A3B8"
            value={searchCity}
            onChangeText={setSearchCity}
            style={{ flex: 1, fontSize: 14, fontWeight: "500", color: "#0F172A", marginLeft: 8, paddingVertical: 0 }}
            returnKeyType="search"
          />

          {!!searchCity && (
            <TouchableOpacity
              onPress={() => setSearchCity("")}
              style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginRight: 8 }}
            >
              <Ionicons name="close" size={12} color="#64748B" />
            </TouchableOpacity>
          )}

          {suggestionsLoading && <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />}

          <TouchableOpacity
            onPress={onUseCurrentLocation}
            disabled={isLocatingCurrentLocation}
            style={{ flexDirection: "row", alignItems: "center", borderLeftWidth: 1, borderLeftColor: "#CBD5E1", paddingLeft: 8 }}
          >
            {isLocatingCurrentLocation ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Ionicons name="navigate-circle-outline" size={18} color="#2563EB" />
            )}
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#2563EB", marginLeft: 4 }}>
              {isLocatingCurrentLocation ? "..." : "Near me"}
            </Text>
          </TouchableOpacity>
        </View>

        {!!suggestions.length && (
          <View style={{ position: "absolute", top: 68, left: 14, right: 14, zIndex: 100, elevation: 18, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 14 }}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                onPress={() => {
                  selectedSuggestionRef.current = suggestion.value;
                  setSearchCity(suggestion.value);
                  setSuggestions([]);
                }}
                activeOpacity={0.75}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: index === suggestions.length - 1 ? 0 : 1, borderBottomColor: "#F1F5F9" }}
              >
                <Ionicons name={suggestion.type === "hotel" ? "business-outline" : "location-outline"} size={17} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: "#1E293B", fontSize: 13, fontWeight: "700" }}>{suggestion.label}</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>{suggestion.type === "hotel" ? "Hotel" : "Destination"}</Text>
                </View>
                <Ionicons name="arrow-up-outline" size={15} color="#94A3B8" style={{ transform: [{ rotate: "45deg" }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setShowDateModal(true)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 16,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="calendar-outline" size={17} color="#2563EB" />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: "#1E293B", marginLeft: 8 }} numberOfLines={1}>
              {formatDateLabel(safeCheckIn)} - {formatDateLabel(safeCheckOut)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowGuestModal(true)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 16,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="people-outline" size={17} color="#2563EB" />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: "#1E293B", marginLeft: 8 }} numberOfLines={1}>
              {guests} Guest{guests > 1 ? "s" : ""} • {rooms} Room{rooms > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={isSearching ? null : onSearch}
          disabled={isSearching}
          style={{ marginTop: 12, height: 48, borderRadius: 16, overflow: "hidden", justifyContent: "center", alignItems: "center" }}
        >
          <LinearGradient
            colors={isSearching ? ["#64748B", "#3B82F6"] : ["#1D4ED8", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          {isSearching ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14, marginLeft: 8 }}>Searching...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="search" size={17} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14, marginLeft: 8 }}>Search Hotels</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <CalendarPickerModal
        visible={showDateModal}
        checkIn={safeCheckIn}
        checkOut={safeCheckOut}
        onSave={(cin, cout) => {
          if (setCheckInDate) setCheckInDate(cin);
          if (setCheckOutDate) setCheckOutDate(cout);
        }}
        onClose={() => setShowDateModal(false)}
      />

      <Modal visible={showGuestModal} transparent animationType="slide" onRequestClose={() => setShowGuestModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>Guests & Rooms</Text>
              <TouchableOpacity onPress={() => setShowGuestModal(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Max 3 guests per room</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>Guests</Text>
                <Text style={{ fontSize: 12, color: "#94A3B8" }}>Total count</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handleRemoveGuest}
                  disabled={guests <= 1}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", opacity: guests <= 1 ? 0.4 : 1 }}
                >
                  <Ionicons name="remove" size={16} color="#0F172A" />
                </TouchableOpacity>
                <Text style={{ width: 36, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#0F172A" }}>{guests}</Text>
                <TouchableOpacity
                  onPress={handleAddGuest}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B" }}>Rooms</Text>
                <Text style={{ fontSize: 12, color: "#94A3B8" }}>Min {Math.ceil(guests / 3)} required</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handleRemoveRoom}
                  disabled={rooms <= 1}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", opacity: rooms <= 1 ? 0.4 : 1 }}
                >
                  <Ionicons name="remove" size={16} color="#0F172A" />
                </TouchableOpacity>
                <Text style={{ width: 36, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#0F172A" }}>{rooms}</Text>
                <TouchableOpacity
                  onPress={handleAddRoom}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowGuestModal(false)}
              style={{ marginTop: 20, height: 48, borderRadius: 16, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SearchCard;
