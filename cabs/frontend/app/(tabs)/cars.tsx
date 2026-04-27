/**
 * My Cars Tab — lists all cars owned by the logged-in Rider.
 * Tap a car to view details / edit.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyCars } from "../../src/api";
import type { Car } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, IMAGES, radii, spacing } from "../../src/theme";

export default function MyCarsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyCars(user.id);
      setCars(data);
    } catch {
      setCars([]);
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cars</Text>
        <Text style={styles.subtitle}>{cars.length} vehicle{cars.length !== 1 ? "s" : ""}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : cars.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="car-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No cars registered</Text>
          <Text style={styles.emptyText}>Contact your admin to register a car under your account.</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(c) => c._id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/cars/${item._id}`)}
              testID={`car-card-${item._id}`}
            >
              <Image
                source={{ uri: item.images?.[0] || IMAGES.carPlaceholder }}
                style={styles.cardImg}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.carName}>{item.make} {item.model}</Text>
                    <Text style={styles.carSub}>{item.year ? `${item.year} · ` : ""}{item.color || "—"} · {item.vehicleType}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: item.isAvailable ? "#D1FAE5" : "#FEE2E2" }]}>
                    <View style={[styles.dot, { backgroundColor: item.isAvailable ? "#059669" : "#DC2626" }]} />
                    <Text style={[styles.badgeText, { color: item.isAvailable ? "#059669" : "#DC2626" }]}>
                      {item.isAvailable ? "Available" : "On Trip"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <InfoChip icon="swap-horizontal-outline" value={item.sharingType || "—"} />
                  <InfoChip icon="people-outline" value={`${item.seater || "?"} seats`} />
                  <InfoChip icon="cash-outline" value={`₹${item.sharingType === "Shared" ? item.perPersonCost || 0 : item.price || 0}`} />
                </View>

                {(item.pickupP || item.dropP) && (
                  <View style={styles.routeRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {item.pickupP || "—"} → {item.dropP || "—"}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.vNum}>{item.vehicleNumber || "—"}</Text>
                  <View style={styles.editBtn}>
                    <Ionicons name="create-outline" size={14} color={colors.primary} />
                    <Text style={styles.editText}>Manage</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function InfoChip({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <Text style={styles.chipText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.xxl, overflow: "hidden",
    shadowColor: "#0A1128", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  cardImg: { width: "100%", height: 160, backgroundColor: colors.inputBg },
  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.sm },
  carName: { fontSize: 17, fontWeight: "800", color: colors.text },
  carSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.inputBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  routeText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  vNum: { fontSize: 12, fontWeight: "700", color: colors.textMuted, fontFamily: "monospace" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editText: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
