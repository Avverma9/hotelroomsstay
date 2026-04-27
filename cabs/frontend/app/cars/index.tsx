import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { filterCars, getAllCars } from "../../src/api";
import type { Car } from "../../src/api";
import { colors, IMAGES, radii, spacing } from "../../src/theme";

export default function CarsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pickupP?: string; dropP?: string; pickupD?: string; dropD?: string }>();
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const anyFilter = !!(params.pickupP || params.dropP || params.pickupD || params.dropD);
        const data = anyFilter
          ? await filterCars({
              pickupP: params.pickupP,
              dropP: params.dropP,
              pickupD: params.pickupD,
              dropD: params.dropD,
            })
          : await getAllCars();
        setCars(Array.isArray(data) ? data : []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to load cars";
        setError(msg);
        setCars([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.pickupP, params.dropP, params.pickupD, params.dropD]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Available rides</Text>
          {(params.pickupP || params.dropP) && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {params.pickupP || "Any"} → {params.dropP || "Any"}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : cars.length === 0 ? (
        <View style={styles.empty}>
          <Image source={{ uri: IMAGES.empty }} style={styles.emptyImg} />
          <Text style={styles.emptyTitle}>No cars found</Text>
          <Text style={styles.emptyText}>{error || "Try adjusting your filters or dates"}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()} testID="empty-back">
            <Text style={styles.emptyBtnText}>Back to search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(it) => it._id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => <CarCard car={item} onPress={() => router.push(`/cars/${item._id}`)} />}
        />
      )}
    </SafeAreaView>
  );
}

function CarCard({ car, onPress }: { car: Car; onPress: () => void }) {
  const img = car.images?.[0] || IMAGES.carPlaceholder;
  const price = car.sharingType === "Shared" ? car.perPersonCost || 0 : car.price || 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9} testID={`car-listing-item-${car._id}`}>
      <Image source={{ uri: img }} style={styles.cardImg} />
      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>
            {car.make} {car.model}
          </Text>
          <View style={[styles.badge, { backgroundColor: car.sharingType === "Shared" ? "#DBEAFE" : "#FEF3C7" }]}>
            <Text style={[styles.badgeText, { color: car.sharingType === "Shared" ? "#2563EB" : "#D97706" }]}>
              {car.sharingType}
            </Text>
          </View>
        </View>

        <View style={styles.specRow}>
          <Spec icon="speedometer-outline" text={`${car.mileage || 0} km/l`} />
          <Spec icon="water-outline" text={car.fuelType || "—"} />
          <Spec icon="people-outline" text={`${car.seater || 0} seats`} />
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.routeText} numberOfLines={1}>
            {car.pickupP || "—"} → {car.dropP || "—"}
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <View>
            <Text style={styles.priceLabel}>
              {car.sharingType === "Shared" ? "per seat" : "per trip"}
            </Text>
            <Text style={styles.price}>₹{price}</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>View</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Spec({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyImg: { width: 160, height: 160, borderRadius: 80, marginBottom: spacing.md, opacity: 0.85 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: { color: colors.textMuted, marginTop: 4, textAlign: "center", paddingHorizontal: spacing.lg },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    overflow: "hidden",
    shadowColor: "#0A1128",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  cardImg: { width: "100%", height: 170, backgroundColor: colors.inputBg },
  cardBody: { padding: spacing.md },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  specRow: { flexDirection: "row", gap: 16, marginTop: spacing.sm },
  spec: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  routeText: { fontSize: 13, color: colors.textMuted, flex: 1 },
  priceLabel: { fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  price: { fontSize: 20, fontWeight: "800", color: colors.primary, marginTop: 2 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 4,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
});
