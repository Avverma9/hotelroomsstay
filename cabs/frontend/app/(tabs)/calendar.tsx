import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOwnerBookings, getMyCars } from "../../src/api";
import type { Booking, Car } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

type DayBucket = { date: string; bookings: Booking[] };

const DAY_WINDOW = 7;
const ACTIVE_RIDE_STATUSES = new Set(["PickupPending", "Available", "Ride in Progress"]);
const ACTIVE_BOOKING_STATUSES = new Set(["Pending", "Confirmed"]);

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const overlapsDay = (booking: Booking, day: Date) => {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  const pickup = booking.pickupD ? new Date(booking.pickupD).getTime() : booking.createdAt ? new Date(booking.createdAt).getTime() : 0;
  const drop = booking.dropD ? new Date(booking.dropD).getTime() : pickup;
  return pickup <= dayEnd && drop >= dayStart;
};

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [b, c] = await Promise.all([getOwnerBookings(user.id), getMyCars(user.id)]);
      setBookings(Array.isArray(b) ? b : []);
      setCars(Array.isArray(c) ? c : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const dayOptions = useMemo(
    () =>
      Array.from({ length: DAY_WINDOW }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  const buckets = useMemo<DayBucket[]>(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = new Date(b.pickupD || b.createdAt || Date.now()).toDateString();
      map.set(key, [...(map.get(key) || []), b]);
    }
    return [...map.entries()]
      .map(([date, items]) => ({ date, bookings: items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  const availability = useMemo(() => {
    const usableCars = cars.filter((car) => car.isAvailable !== false);
    const blockingBookings = bookings.filter(
      (b) => ACTIVE_BOOKING_STATUSES.has(b.bookingStatus || "") || ACTIVE_RIDE_STATUSES.has(b.rideStatus || ""),
    );
    const blockedCarIds = new Set(
      blockingBookings.filter((b) => overlapsDay(b, selectedDate)).map((b) => String(b.carId)),
    );
    const availableCars = usableCars.filter((car) => !blockedCarIds.has(String(car._id)));
    const dayBookings = bookings.filter((b) => overlapsDay(b, selectedDate));
    return {
      availableCars,
      blockedCars: usableCars.length - availableCars.length,
      dayBookings,
      totalCars: usableCars.length,
    };
  }, [bookings, cars, selectedDate]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Date-wise availability and booking checks</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/(tabs)/my-ride")}>
          <Text style={styles.ctaText}>My Ride</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={buckets}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
                {dayOptions.map((d) => {
                  const isActive = d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={d.toDateString()}
                      style={[styles.dayChip, isActive && styles.dayChipActive]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[styles.dayChipLabel, isActive && styles.dayChipLabelActive]}>
                        {d.toLocaleDateString(undefined, { weekday: "short" })}
                      </Text>
                      <Text style={[styles.dayChipValue, isActive && styles.dayChipValueActive]}>
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.summary}>
                <SummaryCard label="Cars" value={availability.totalCars} />
                <SummaryCard label="Free" value={availability.availableCars.length} />
                <SummaryCard label="Blocked" value={availability.blockedCars} />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            item.date === selectedDate.toDateString() ? (
              <View style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{item.date}</Text>
                  <Text style={styles.dayCount}>{availability.dayBookings.length} rides</Text>
                </View>
                <View style={styles.availabilityCard}>
                  <View style={styles.availabilityRow}>
                    <Text style={styles.availabilityLabel}>Available cars</Text>
                    <Text style={styles.availabilityValue}>{availability.availableCars.length}</Text>
                  </View>
                  <View style={styles.availabilityRow}>
                    <Text style={styles.availabilityLabel}>Booked / blocked</Text>
                    <Text style={styles.availabilityValue}>{availability.blockedCars}</Text>
                  </View>
                </View>
                <View style={{ gap: 10, marginTop: spacing.sm }}>
                  {availability.dayBookings.slice(0, 4).map((b) => {
                    const cfg = statusColors[b.rideStatus || "PickupPending"] || { bg: "#F1F5F9", text: "#64748B" };
                    return (
                      <TouchableOpacity key={b._id} style={styles.row} onPress={() => router.push({ pathname: "/booking/[id]", params: { id: b._id, data: JSON.stringify(b) } })}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowTitle}>{b.make || b.carDetails?.make || "—"} {b.model || b.carDetails?.model || ""}</Text>
                          <Text style={styles.rowMeta}>{b.pickupP || "—"} → {b.dropP || "—"}</Text>
                        </View>
                        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.pillText, { color: cfg.text }]}>{b.rideStatus || "PickupPending"}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={52} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No calendar entries</Text>
              <Text style={styles.emptyText}>Book some rides to see date-wise availability here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 12 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cta: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  ctaText: { color: colors.primary, fontWeight: "800" },
  dayStrip: { gap: 10, paddingBottom: spacing.sm },
  dayChip: { minWidth: 62, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.surface, alignItems: "center" },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },
  dayChipLabelActive: { color: "#fff" },
  dayChipValue: { fontSize: 18, color: colors.text, fontWeight: "800", marginTop: 2 },
  dayChipValueActive: { color: "#fff" },
  summary: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "700" },
  dayCard: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.md },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  dayTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  dayCount: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  availabilityCard: { backgroundColor: colors.inputBg, borderRadius: radii.xl, padding: spacing.md, gap: 8, marginBottom: spacing.sm },
  availabilityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  availabilityLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  availabilityValue: { color: colors.text, fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", padding: spacing.xl, marginTop: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 8 },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: 4 },
});
