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
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSeatData, updateCar } from "../../../src/api";
import type { Seat } from "../../../src/api";
import { colors, radii, spacing } from "../../../src/theme";
import Button from "../../../src/ui";

export default function SeatManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSeatData(String(id));
        setSeats(res.seats || []);
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
          <Text style={styles.emptyText}>This car doesn't have seat configuration yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
          {/* Summary chips */}
          <View style={styles.summaryRow}>
            <SummaryChip label="Total" value={seats.length} color="#6366F1" bg="#EEF2FF" />
            <SummaryChip label="Available" value={availableCount} color="#059669" bg="#D1FAE5" />
            <SummaryChip label="Booked" value={bookedCount} color="#DC2626" bg="#FEE2E2" />
          </View>

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
                onToggleBooked={() => updateSeat(item._id, { isBooked: !item.isBooked })}
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
});
