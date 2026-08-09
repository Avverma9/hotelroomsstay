/**
 * Seat Management — Rider view.
 * Shows all seats for a car. Rider can:
 *   - Toggle isBooked (mark seat as booked/available manually)
 *   - Edit seatPrice per seat
 * Saves via updateCar({ seatConfig: [...] })
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCarById, getSeatData, updateCar, createManualBooking } from "../../../src/api";
import type { Car, Seat } from "../../../src/api";
import { colors, radii, spacing } from "../../../src/theme";
import Button from "../../../src/ui";

export default function SeatManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSeatForBooking, setSelectedSeatForBooking] = useState<Seat | null>(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    pickupLocation: "",
    dropLocation: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [carData, seatData] = await Promise.all([
          getCarById(String(id)),
          getSeatData(String(id)),
        ]);
        setCar(carData);
        setSeats(seatData.seats || []);
      } catch {
        setSeats([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateSeat = (seatId: string, patch: Partial<Seat>) => {
    setSeats((prev) => prev.map((s) => (s._id === seatId ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const handleToggleBooking = (seat: Seat) => {
    if (car?.sharingType === "Private") {
      Alert.alert("Private vehicle", "Private booking reserves the complete vehicle. Individual seat booking is not available.");
      return;
    }
    if (seat.isBooked) {
      // Already booked, cannot toggle
      return;
    }
    // Open booking form modal
    setSelectedSeatForBooking(seat);
    setBookingForm({
      customerName: "",
      customerMobile: "",
      customerEmail: "",
      pickupLocation: "",
      dropLocation: "",
    });
    setBookingModalVisible(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedSeatForBooking) return;
    if (car?.sharingType === "Private") {
      Alert.alert("Private vehicle", "Private booking reserves the complete vehicle.");
      setBookingModalVisible(false);
      return;
    }
    
    // Validate form
    if (!bookingForm.customerName.trim()) {
      Alert.alert("Validation Error", "Please enter customer name");
      return;
    }
    if (!bookingForm.customerMobile.trim() || bookingForm.customerMobile.length < 10) {
      Alert.alert("Validation Error", "Please enter valid 10-digit mobile number");
      return;
    }

    setSaving(true);
    try {
      // Call API to create manual booking
      const result = await createManualBooking({
        carId: String(id),
        seatId: selectedSeatForBooking._id,
        customerName: bookingForm.customerName,
        customerMobile: bookingForm.customerMobile,
        customerEmail: bookingForm.customerEmail,
        pickupLocation: bookingForm.pickupLocation,
        dropLocation: bookingForm.dropLocation,
      });

      if (result.success) {
        // Update seat as booked locally
        updateSeat(selectedSeatForBooking._id, { isBooked: true });
        setBookingModalVisible(false);
        Alert.alert(
          "Success",
          `Booking created successfully!\n\nBooking ID: ${result.data.bookingId}\nPickup Code: ${result.data.pickupCode}\nDrop Code: ${result.data.dropCode}`
        );
        
        // Reload seat data to reflect changes from server
        const res = await getSeatData(String(id));
        setSeats(res.seats || []);
      } else {
        Alert.alert("Error", result.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("Manual booking error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create booking. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCar(String(id), { seatConfig: seats as any });
      setDirty(false);
      Alert.alert("Saved", "Seat configuration updated.");
    } catch {
      Alert.alert("Error", "Failed to save seat changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const bookedCount = seats.filter((s) => s.isBooked).length;
  const availableCount = seats.length - bookedCount;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="seats-back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Seat Management</Text>
          <Text style={styles.subtitle}>{seats.length} seats · {availableCount} available · {bookedCount} booked</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : seats.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="grid-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No seat data</Text>
          <Text style={styles.emptyText}>This car doesn&apos;t have seat configuration yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
          {/* Summary chips */}
          <View style={styles.summaryRow}>
            <SummaryChip label="Total" value={seats.length} color="#6366F1" bg="#EEF2FF" />
            <SummaryChip label="Available" value={availableCount} color="#059669" bg="#D1FAE5" />
            <SummaryChip label="Booked" value={bookedCount} color="#DC2626" bg="#FEE2E2" />
          </View>

          {car?.sharingType === "Private" && (
            <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" }}>
              <Text style={{ color: "#92400E", fontSize: 12, fontWeight: "700" }}>
                Private vehicle: booking reserves the complete cab. Individual seat booking is disabled.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Seats</Text>

          <FlatList
            data={seats}
            keyExtractor={(s) => s._id}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <SeatCard
                seat={item}
                onToggleBooked={() => handleToggleBooking(item)}
                onPriceChange={(v) => updateSeat(item._id, { seatPrice: Number(v) })}
              />
            )}
          />
        </ScrollView>
      )}

      {/* Save bar */}
      {dirty && (
        <View style={styles.saveBar}>
          <Button
            title={saving ? "Saving…" : "Save Seat Changes"}
            onPress={handleSave}
            disabled={saving}
            testID="save-seats-btn"
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Booking Modal */}
      {bookingModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Booking</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)} disabled={saving}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Seat: {selectedSeatForBooking?.seatNumber} · {selectedSeatForBooking?.seatType || "Standard"}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.customerName}
                  onChangeText={(v) => setBookingForm((p) => ({ ...p, customerName: v }))}
                  placeholder="Enter customer name"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mobile Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.customerMobile}
                  onChangeText={(v) => setBookingForm((p) => ({ ...p, customerMobile: v }))}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.customerEmail}
                  onChangeText={(v) => setBookingForm((p) => ({ ...p, customerEmail: v }))}
                  placeholder="customer@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pickup Location (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.pickupLocation}
                  onChangeText={(v) => setBookingForm((p) => ({ ...p, pickupLocation: v }))}
                  placeholder="Enter pickup location"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Drop Location (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.dropLocation}
                  onChangeText={(v) => setBookingForm((p) => ({ ...p, dropLocation: v }))}
                  placeholder="Enter drop location"
                  editable={!saving}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setBookingModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleCreateBooking}
                disabled={saving}
              >
                <Text style={styles.modalBtnTextPrimary}>
                  {saving ? "Creating..." : "Create Booking"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function SeatCard({
  seat,
  onToggleBooked,
  onPriceChange,
}: {
  seat: Seat;
  onToggleBooked: () => void;
  onPriceChange: (v: string) => void;
}) {
  const [priceText, setPriceText] = useState(String(seat.seatPrice || 0));

  return (
    <View style={[styles.seatCard, seat.isBooked && styles.seatCardBooked]}>
      <View style={styles.seatTop}>
        <View style={[styles.seatNumBadge, { backgroundColor: seat.isBooked ? "#FEE2E2" : "#D1FAE5" }]}>
          <Text style={[styles.seatNum, { color: seat.isBooked ? "#DC2626" : "#059669" }]}>
            {seat.seatNumber}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.inputBg }]}>
          <Text style={styles.typeText}>{seat.seatType || "Std"}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.pricePrefix}>₹</Text>
        <TextInput
          style={styles.priceInput}
          value={priceText}
          keyboardType="numeric"
          onChangeText={(v) => {
            setPriceText(v);
            onPriceChange(v);
          }}
          testID={`seat-price-${seat._id}`}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: seat.isBooked ? "#DC2626" : "#059669" }]}>
          {seat.isBooked ? "Booked" : "Free"}
        </Text>
        <Switch
          value={seat.isBooked}
          onValueChange={onToggleBooked}
          disabled={seat.isBooked}
          trackColor={{ true: "#DC2626", false: "#059669" }}
          thumbColor="#fff"
          testID={`seat-switch-${seat._id}`}
        />
      </View>
    </View>
  );
}

function SummaryChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.summaryChip, { backgroundColor: bg }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  summaryChip: { flex: 1, borderRadius: radii.xl, padding: spacing.md, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  seatCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md,
    shadowColor: "#0A1128", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: colors.border,
  },
  seatCardBooked: { borderColor: "#FEE2E2", backgroundColor: "#FFFBFB" },
  seatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  seatNumBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  seatNum: { fontSize: 16, fontWeight: "800" },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  pricePrefix: { fontSize: 16, fontWeight: "800", color: colors.textMuted, marginRight: 2 },
  priceInput: { flex: 1, backgroundColor: colors.inputBg, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, fontWeight: "700", color: colors.text },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 12, fontWeight: "700" },
  saveBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: 28 },
  
  // Modal styles
  modalOverlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: { 
    backgroundColor: colors.surface, 
    borderRadius: radii.xl, 
    width: "100%", 
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalSubtitle: { 
    fontSize: 13, 
    color: colors.textMuted, 
    backgroundColor: colors.inputBg,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  modalBody: { 
    padding: spacing.lg,
    maxHeight: 400,
  },
  formGroup: { marginBottom: spacing.md },
  formLabel: { 
    fontSize: 12, 
    fontWeight: "700", 
    color: colors.textMuted, 
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: { 
    backgroundColor: colors.inputBg, 
    borderRadius: radii.md, 
    padding: spacing.sm, 
    fontSize: 15, 
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFooter: { 
    flexDirection: "row", 
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBtn: { 
    flex: 1, 
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSecondary: { 
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnPrimary: { 
    backgroundColor: colors.primary,
  },
  modalBtnTextSecondary: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: colors.text,
  },
  modalBtnTextPrimary: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#fff",
  },
});
