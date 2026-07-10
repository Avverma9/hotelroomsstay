/**
 * Ride History — per-vehicle completed ride log.
 * Route: /cars/ride-history?carId=xxx&carName=xxx
 *
 * Shows all *completed* rides for the vehicle with:
 *  - Lifetime stats (total rides, revenue, passengers)
 *  - Chronological list with route, passenger, price, codes
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCarRideHistory, type Booking } from "../../src/api";
import { formatRange } from "../../src/availability";
import { colors, radii, spacing } from "../../src/theme";

const RIDE_STATUS_COLOR: Record<string, string> = {
  "Ride Completed": colors.success,
  Completed: colors.success,
  Cancelled: "#DC2626",
  Failed: "#DC2626",
};

export default function RideHistoryScreen() {
  const router = useRouter();
  const { carId, carName } = useLocalSearchParams<{
    carId: string;
    carName?: string;
  }>();

  const [rides, setRides] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRides = useCallback(
    async (reset = false) => {
      if (!carId) return;
      const nextPage = reset ? 1 : page;
      if (!reset) setLoadingMore(true);
      else { setLoading(true); setError(""); }

      try {
        const result = await getCarRideHistory(carId, nextPage, 20);
        const incoming = result.bookings ?? [];
        setTotal(result.total ?? 0);
        setRides((prev) => (reset ? incoming : [...prev, ...incoming]));
        if (!reset) setPage((p) => p + 1);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load ride history");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [carId, page]
  );

  useEffect(() => {
    fetchRides(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchRides(true);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = rides.reduce((sum, r) => sum + (r.price ?? 0), 0);
  const totalPassengers = rides.reduce(
    (sum, r) => sum + (r.totalSeatsBooked ?? 1),
    0
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/cars/my-rides" as any)
          }
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ride History</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {carName || "Your Vehicle"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRides(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <StatsHeader
              total={total}
              revenue={totalRevenue}
              passengers={totalPassengers}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="time-outline"
                size={52}
                color={colors.textLight}
              />
              <Text style={styles.emptyTitle}>No completed rides yet</Text>
              <Text style={styles.emptyText}>
                Completed rides will appear here with full journey details.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          onEndReached={() => {
            if (!loadingMore && rides.length < total) fetchRides();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <RideCard ride={item} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Stats header ──────────────────────────────────────────────────────────

function StatsHeader({
  total,
  revenue,
  passengers,
}: {
  total: number;
  revenue: number;
  passengers: number;
}) {
  return (
    <View style={styles.statsRow}>
      <StatTile
        icon="car-sport"
        label="Total Rides"
        value={String(total)}
        color={colors.primary}
      />
      <StatTile
        icon="cash"
        label="Revenue"
        value={`₹${Math.round(revenue).toLocaleString("en-IN")}`}
        color={colors.success}
      />
      <StatTile
        icon="people"
        label="Passengers"
        value={String(passengers)}
        color={colors.info}
      />
    </View>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.statTile, { borderColor: color + "30" }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Individual ride card ──────────────────────────────────────────────────

function RideCard({ ride }: { ride: Booking }) {
  const rideStatusColor =
    RIDE_STATUS_COLOR[ride.rideStatus ?? ""] ?? colors.textMuted;

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <View style={styles.card}>
      {/* Card header: booking ID + status */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardBookingId}>
            #{ride.bookingId || ride._id?.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.cardPassenger} numberOfLines={1}>
            {ride.passengerName || ride.bookedBy || "Passenger"}
          </Text>
        </View>
        <View>
          <View
            style={[
              styles.rideStatusBadge,
              { backgroundColor: rideStatusColor + "18" },
            ]}
          >
            <View
              style={[styles.rideStatusDot, { backgroundColor: rideStatusColor }]}
            />
            <Text
              style={[styles.rideStatusText, { color: rideStatusColor }]}
            >
              {ride.rideStatus || ride.bookingStatus}
            </Text>
          </View>
          <Text style={styles.cardPrice}>
            ₹{Math.round(ride.price ?? 0).toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeBlock}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeVal} numberOfLines={2}>
              {ride.pickupP || "—"}
            </Text>
          </View>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.text }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>DROP</Text>
            <Text style={styles.routeVal} numberOfLines={2}>
              {ride.dropP || "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Timeline grid */}
      <View style={styles.metaGrid}>
        <MetaCell
          icon="time-outline"
          label="Start"
          value={fmtDate(ride.rideStartedAt ?? ride.pickupD)}
        />
        <MetaCell
          icon="flag-outline"
          label="End"
          value={fmtDate(ride.rideCompletedAt ?? ride.dropD)}
        />
        <MetaCell
          icon="people-outline"
          label="Seats"
          value={String(ride.totalSeatsBooked ?? 1)}
        />
        <MetaCell
          icon="call-outline"
          label="Mobile"
          value={ride.customerMobile || "—"}
        />
      </View>

      {/* Sharing type chip */}
      {ride.sharingType && (
        <View style={styles.sharingRow}>
          <View
            style={[
              styles.sharingChip,
              {
                backgroundColor:
                  ride.sharingType === "Shared" ? "#DBEAFE" : "#FEF3C7",
              },
            ]}
          >
            <Text
              style={[
                styles.sharingText,
                {
                  color:
                    ride.sharingType === "Shared" ? "#2563EB" : "#D97706",
                },
              ]}
            >
              {ride.sharingType}
            </Text>
          </View>
          {ride.vehicleNumber && (
            <Text style={styles.vehicleNum}>{ride.vehicleNumber}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function MetaCell({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaCell}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaVal} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  errorText: { color: colors.textMuted, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: { color: colors.primary, fontWeight: "700" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
  },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },

  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0A1128",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  cardBookingId: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  cardPassenger: { fontSize: 15, fontWeight: "800", color: colors.text },
  rideStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    alignSelf: "flex-end",
  },
  rideStatusDot: { width: 6, height: 6, borderRadius: 3 },
  rideStatusText: { fontSize: 11, fontWeight: "700" },
  cardPrice: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "right",
  },

  routeBlock: { marginBottom: spacing.md },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  routeVal: { fontSize: 13, fontWeight: "600", color: colors.text },

  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 0,
  },
  metaCell: {
    width: "50%",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metaVal: { fontSize: 12, fontWeight: "600", color: colors.text },

  sharingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 2,
  },
  sharingChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sharingText: { fontSize: 11, fontWeight: "700" },
  vehicleNum: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "monospace",
    fontWeight: "600",
  },
});
