/**
 * Ride History Tab — Rider (owner) view.
 * Lists all bookings across the Rider's cars with quick access to new rides.
 * Rider can confirm/cancel pending bookings.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changeBookingStatus, getOwnerBookings } from "../../src/api";
import type { Booking } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function RiderBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [actioning, setActioning] = useState<string | null>(null);

  const gotoNewRide = () => router.push("/cars/create");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getOwnerBookings(user.id);
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filtered =
    filter === "All"
      ? bookings
      : bookings.filter((b) => b.bookingStatus === filter);

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActioning(bookingId);
    try {
      await changeBookingStatus(bookingId, newStatus);
      await load();
    } catch {
      /* silent */
    } finally {
      setActioning(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Ride History</Text>
          <Text style={styles.subtitle}>
            {bookings.length} rides tracked across your account
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newRideBtn}
          onPress={gotoNewRide}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newRideText}>New Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills with Count Badges */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const count =
              f === "All"
                ? bookings.length
                : bookings.filter((b) => b.bookingStatus === f).length;
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      isActive && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        isActive && styles.filterBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-sport-outline" size={48} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No ride history yet</Text>
          <Text style={styles.emptyText}>
            {filter === "All"
              ? "Once riders book available cars, the history will appear here."
              : `You don't have any ${filter.toLowerCase()} rides at the moment.`}
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={gotoNewRide}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBtnText}>Create new ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(it) => it._id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/booking/[id]",
                  params: { id: item._id, data: JSON.stringify(item) },
                })
              }
              testID={`booking-card-${item._id}`}
            >
              {/* Card Header */}
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.carName} numberOfLines={1}>
                    {item.carDetails?.make || item.make || "Unknown Make"}{" "}
                    {item.carDetails?.model || item.model || ""}
                  </Text>
                  <Text style={styles.bookId}>
                    ID: #{item.bookingId || item._id?.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <StatusChip status={item.bookingStatus || "Pending"} />
              </View>

              {/* Passenger Info */}
              <View style={styles.passengerBox}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item.passengerName || item.bookedBy || "Guest Passenger"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item.customerMobile || "No contact info"}
                  </Text>
                </View>
              </View>

              {/* Route Timeline */}
              <View style={styles.route}>
                <View style={styles.routeCol}>
                  <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: colors.text }]} />
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>PICKUP</Text>
                    <Text style={styles.routeVal} numberOfLines={2}>
                      {item.pickupP || "Location not specified"}
                    </Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>DROP-OFF</Text>
                    <Text style={styles.routeVal} numberOfLines={2}>
                      {item.dropP || "Location not specified"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.cardBottom}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.footMuted}>
                    {item.pickupD ? new Date(item.pickupD).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric'
                    }) : "Date TBD"}
                  </Text>
                </View>
                <Text style={styles.price}>₹{Math.round(item.price || 0)}</Text>
              </View>

              {/* Conditional Actions */}
              {item.bookingStatus === "Pending" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.confirmBtn]}
                    disabled={actioning === item._id}
                    onPress={() => handleStatusChange(item._id, "Confirmed")}
                    testID={`confirm-btn-${item._id}`}
                  >
                    {actioning === item._id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>Confirm Ride</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    disabled={actioning === item._id}
                    onPress={() => handleStatusChange(item._id, "Cancelled")}
                    testID={`cancel-btn-${item._id}`}
                  >
                    <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>
                      Decline
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Ride Status Indicator */}
              {item.rideStatus && item.rideStatus !== "PickupPending" && (
                <View style={styles.rideRow}>
                  <Ionicons name="navigate-circle" size={16} color={colors.primary} />
                  <Text style={styles.rideText}>Status: {item.rideStatus}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatusChip({ status }: { status: string }) {
  const cfg = statusColors[status] || { bg: "#F1F5F9", text: "#64748B" };
  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.chipText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Base Screen Layout
  safe: { flex: 1, backgroundColor: colors.bg },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTextContainer: { flex: 1, paddingRight: spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  newRideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full || 999,
  },
  newRideText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Filters
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface || "#fff",
    marginRight: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border || "#E2E8F0",
  },
  filterPillActive: { backgroundColor: colors.primary + "10", borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  filterTextActive: { color: colors.primary },
  filterBadge: {
    backgroundColor: colors.border,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeActive: { backgroundColor: colors.primary },
  filterBadgeText: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  filterBadgeTextActive: { color: "#fff" },

  // Empty State
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.border + "50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 15, lineHeight: 22, marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // FlatList & Card Base
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface || "#fff",
    borderRadius: radii.xxl || 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border || "#F1F5F9",
    shadowColor: "#0A1128",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  // Card Header Area
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.md },
  cardTopLeft: { flex: 1, paddingRight: spacing.md },
  carName: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 4 },
  bookId: { fontSize: 12, color: colors.textMuted, fontFamily: "monospace", fontWeight: "600" },
  
  // Status Chip
  chip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },

  // Passenger Info
  passengerBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.bg || "#F8FAFC",
    padding: spacing.sm,
    borderRadius: radii.md || 8,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: "45%" },
  infoText: { fontSize: 13, color: colors.text, marginLeft: 6, fontWeight: "500" },

  // Route Timeline
  route: { flexDirection: "row", gap: 14, marginBottom: spacing.sm },
  routeCol: { width: 12, alignItems: "center", paddingVertical: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, width: 2, backgroundColor: colors.border || "#E2E8F0", marginVertical: 4 },
  routeDetails: { flex: 1, justifyContent: "space-between", gap: spacing.md },
  routePoint: { flex: 1 },
  routeLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  routeVal: { fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },

  // Card Footer
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border || "#F1F5F9",
  },
  dateContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  footMuted: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  price: { fontSize: 18, fontWeight: "800", color: colors.primary },

  // Actions
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, borderRadius: radii.md || 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  confirmBtn: { backgroundColor: colors.primary },
  cancelBtn: { backgroundColor: "#FEE2E2" },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // Status Addon
  rideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary + "10",
    paddingVertical: 8,
    borderRadius: radii.md || 8,
    gap: 6,
    marginTop: spacing.md,
  },
  rideText: { fontSize: 13, color: colors.primary, fontWeight: "700" },
});
