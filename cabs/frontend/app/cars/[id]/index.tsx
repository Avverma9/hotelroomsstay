import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getCarById, updateCar } from "../../../src/api";
import type { Car } from "../../../src/api";
import { colors, IMAGES, radii, spacing } from "../../../src/theme";
import Button from "../../../src/ui";

const RUNNING_STATUS_OPTIONS = ["Available", "On A Trip", "Trip Completed", "Unavailable"];

export default function CarEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions(); // 1. Dynamic width for true responsiveness
  const insets = useSafeAreaInsets(); // 2. Dynamic safe area for bottom bar

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
  const [runningStatusOpen, setRunningStatusOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCarById(String(id));
        setCar(data);
        setPickupP(data.pickupP || "");
        setDropP(data.dropP || "");
        setPrice(String(data.price || data.perPersonCost || 0));
        setRunningStatus(data.runningStatus || "Available");
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
        runningStatus: runningStatus.trim() || "Available",
        isAvailable,
      });
      const updated = await getCarById(car._id);
      setCar(updated);
      setEditing(false);
      Alert.alert("Success", "Car details updated successfully.");
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
        <Text style={styles.errorText}>Car not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = car.images && car.images.length > 0 ? car.images : [IMAGES.carPlaceholder];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} // Dynamic padding for bottom bar
        >
          {/* Image carousel */}
          <View style={[styles.imageWrap, { width }]}>
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
                <Image key={idx} source={{ uri }} style={{ width, height: 240 }} resizeMode="cover" />
              ))}
            </ScrollView>
            
            {/* Header Actions Overlay */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing(!editing)}>
                <Ionicons name={editing ? "close-outline" : "create-outline"} size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

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
              <View style={{ flex: 1, paddingRight: 10 }}>
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

            {/* Spec chips - More compact spacing */}
            <View style={styles.specRow}>
              <SpecChip icon="people" label={`${car.seater || "?"} seats`} />
              <SpecChip icon="swap-horizontal" label={car.sharingType || "—"} />
              <SpecChip icon="water" label={car.fuelType || "—"} />
              <SpecChip icon="cog" label={car.transmission || "Auto"} />
            </View>

            {/* Form / Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route & Pricing</Text>
              {editing ? (
                <View style={styles.card}>
                  <Label>Pickup Point</Label>
                  <TextInput
                    style={styles.input}
                    value={pickupP}
                    onChangeText={setPickupP}
                    placeholder="e.g. New Delhi Railway Station"
                    placeholderTextColor={colors.textLight}
                  />
                  
                  <Label>Drop Point</Label>
                  <TextInput
                    style={styles.input}
                    value={dropP}
                    onChangeText={setDropP}
                    placeholder="e.g. Chandigarh Bus Stand"
                    placeholderTextColor={colors.textLight}
                  />
                  
                  {/* Side-by-Side inputs for Compactness */}
                  <View style={styles.rowGrid}>
                    <View style={{ flex: 1 }}>
                      <Label>Price (₹)</Label>
                      <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="1500"
                        placeholderTextColor={colors.textLight}
                      />
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Label>Status</Label>
                      <TouchableOpacity
                        style={styles.select}
                        onPress={() => setRunningStatusOpen(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectText, !runningStatus && { color: colors.textLight }]} numberOfLines={1}>
                          {runningStatus || "Select..."}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider} />
                  
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Vehicle currently available?</Text>
                    <Switch
                      value={isAvailable}
                      onValueChange={setIsAvailable}
                      trackColor={{ true: colors.primary, false: colors.border }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.card}>
                  <InfoRow icon="location" label="Pickup" value={car.pickupP || "—"} />
                  <InfoRow icon="flag" label="Drop" value={car.dropP || "—"} />
                  <InfoRow
                    icon="cash"
                    label="Price"
                    value={`₹${car.sharingType === "Shared" ? car.perPersonCost || 0 : car.price || 0} ${car.sharingType === "Shared" ? "/ seat" : "/ trip"}`}
                  />
                  {car.runningStatus && (
                    <InfoRow icon="navigate-circle" label="Status" value={car.runningStatus} hideBorder />
                  )}
                </View>
              )}
            </View>

            {/* Vehicle info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Info</Text>
              <View style={styles.card}>
                <InfoRow icon="car" label="Vehicle No." value={car.vehicleNumber || "—"} />
                <InfoRow icon="speedometer" label="Mileage" value={`${car.mileage || "—"} km/l`} />
                {car.extraKm !== undefined && (
                  <InfoRow icon="add-circle" label="Extra km charge" value={`₹${car.extraKm}`} hideBorder />
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal - Kept relatively the same but cleaned up styles */}
      <Modal visible={runningStatusOpen} transparent animationType="fade" onRequestClose={() => setRunningStatusOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRunningStatusOpen(false)}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom || spacing.lg }]}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {RUNNING_STATUS_OPTIONS.map((option) => {
              const active = runningStatus === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => { setRunningStatus(option); setRunningStatusOpen(false); }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dynamic Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {editing ? (
          <Button title={saving ? "Saving…" : "Save Changes"} onPress={handleSave} disabled={saving} style={{ flex: 1 }} />
        ) : (
          <>
            <Button title="Stats" onPress={() => router.push(`/cars/${car._id}/bookings` as any)} style={{ flex: 1 }} />
            <TouchableOpacity style={styles.actionFab} onPress={() => router.push(`/cars/${car._id}/seats` as any)}>
              <Ionicons name="grid" size={18} color={colors.primary} />
              <Text style={styles.actionFabText}>Seats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionFab, { backgroundColor: colors.inputBg }]} onPress={() => setEditing(true)}>
              <Ionicons name="create" size={18} color={colors.primary} />
              <Text style={styles.actionFabText}>Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// Minimal, cleaner sub-components
function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function SpecChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.specChip}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.specChipText}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, hideBorder = false }: { icon: any; label: string; value: string, hideBorder?: boolean }) {
  return (
    <View style={[styles.infoRowItem, !hideBorder && styles.rowBorder]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: colors.textMuted, fontSize: 16 },
  backLink: { marginTop: 16, padding: 8 },
  backLinkText: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  
  imageWrap: { height: 240, position: "relative", backgroundColor: colors.inputBg },
  headerActions: { position: "absolute", top: 12, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  iconBtn: { backgroundColor: "#fff", borderRadius: 20, width: 38, height: 38, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dots: { position: "absolute", bottom: 12, width: "100%", flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  
  content: { padding: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.md },
  carName: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  carSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontWeight: "500" },
  badge: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
  specChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  specChipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, letterSpacing: -0.2 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6, marginTop: 12, letterSpacing: 0.3 },
  input: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, height: 44, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: "transparent" },
  rowGrid: { flexDirection: "row", gap: spacing.sm },
  select: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { fontSize: 14, color: colors.text, fontWeight: "500", flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  
  infoRowItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoLabel: { fontSize: 14, color: colors.textMuted, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.text, maxWidth: '50%', textAlign: 'right' },
  
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 12, flexDirection: "row", gap: 10 },
  actionFab: { backgroundColor: colors.primarySoft, borderRadius: radii.lg, paddingHorizontal: 16, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionFabText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16, textAlign: "center" },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  optionRowActive: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: 15, fontWeight: "500", color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: "700" },
});