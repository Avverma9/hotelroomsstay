/**
 * Ride Bookings & Stats — per-car, rider-only view.
 * Tabs: Bookings | Seats | Stats
 * Accessed from cars/[id]/index → "View Bookings" button.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  changeBookingStatus,
  getBookingsByCar,
  getCarById,
  getCarRideHistory,
  releaseSeat,
} from "../../../src/api";
import type {
  Booking,
  BookingsByCarResponse,
  Car,
  RideHistoryByCarResponse,
  RideHistoryEvent,
  Seat,
} from "../../../src/api";
import { colors, radii, spacing, statusColors } from "../../../src/theme";

type Tab = "bookings" | "seats" | "stats";
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "bookings", label: "Bookings", icon: "receipt-outline" },
  { key: "seats",    label: "Seats",    icon: "grid-outline" },
  { key: "stats",    label: "Stats",    icon: "bar-chart-outline" },
];
const BOOKING_FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "Failed"];

export default function CarBookingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [car, setCar] = useState<Car | null>(null);
  const [bookingsData, setBookingsData] = useState<BookingsByCarResponse | null>(null);
  const [rideHistoryData, setRideHistoryData] = useState<RideHistoryByCarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("All");
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchAllRideHistory = useCallback(async (carId: string): Promise<RideHistoryByCarResponse | null> => {
    const pageSize = 100;
    const first = await getCarRideHistory(carId, 1, pageSize);
    const total = Math.max(0, Number(first?.total || 0));
    const allItems = Array.isArray(first?.items) ? [...first.items] : [];

    if (total <= allItems.length) {
      return { ...first, items: allItems };
    }

    const totalPages = Math.min(50, Math.ceil(total / pageSize));
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await getCarRideHistory(carId, page, pageSize);
      const nextItems = Array.isArray(next?.items) ? next.items : [];
      allItems.push(...nextItems);
      if (allItems.length >= total) break;
    }

    return {
      ...first,
      items: allItems,
      total,
      page: 1,
      limit: allItems.length,
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [carRes, bRes, historyRes] = await Promise.allSettled([
        getCarById(id),
        getBookingsByCar(id, { limit: 100 }),
        fetchAllRideHistory(id),
      ]);
      if (carRes.status === "fulfilled") setCar(carRes.value);
      if (carRes.status === "rejected") setCar(null);

      if (bRes.status === "fulfilled") setBookingsData(bRes.value);
      if (bRes.status === "rejected") setBookingsData(null);

      if (historyRes.status === "fulfilled") setRideHistoryData(historyRes.value);
      if (historyRes.status === "rejected") setRideHistoryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, fetchAllRideHistory]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const bookings: (Booking & { seatDetails?: Seat[] })[] = bookingsData?.bookings ?? [];

  const filteredBookings = useMemo(() =>
    bookingFilter === "All" ? bookings : bookings.filter((b) => b.bookingStatus === bookingFilter),
    [bookings, bookingFilter]);

  const handleBookingAction = async (bookingId: string, status: string) => {
    setActioning(bookingId);
    try {
      await changeBookingStatus(bookingId, status);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Action failed");
    } finally {
      setActioning(null);
    }
  };

  const handleReleaseSeat = (seat: Seat) => {
    if (!car) return;
    Alert.alert(
      "Seat Release",
      `Seat #${seat.seatNumber} release karna chahte hain?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: async () => {
            setActioning(seat._id);
            try {
              await releaseSeat(car._id, seat._id);
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.message || "Could not release seat");
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {car ? `${car.make} ${car.model}` : "Ride Management"}
          </Text>
          <Text style={styles.headerSub}>{car?.vehicleNumber || "—"} · {bookings.length} booking(s)</Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={15} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeTab === "bookings" && (
        <BookingsTab
          bookings={filteredBookings}
          filter={bookingFilter}
          onFilterChange={setBookingFilter}
          onBookingPress={(b) =>
            router.push({ pathname: "/booking/[id]", params: { id: b._id, data: JSON.stringify(b) } } as any)
          }
          onAction={handleBookingAction}
          actioning={actioning}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
        />
      )}
      {activeTab === "seats" && car && (
        <SeatsTab
          seatConfig={car.seatConfig || []}
          onRelease={handleReleaseSeat}
          actioning={actioning}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          onManageAll={() => router.push(`/cars/${car._id}/seats` as any)}
        />
      )}
      {activeTab === "stats" && (
        <StatsTab rideHistoryData={rideHistoryData} />
      )}
    </SafeAreaView>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab({ bookings, filter, onFilterChange, onBookingPress, onAction, actioning, refreshing, onRefresh }: {
  bookings: (Booking & { seatDetails?: Seat[] })[];
  filter: string; onFilterChange: (f: string) => void;
  onBookingPress: (b: Booking) => void;
  onAction: (id: string, status: string) => void;
  actioning: string | null; refreshing: boolean; onRefresh: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterContent}
      >
        {BOOKING_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => onFilterChange(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={bookings}
        keyExtractor={(b) => b._id}
        contentContainerStyle={styles.listPad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyText}>Koi booking nahi mili</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bookingCard} onPress={() => onBookingPress(item)} activeOpacity={0.85}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.passengerName} numberOfLines={1}>
                  {item.passengerName || item.bookedBy || "—"}
                </Text>
                <Text style={styles.bookingId}>#{item.bookingId || item._id?.slice(-8)}</Text>
              </View>
              <StatusChip status={item.bookingStatus || "Pending"} />
            </View>

            <View style={styles.chipRow}>
              <SmallChip icon="call-outline"   value={item.customerMobile || "—"} />
              <SmallChip icon="people-outline" value={`${item.totalSeatsBooked ?? (item.seats as any[])?.length ?? 1} seat(s)`} />
              <SmallChip icon="cash-outline"   value={`₹${item.price ?? item.basePrice ?? 0}`} />
              {item.isPaid && <SmallChip icon="checkmark-circle-outline" value="Paid" color="#059669" />}
            </View>

            {item.rideStatus && (
              <View style={styles.chipRow}>
                <SmallChip icon="navigate-circle-outline" value={item.rideStatus} />
              </View>
            )}

            {item.createdAt && (
              <Text style={styles.bookingDate}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                {" "}
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}

            {item.bookingStatus === "Pending" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#D1FAE5", borderColor: "#059669" }]}
                  onPress={() => onAction(item._id, "Confirmed")}
                  disabled={actioning === item._id}
                >
                  {actioning === item._id
                    ? <ActivityIndicator size="small" color="#059669" />
                    : <Text style={[styles.actionBtnText, { color: "#059669" }]}>Confirm</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#FEE2E2", borderColor: "#DC2626" }]}
                  onPress={() => onAction(item._id, "Cancelled")}
                  disabled={actioning === item._id}
                >
                  <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ─── Seats Tab ────────────────────────────────────────────────────────────────
function SeatsTab({ seatConfig, onRelease, actioning, refreshing, onRefresh, onManageAll }: {
  seatConfig: Seat[]; onRelease: (s: Seat) => void;
  actioning: string | null; refreshing: boolean; onRefresh: () => void;
  onManageAll: () => void;
}) {
  const booked = seatConfig.filter((s) => s.isBooked);
  const free   = seatConfig.filter((s) => !s.isBooked);

  return (
    <ScrollView
      style={{ flex: 1 }} contentContainerStyle={styles.listPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Occupancy summary */}
      <View style={styles.occupancyRow}>
        <OccupancyChip label="Total"  value={seatConfig.length} color={colors.primary} />
        <OccupancyChip label="Booked" value={booked.length}     color="#DC2626" />
        <OccupancyChip label="Free"   value={free.length}       color="#059669" />
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <LegendDot color="#DC2626" label="Booked (tap to release)" />
        <LegendDot color="#059669" label="Free" />
      </View>

      {/* Seat grid */}
      <View style={styles.seatGrid}>
        {seatConfig.map((seat) => (
          <TouchableOpacity
            key={seat._id}
            style={[styles.seatCell, seat.isBooked ? styles.seatBooked : styles.seatFree]}
            onPress={() => seat.isBooked && onRelease(seat)}
            disabled={!seat.isBooked || actioning === seat._id}
            activeOpacity={seat.isBooked ? 0.7 : 1}
          >
            {actioning === seat._id
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="person-outline" size={15} color={seat.isBooked ? "#fff" : colors.textMuted} />
                  <Text style={[styles.seatNum, seat.isBooked && { color: "#fff" }]}>{seat.seatNumber ?? "?"}</Text>
                  <Text style={[styles.seatPrice, seat.isBooked && { color: "#ffd" }]}>₹{seat.seatPrice ?? 0}</Text>
                </>
            }
          </TouchableOpacity>
        ))}
      </View>

      {/* Booked seats list */}
      {booked.length > 0 && (
        <>
          <Text style={styles.seatSectionLabel}>Booked Seats ({booked.length})</Text>
          {booked.map((seat) => (
            <View key={seat._id} style={styles.seatRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.seatRowNum}>Seat #{seat.seatNumber}</Text>
                <Text style={styles.seatRowBy} numberOfLines={1}>Booked by: {seat.bookedBy || "—"}</Text>
              </View>
              <Text style={styles.seatRowPrice}>₹{seat.seatPrice ?? 0}</Text>
              <TouchableOpacity
                style={styles.releaseBtn}
                onPress={() => onRelease(seat)}
                disabled={actioning === seat._id}
              >
                {actioning === seat._id
                  ? <ActivityIndicator size="small" color="#DC2626" />
                  : <Text style={styles.releaseBtnText}>Release</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Full seat manager link */}
      <TouchableOpacity style={styles.manageAllBtn} onPress={onManageAll}>
        <Ionicons name="settings-outline" size={16} color={colors.primary} />
        <Text style={styles.manageAllText}>Full Seat Manager (Edit Prices)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ rideHistoryData }: { rideHistoryData: RideHistoryByCarResponse | null }) {
  const [range, setRange] = useState<"ALL" | "7D" | "30D" | "90D">("ALL");

  const items = rideHistoryData?.items ?? [];
  const filteredItems = useMemo(() => {
    if (range === "ALL") return items;

    const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      if (!item.createdAt) return false;
      const ts = new Date(item.createdAt).getTime();
      if (Number.isNaN(ts)) return false;
      return ts >= cutoff;
    });
  }, [items, range]);

  const routeChanges = filteredItems.filter((item) => item.eventType === "ROUTE_CHANGED");
  const newRides = filteredItems.filter((item) => item.eventType === "NEW_RIDE");
  const stats = rideHistoryData?.stats ?? {
    totalEvents: 0,
    newRideCount: 0,
    routeChangeCount: 0,
  };

  const effectiveStats = {
    totalEvents: range === "ALL" ? stats.totalEvents : filteredItems.length,
    newRideCount: range === "ALL" ? stats.newRideCount : newRides.length,
    routeChangeCount: range === "ALL" ? stats.routeChangeCount : routeChanges.length,
  };

  const byDate: Record<string, number> = {};
  filteredItems.forEach((item) => {
    if (!item.createdAt) return;
    const d = new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    byDate[d] = (byDate[d] || 0) + 1;
  });
  const dateEntries = Object.entries(byDate).slice(-7);
  const maxCount = Math.max(...dateEntries.map(([, c]) => c), 1);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listPad}>
      <View style={styles.statsFilterWrap}>
        {[
          { key: "ALL", label: "All" },
          { key: "7D", label: "7 Days" },
          { key: "30D", label: "30 Days" },
          { key: "90D", label: "90 Days" },
        ].map((opt) => {
          const active = range === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.statsFilterChip, active && styles.statsFilterChipActive]}
              onPress={() => setRange(opt.key as any)}
            >
              <Text style={[styles.statsFilterText, active && styles.statsFilterTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stat grid */}
      <View style={styles.statsGrid}>
        <StatBox label="Total Events" value={effectiveStats.totalEvents} color={colors.primary} bg={colors.primarySoft} />
        <StatBox label="New Rides" value={effectiveStats.newRideCount} color="#059669" bg="#D1FAE5" />
        <StatBox label="Route Changes" value={effectiveStats.routeChangeCount} color="#D97706" bg="#FEF3C7" />
        <StatBox label="Fetched" value={filteredItems.length} color="#6366F1" bg="#EEF2FF" />
      </View>

      {/* Route change full details */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>Route Change Full History</Text>
        {routeChanges.length === 0 ? (
          <Text style={styles.revenueLabel}>Abhi tak koi route change record nahi hai.</Text>
        ) : (
          routeChanges.map((item) => <RouteChangeDetailRow key={item._id} item={item} />)
        )}
      </View>

      {/* New rides quick list */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>New Ride History</Text>
        {newRides.length === 0 ? (
          <Text style={styles.revenueLabel}>Abhi tak koi new ride record nahi hai.</Text>
        ) : (
          newRides.slice(0, 10).map((item) => <RideHistoryRow key={item._id} item={item} />)
        )}
      </View>

      {/* Event trend */}
      {dateEntries.length > 0 && (
        <View style={styles.trendCard}>
          <Text style={styles.revenueTitle}>Event Trend ({range === "ALL" ? "all data" : range.toLowerCase()})</Text>
          {dateEntries.map(([date, count]) => (
            <View key={date} style={styles.trendRow}>
              <Text style={styles.trendDate}>{date}</Text>
              <View style={styles.trendBarWrap}>
                <View style={[styles.trendBar, { width: `${Math.round((count / maxCount) * 100)}%` }]} />
              </View>
              <Text style={styles.trendCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function RideHistoryRow({ item }: { item: RideHistoryEvent }) {
  const isRouteChanged = item.eventType === "ROUTE_CHANGED";
  const title = isRouteChanged ? "Route Changed" : "New Ride Created";

  const prev = item.previousRoute;
  const next = item.newRoute || item.route;
  const routeText = isRouteChanged
    ? `${prev?.pickupP || "-"} -> ${prev?.dropP || "-"} to ${next?.pickupP || "-"} -> ${next?.dropP || "-"}`
    : `${item.route?.pickupP || "-"} -> ${item.route?.dropP || "-"}`;

  return (
    <View style={styles.revenueRow}>
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={[styles.revenueLabel, { color: colors.text, fontWeight: "700" }]}>{title}</Text>
        <Text style={styles.bookingDate} numberOfLines={1}>{routeText}</Text>
      </View>
      <Text style={[styles.revenueValue, { color: isRouteChanged ? "#D97706" : "#059669" }]}>#{item.bookingCode || item._id.slice(-5)}</Text>
    </View>
  );
}

function RouteChangeDetailRow({ item }: { item: RideHistoryEvent }) {
  const prev = item.previousRoute || {};
  const next = item.newRoute || item.route || {};

  const fmt = (v?: string) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

  return (
    <View style={[styles.revenueRow, { flexDirection: "column", alignItems: "flex-start", gap: 4, borderBottomColor: colors.border }]}> 
      <Text style={[styles.revenueLabel, { color: colors.text, fontWeight: "800" }]}>Route Changed • #{item.bookingCode || item._id.slice(-5)}</Text>
      <Text style={styles.bookingDate}>Changed At: {fmt(item.createdAt)}</Text>
      <Text style={styles.bookingDate}>Old Route: {prev.pickupP || "-"} -> {prev.dropP || "-"}</Text>
      <Text style={styles.bookingDate}>Old Date: {fmt(prev.pickupD)} -> {fmt(prev.dropD)}</Text>
      <Text style={styles.bookingDate}>New Route: {next.pickupP || "-"} -> {next.dropP || "-"}</Text>
      <Text style={styles.bookingDate}>New Date: {fmt(next.pickupD)} -> {fmt(next.dropD)}</Text>
    </View>
  );
}

// ─── Shared helper components ─────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const cfg = statusColors[status] || { bg: "#F1F5F9", text: "#64748B" };
  return (
    <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusChipText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

function SmallChip({ icon, value, color }: { icon: string; value: string; color?: string }) {
  return (
    <View style={styles.smallChip}>
      <Ionicons name={icon as any} size={11} color={color || colors.textMuted} />
      <Text style={[styles.smallChipText, color ? { color } : {}]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function OccupancyChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.occChip}>
      <Text style={[styles.occValue, { color }]}>{value}</Text>
      <Text style={styles.occLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: number | string; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create<any>({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listPad: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  headerSub:   { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  tabBarScroll:   { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBarContent:  { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: "center" },
  tabBtn:         { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive:   { borderBottomColor: colors.primary },
  tabLabel:       { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabLabelActive: { color: colors.primary },

  filterScroll:        { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent:       { paddingHorizontal: spacing.md, gap: spacing.xs, alignItems: "center" },
  filterChip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive:    { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterChipText:      { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  filterChipTextActive:{ color: colors.primary },

  bookingCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md,
    shadowColor: "#0A1128", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  rowBetween:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  passengerName: { fontSize: 15, fontWeight: "700", color: colors.text },
  bookingId:     { fontSize: 11, color: colors.textMuted, fontFamily: "monospace", marginTop: 1 },
  chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 5 },
  smallChip:     { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.inputBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  smallChipText: { fontSize: 11, color: colors.textMuted },
  bookingDate:   { fontSize: 11, color: colors.textLight, marginTop: 6 },
  statusChip:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusChipText:{ fontSize: 11, fontWeight: "700" },
  actionRow:     { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  actionBtn:     { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: "center", borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
  emptyWrap:     { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText:     { color: colors.textMuted, fontSize: 14 },

  occupancyRow:  { flexDirection: "row", justifyContent: "space-around", marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radii.xl, paddingVertical: spacing.md },
  occChip:       { alignItems: "center" },
  occValue:      { fontSize: 24, fontWeight: "800" },
  occLabel:      { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  legendRow:     { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.md },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendLabel:   { fontSize: 12, color: colors.textMuted },

  seatGrid:      { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  seatCell:      { width: 72, height: 78, borderRadius: radii.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  seatBooked:    { backgroundColor: "#DC2626", borderColor: "#B91C1C" },
  seatFree:      { backgroundColor: "#F0FDF4", borderColor: "#A7F3D0" },
  seatNum:       { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 2 },
  seatPrice:     { fontSize: 10, color: colors.textMuted },
  seatSectionLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  seatRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.xs,
  },
  seatRowNum:   { fontSize: 14, fontWeight: "700", color: colors.text },
  seatRowBy:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  seatRowPrice: { fontSize: 14, fontWeight: "700", color: colors.primary, marginRight: spacing.sm },
  releaseBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#DC2626" },
  releaseBtnText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
  manageAllBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md, justifyContent: "center", paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.primary },
  manageAllText:{ fontSize: 13, fontWeight: "700", color: colors.primary },

  statsFilterWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  statsFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statsFilterChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  statsFilterText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  statsFilterTextActive: { color: colors.primary },

  statsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  statBox:    { width: "47.5%", borderRadius: radii.xl, padding: spacing.md, alignItems: "center" },
  statBoxValue:{ fontSize: 24, fontWeight: "800" },
  statBoxLabel:{ fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: "center" },

  revenueCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  revenueTitle:{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  revenueRow:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border + "60" },
  revenueLabel:{ fontSize: 13, color: colors.textMuted },
  revenueValue:{ fontSize: 14, fontWeight: "700" },

  trendCard:  { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md },
  trendRow:   { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  trendDate:  { width: 56, fontSize: 11, color: colors.textMuted },
  trendBarWrap:{ flex: 1, height: 12, backgroundColor: colors.inputBg, borderRadius: 6, overflow: "hidden" },
  trendBar:   { height: 12, backgroundColor: colors.primary, borderRadius: 6 },
  trendCount: { width: 20, fontSize: 11, fontWeight: "700", color: colors.text, textAlign: "right" },
});
