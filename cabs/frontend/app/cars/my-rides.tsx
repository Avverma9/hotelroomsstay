import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { getMyCars, type Car } from "../../src/api";
import { colors, IMAGES, radii, spacing } from "../../src/theme";

export default function MyRidesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myRides, setMyRides] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyCars();
        setMyRides(Array.isArray(data) ? data : []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to load your rides";
        setError(msg);
        setMyRides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Published Rides</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : myRides.length === 0 ? (
        <View style={styles.empty}>
          <Image source={{ uri: IMAGES.empty }} style={styles.emptyImg} />
          <Text style={styles.emptyTitle}>No rides published yet</Text>
          <Text style={styles.emptyText}>{error || "You haven't made any cars available for rides."}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/cars/create")} testID="publish-new-ride-btn">
            <Text style={styles.emptyBtnText}>Publish New Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myRides}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <MyRideCard
              ride={item}
              onPress={() => router.push(`/cars/${item._id}` as any)}
              onEdit={() => router.push({ pathname: "/cars/create", params: { carToEdit: item._id } } as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function MyRideCard({ ride, onPress, onEdit }: { ride: Car; onPress: () => void; onEdit: () => void }) {
  const router = useRouter();
  const img = ride.images?.[0] || IMAGES.carPlaceholder;
  const pickupDate = ride.pickupD ? new Date(ride.pickupD).toLocaleDateString() : "N/A";
  const dropDate = ride.dropD ? new Date(ride.dropD).toLocaleDateString() : "N/A";
  const pickupTime = ride.pickupD ? new Date(ride.pickupD).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
  const dropTime = ride.dropD ? new Date(ride.dropD).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
  const carLabel = `${ride.make} ${ride.model}`;

  const goCalendar = () =>
    router.push({
      pathname: "/cars/calendar",
      params: { carId: ride._id, carName: carLabel },
    } as any);

  const goHistory = () =>
    router.push({
      pathname: "/cars/ride-history",
      params: { carId: ride._id, carName: carLabel },
    } as any);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: img }} style={styles.cardImg} />
      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>
            {ride.make} {ride.model} ({ride.vehicleNumber})
          </Text>
          <View style={[styles.badge, { backgroundColor: ride.sharingType === "Shared" ? "#DBEAFE" : "#FEF3C7" }]}>
            <Text style={[styles.badgeText, { color: ride.sharingType === "Shared" ? "#2563EB" : "#D97706" }]}>
              {ride.sharingType}
            </Text>
          </View>
        </View>

        <View style={styles.specRow}>
          <Spec icon="speedometer-outline" text={`${ride.mileage || 0} km/l`} />
          <Spec icon="water-outline" text={ride.fuelType || "—"} />
          <Spec icon="people-outline" text={`${ride.seater || 0} seats`} />
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.pickupP || "—"} → {ride.dropP || "—"}
          </Text>
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.routeText}>{pickupDate} {pickupTime} → {dropDate} {dropTime}</Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <View>
            <Text style={styles.priceLabel}>
              {ride.sharingType === "Shared" ? "per seat" : "per trip"}
            </Text>
            <Text style={styles.price}>₹{ride.sharingType === "Shared" ? ride.perPersonCost || 0 : ride.price || 0}</Text>
          </View>
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
              <Text style={styles.viewBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Secondary action row: Calendar + Ride History ── */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secBtn} onPress={goCalendar}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.secBtnText}>Availability</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secBtn} onPress={goHistory}>
            <Ionicons name="time-outline" size={15} color={colors.info} />
            <Text style={[styles.secBtnText, { color: colors.info }]}>Ride History</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create<any>({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
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
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  specRow: { flexDirection: "row", gap: 16, marginTop: spacing.sm },
  spec: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  routeText: { fontSize: 13, color: colors.textMuted, flex: 1 },
  priceLabel: { fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  price: { fontSize: 20, fontWeight: "800", color: colors.primary, marginTop: 2 },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewBtnText: { color: colors.text, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
});