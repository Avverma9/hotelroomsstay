/**
 * Car Detail / Edit — Rider view.
 * View mode: shows full car info + quick stats.
 * Edit mode: lets rider update route, price, availability, runningStatus.
 * Footer: "Manage Seats" button → /cars/[id]/seats
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCarById, updateCar } from "../../../src/api";
import type { Car } from "../../../src/api";
import { colors, IMAGES, radii, spacing } from "../../../src/theme";
import Button from "../../../src/ui";

const { width } = Dimensions.get("window");

export default function CarEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  // editable fields
  const [pickupP, setPickupP] = useState("");
  const [dropP, setDropP] = useState("");
  const [price, setPrice] = useState("");
  const [runningStatus, setRunningStatus] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCarById(String(id));
        setCar(data);
        setPickupP(data.pickupP || "");
        setDropP(data.dropP || "");
        setPrice(String(data.price || data.perPersonCost || 0));
        setRunningStatus(data.runningStatus || "");
        setIsAvailable(data.isAvailable ?? true);
      } catch {
        setCar(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!car) return;
    setSaving(true);
    try {
      await updateCar(car._id, {
        pickupP: pickupP.trim(),
        dropP: dropP.trim(),
        price: Number(price),
        runningStatus: runningStatus.trim(),
        isAvailable,
      });
      const updated = await getCarById(car._id);
      setCar(updated);
      setEditing(false);
      Alert.alert("Saved", "Car updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Car not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = car.images && car.images.length > 0 ? car.images : [IMAGES.carPlaceholder];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image carousel */}
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setImgIndex(i);
            }}
            scrollEventThrottle={16}
          >
            {images.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="car-edit-back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editToggle} onPress={() => setEditing(!editing)} testID="edit-toggle">
            <Ionicons name={editing ? "close-outline" : "create-outline"} size={22} color={colors.primary} />
          </TouchableOpacity>
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>{car.make} {car.model}</Text>
              <Text style={styles.carSub}>
                {car.year ? `${car.year} · ` : ""}{car.color || "—"} · {car.vehicleType}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isAvailable ? "#D1FAE5" : "#FEE2E2" }]}>
              <View style={[styles.badgeDot, { backgroundColor: isAvailable ? "#059669" : "#DC2626" }]} />
              <Text style={[styles.badgeText, { color: isAvailable ? "#059669" : "#DC2626" }]}>
                {isAvailable ? "Available" : "On Trip"}
              </Text>
            </View>
          </View>

          {/* Spec chips */}
          <View style={styles.specRow}>
            <SpecChip icon="people-outline" label={`${car.seater || "?"} seats`} />
            <SpecChip icon="swap-horizontal-outline" label={car.sharingType || "—"} />
            <SpecChip icon="water-outline" label={car.fuelType || "—"} />
            <SpecChip icon="cog-outline" label={car.transmission || "Auto"} />
          </View>

          {/* Editable fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route & Price</Text>
            {editing ? (
              <View style={styles.formBox}>
                <Label>Pickup Point</Label>
                <TextInput
                  style={styles.input}
                  value={pickupP}
                  onChangeText={setPickupP}
                  placeholder="e.g. New Delhi Railway Station"
                  placeholderTextColor={colors.textLight}
                  testID="input-pickupP"
                />
                <Label>Drop Point</Label>
                <TextInput
                  style={styles.input}
                  value={dropP}
                  onChangeText={setDropP}
                  placeholder="e.g. Chandigarh Bus Stand"
                  placeholderTextColor={colors.textLight}
                  testID="input-dropP"
                />
                <Label>Price per trip (₹)</Label>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  placeholderTextColor={colors.textLight}
                  testID="input-price"
                />
                <Label>Running Status</Label>
                <TextInput
                  style={styles.input}
                  value={runningStatus}
                  onChangeText={setRunningStatus}
                  placeholder="e.g. Active / Maintenance"
                  placeholderTextColor={colors.textLight}
                  testID="input-runningStatus"
                />
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Mark as Available</Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor="#fff"
                    testID="switch-isAvailable"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.infoBox}>
                <InfoRow icon="location-outline" label="Pickup" value={car.pickupP || "—"} />
                <InfoRow icon="flag-outline" label="Drop" value={car.dropP || "—"} />
                <InfoRow
                  icon="cash-outline"
                  label="Price"
                  value={`₹${car.sharingType === "Shared" ? car.perPersonCost || 0 : car.price || 0} ${car.sharingType === "Shared" ? "per seat" : "per trip"}`}
                />
                {car.runningStatus && (
                  <InfoRow icon="navigate-circle-outline" label="Status" value={car.runningStatus} />
                )}
              </View>
            )}
          </View>

          {/* Vehicle info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Info</Text>
            <View style={styles.infoBox}>
              <InfoRow icon="car-outline" label="Vehicle No." value={car.vehicleNumber || "—"} />
              <InfoRow icon="speedometer-outline" label="Mileage" value={`${car.mileage || "—"} km/l`} />
              {car.extraKm !== undefined && (
                <InfoRow icon="add-circle-outline" label="Extra km charge" value={`₹${car.extraKm}`} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {editing ? (
          <Button
            title={saving ? "Saving…" : "Save Changes"}
            onPress={handleSave}
            disabled={saving}
            testID="save-car-btn"
            style={{ flex: 1 }}
          />
        ) : (
          <>
            <Button
              title="Manage Seats"
              onPress={() => router.push(`/cars/${car._id}/seats`)}
              testID="manage-seats-btn"
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={styles.editFab}
              onPress={() => setEditing(true)}
              testID="start-edit-btn"
            >
              <Ionicons name="create-outline" size={22} color={colors.primary} />
              <Text style={styles.editFabText}>Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 4, marginTop: 10 }}>{children}</Text>;
}

function SpecChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.specChip}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.specChipText}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRowItem}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageWrap: { width, height: 260, position: "relative" },
  image: { width, height: 260, backgroundColor: colors.inputBg },
  backBtn: { position: "absolute", top: 14, left: 16, backgroundColor: "#fff", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  editToggle: { position: "absolute", top: 14, right: 16, backgroundColor: "#fff", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  dots: { position: "absolute", bottom: 12, width: "100%", flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  content: { padding: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.sm },
  carName: { fontSize: 22, fontWeight: "800", color: colors.text },
  carSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  specChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.inputBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  specChipText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  formBox: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md },
  input: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 4 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  switchLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  infoBox: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  infoRowItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  infoLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 1 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, flexDirection: "row", gap: spacing.sm, paddingBottom: 28 },
  editFab: { backgroundColor: colors.primarySoft, borderRadius: radii.xl, paddingHorizontal: 20, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  editFabText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
});
