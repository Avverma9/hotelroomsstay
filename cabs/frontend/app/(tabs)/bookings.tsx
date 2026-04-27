/**
 * Bookings Tab — Rider (owner) view.
 * Lists all bookings across the Rider's cars.
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
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} total</Text>
      </View>

      {/* Filter pills with count badges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const count = f === "All" ? bookings.length : bookings.filter((b) => b.bookingStatus === f).length;
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
              {count > 0 && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptyText}>
            {filter === "All"
              ? "Your cars have no bookings yet."
              : `No ${filter.toLowerCase()} bookings.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(it) => it._id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
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
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carName} numberOfLines={1}>
                    {item.carDetails?.make || item.make || "—"}{" "}
                    {item.carDetails?.model || item.model || ""}
                  </Text>
                  <Text style={styles.bookId}>#{item.bookingId || item._id?.slice(-6)}</Text>
                </View>
                <StatusChip status={item.bookingStatus || "Pending"} />
              </View>

              {/* Passenger */}
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                <Text style={styles.infoText}>{item.passengerName || item.bookedBy || "—"}</Text>
                <Ionicons name="call-outline" size={14} color={colors.textMuted} style={{ marginLeft: 10 }} />
                <Text style={styles.infoText}>{item.customerMobile || "—"}</Text>
              </View>

              {/* Route */}
              <View style={styles.route}>
                <View style={styles.routeCol}>
                  <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: colors.text }]} />
                </View>
                <View style={{ flex: 1, gap: 18 }}>
                  <View>
                    <Text style={styles.routeLabel}>PICKUP</Text>
                    <Text style={styles.routeVal}>{item.pickupP || "—"}</Text>
                  </View>
                  <View>
                    <Text style={styles.routeLabel}>DROP</Text>
                    <Text style={styles.routeVal}>{item.dropP || "—"}</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardBottom}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.footMuted}>
                    {item.pickupD ? new Date(item.pickupD).toDateString() : "—"}
                  </Text>
                </View>
                <Text style={styles.price}>₹{Math.round(item.price || 0)}</Text>
              </View>

              {/* Rider actions for Pending bookings */}
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
                      <Text style={styles.actionBtnText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    disabled={actioning === item._id}
                    onPress={() => handleStatusChange(item._id, "Cancelled")}
                    testID={`cancel-btn-${item._id}`}
                  >
                    <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Ride status chip */}
              {item.rideStatus && item.rideStatus !== "AwaitingConfirmation" && (
                <View style={styles.rideRow}>
                  <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.rideText}>{item.rideStatus}</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  filters: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, flexDirection: "row", alignItems: "center" },
  filterPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.inputBg, marginRight: 8, gap: 6, borderWidth: 1.5, borderColor: "transparent" },
  filterPillActive: { backgroundColor: colors.primary + "15", borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  filterTextActive: { color: colors.primary },
  filterBadge: { backgroundColor: colors.border, borderRadius: 999, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  filterBadgeActive: { backgroundColor: colors.primary },
  filterBadgeText: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  filterBadgeTextActive: { color: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.md, shadowColor: "#0A1128", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  carName: { fontSize: 16, fontWeight: "800", color: colors.text },
  bookId: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: "monospace" },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  infoText: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  route: { flexDirection: "row", gap: 12, paddingVertical: 2 },
  routeCol: { width: 14, alignItems: "center", paddingTop: 6 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  routeLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 1 },
  routeVal: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  footMuted: { color: colors.textMuted, fontSize: 13 },
  price: { fontSize: 16, fontWeight: "800", color: colors.primary },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1, borderRadius: radii.lg, paddingVertical: 10, alignItems: "center" },
  confirmBtn: { backgroundColor: colors.primary },
  cancelBtn: { backgroundColor: "#FEE2E2" },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  rideRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
  rideText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
});
