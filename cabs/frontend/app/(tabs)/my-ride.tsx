import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOwnerBookings } from "../../src/api";
import type { Booking } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

export default function MyRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getOwnerBookings(user.id);
      setBookings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const active = useMemo(
    () => bookings.filter((b) =>
      b.rideStatus === "PickupPending" ||
      b.rideStatus === "Available" ||
      b.rideStatus === "Ride in Progress" ||
      b.bookingStatus === "Confirmed"
    ),
    [bookings],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Ride</Text>
          <Text style={styles.subtitle}>Current and upcoming rides only</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/(tabs)/bookings")}>
          <Text style={styles.ctaText}>History</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={active.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => {
            const cfg = statusColors[item.rideStatus || "PickupPending"] || { bg: "#F1F5F9", text: "#64748B" };
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item._id, data: JSON.stringify(item) } })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.make || item.carDetails?.make || "—"} {item.model || item.carDetails?.model || ""}</Text>
                  <Text style={styles.meta}>#{item.bookingId || item._id.slice(-6)}</Text>
                  <Text style={styles.meta}>{item.pickupP || "—"} → {item.dropP || "—"}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.pillText, { color: cfg.text }]}>
                    {item.rideStatus || "PickupPending"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flash-outline" size={52} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No active rides</Text>
              <Text style={styles.emptyText}>Pickup pending, confirmed, and in-progress rides will show here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 12 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cta: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  ctaText: { color: "#fff", fontWeight: "800" },
  card: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", padding: spacing.xl, marginTop: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 8 },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: 4 },
});
