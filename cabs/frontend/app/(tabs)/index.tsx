/**
 * Rider Home — Dashboard
 * Shows: greeting, stat cards (total cars, today's bookings, active rides),
 *        quick action buttons, and recent bookings list.
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
import { getMyCars, getOwnerBookings } from "../../src/api";
import type { Booking, Car } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

export default function RiderHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [carsData, bookingsData] = await Promise.all([
        getMyCars(user.id),
        getOwnerBookings(user.id),
      ]);
      setCars(carsData);
      setBookings(bookingsData);
    } catch {
      /* silent */
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

  const today = new Date().toDateString();
  const todayBookings = bookings.filter(
    (b) => b.createdAt && new Date(b.createdAt).toDateString() === today,
  );
  const activeRides = bookings.filter(
    (b) =>
      b.rideStatus === "Ride in Progress" ||
      b.bookingStatus === "Confirmed",
  );
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetMuted}>Welcome back,</Text>
            <Text style={styles.greet} testID="greet-name">
              {user?.name?.split(" ")[0] || "Rider"} 🚗
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
            testID="go-profile-btn"
          >
            <Text style={styles.avatarText}>{(user?.name || "R")[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard icon="car-sport" label="My Cars" value={cars.length} color="#6366F1" bg="#EEF2FF" onPress={() => router.push("/(tabs)/cars")} />
              <StatCard icon="today" label="Today" value={todayBookings.length} color="#D97706" bg="#FEF3C7" onPress={() => router.push("/(tabs)/bookings")} />
              <StatCard icon="flash" label="Active" value={activeRides.length} color="#059669" bg="#D1FAE5" onPress={() => router.push("/(tabs)/bookings")} />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionBtn icon="car-sport-outline" label="My Cars" color={colors.primary} onPress={() => router.push("/(tabs)/cars")} testID="qa-cars" />
              <ActionBtn icon="ticket-outline" label="Bookings" color="#6366F1" onPress={() => router.push("/(tabs)/bookings")} testID="qa-bookings" />
              <ActionBtn icon="person-circle-outline" label="Profile" color="#0EA5E9" onPress={() => router.push("/(tabs)/profile")} testID="qa-profile" />
              <ActionBtn icon="refresh-outline" label="Refresh" color="#059669" onPress={() => { setRefreshing(true); load(); }} testID="qa-refresh" />
            </View>

            {/* Recent Bookings */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/bookings")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentBookings.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="ticket-outline" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              <FlatList
                data={recentBookings}
                keyExtractor={(b) => b._id}
                scrollEnabled={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bookingCard}
                    onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item._id, data: JSON.stringify(item) } })}
                    testID={`home-booking-${item._id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingName} numberOfLines={1}>
                        {item.make || item.carDetails?.make || "—"} {item.model || item.carDetails?.model || ""}
                      </Text>
                      <Text style={styles.bookingId}>#{item.bookingId || item._id?.slice(-6)}</Text>
                    </View>
                    <View style={styles.bookingRight}>
                      <StatusChip status={item.bookingStatus || "Pending"} />
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, bg, onPress }: { icon: any; label: string; value: number; color: string; bg: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: bg }]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionBtn({ icon, label, color, onPress, testID }: { icon: any; label: string; color: string; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} testID={testID}>
      <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
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
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  greetMuted: { color: colors.textMuted, fontSize: 13 },
  greet: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  statsRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, borderRadius: radii.xl, padding: spacing.md, alignItems: "center" },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { color: colors.primary, fontWeight: "700", fontSize: 13, marginRight: spacing.lg, marginTop: spacing.lg },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.lg, gap: spacing.sm },
  actionBtn: {
    width: "47.5%", backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm,
    shadowColor: "#0A1128", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  bookingCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.md, flexDirection: "row", alignItems: "center",
    shadowColor: "#0A1128", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  bookingName: { fontSize: 14, fontWeight: "700", color: colors.text },
  bookingId: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontFamily: "monospace" },
  bookingRight: { flexDirection: "row", alignItems: "center" },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
