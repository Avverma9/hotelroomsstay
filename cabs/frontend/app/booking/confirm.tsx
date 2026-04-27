import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBooking, getCarById, getSeatData } from "../../src/api";
import type { Car, Seat } from "../../src/api";
import { formatApiError, useAuth } from "../../src/auth";
import { colors, radii, spacing } from "../../src/theme";
import Button from "../../src/ui";

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { carId, sharingType, seats: seatsStr } = useLocalSearchParams<{
    carId: string;
    sharingType: string;
    seats?: string;
  }>();

  const seatIds: string[] = useMemo(() => {
    try {
      return seatsStr ? JSON.parse(String(seatsStr)) : [];
    } catch {
      return [];
    }
  }, [seatsStr]);

  const [car, setCar] = useState<Car | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [email, setEmail] = useState(user?.email || "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCarById(String(carId));
        setCar(c);
        if (sharingType === "Shared") {
          const data = await getSeatData(String(carId));
          const picked = (data.seats || []).filter((s) => seatIds.includes(s._id));
          setSeats(picked);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [carId, sharingType, seatIds]);

  const { base, gst, total } = useMemo(() => {
    let b = 0;
    if (sharingType === "Shared") b = seats.reduce((sum, s) => sum + (s.seatPrice || 0), 0);
    else b = car?.price || 0;
    const g = Math.round(b * 0.05 * 100) / 100;
    return { base: b, gst: g, total: Math.round((b + g) * 100) / 100 };
  }, [seats, car, sharingType]);

  const onConfirm = async () => {
    setErr(null);
    if (!name.trim() || !mobile.trim() || !email.trim()) {
      setErr("Please fill passenger details");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        userId: user.id,
        carId: String(carId),
        sharingType,
        vehicleType: car?.vehicleType,
        customerMobile: mobile.trim(),
        customerEmail: email.trim(),
        passengerName: name.trim(),
        bookedBy: mobile.trim(),
        paymentMethod: "Cash",
        isPaid: true,
        confirmOnCreate: true,
      };
      if (sharingType === "Shared") payload.seats = seatIds;
      const res = await createBooking(payload);
      if (!res.success) throw new Error(res.message || "Booking failed");
      Alert.alert("Booking confirmed!", `Booking ID: ${res.data.bookingId}`, [
        {
          text: "View",
          onPress: () =>
            router.replace({
              pathname: "/booking/[id]",
              params: { id: res.data._id, data: JSON.stringify(res.data) },
            }),
        },
      ]);
    } catch (e: any) {
      setErr(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="confirm-back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm booking</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <View style={styles.carSummary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carTitle}>
                {car?.make} {car?.model}
              </Text>
              <Text style={styles.carMeta}>
                {car?.pickupP} → {car?.dropP}
              </Text>
              <Text style={styles.carMeta}>
                {car?.pickupD ? new Date(car.pickupD).toDateString() : "Flexible"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: sharingType === "Shared" ? "#DBEAFE" : "#FEF3C7" }]}>
              <Text style={[styles.badgeText, { color: sharingType === "Shared" ? "#2563EB" : "#D97706" }]}>
                {sharingType}
              </Text>
            </View>
          </View>

          {sharingType === "Shared" && (
            <View style={styles.seatList}>
              <Text style={styles.sectionTitle}>Selected seats</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {seats.map((s) => (
                  <View key={s._id} style={styles.seatChip}>
                    <Text style={styles.seatChipText}>Seat #{s.seatNumber}</Text>
                    <Text style={styles.seatChipPrice}>₹{s.seatPrice}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Passenger details</Text>
            <Field label="Full name" value={name} onChange={setName} testID="confirm-name" />
            <Field label="Mobile" value={mobile} onChange={setMobile} keyboardType="phone-pad" testID="confirm-mobile" />
            <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" testID="confirm-email" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fare breakdown</Text>
            <View style={styles.fareBox}>
              <FareRow label="Base fare" value={base} />
              <FareRow label="GST (5%)" value={gst} />
              <View style={styles.divider} />
              <FareRow label="Total" value={total} bold />
            </View>
          </View>

          <View style={styles.paymentBox}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
            <Text style={styles.paymentText}>Pay with cash on pickup</Text>
          </View>

          {err ? (
            <Text style={styles.err} testID="confirm-error">
              {err}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>TOTAL</Text>
            <Text style={styles.bottomPrice}>₹{total}</Text>
          </View>
          <Button
            title="Confirm Booking"
            onPress={onConfirm}
            loading={submitting}
            testID="confirm-booking-button"
            style={{ paddingHorizontal: 28 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
  testID?: string;
}) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.keyboardType}
        autoCapitalize={props.keyboardType === "email-address" ? "none" : "words"}
        style={styles.input}
        placeholderTextColor={colors.textLight}
        testID={props.testID}
      />
    </View>
  );
}

function FareRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.fareRow}>
      <Text style={[styles.fareLabel, bold && { fontWeight: "800", color: colors.text }]}>{label}</Text>
      <Text style={[styles.fareValue, bold && { fontSize: 18, color: colors.primary }]}>
        ₹{Math.round(value * 100) / 100}
      </Text>
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
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  carSummary: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 12,
  },
  carTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  carMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  seatList: { marginTop: spacing.md },
  seatChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  seatChipText: { fontSize: 12, fontWeight: "800", color: colors.primary },
  seatChipPrice: { fontSize: 11, color: colors.primary, marginTop: 2 },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 52,
  },
  fareBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fareRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  fareLabel: { fontSize: 13, color: colors.textMuted },
  fareValue: { fontSize: 14, color: colors.text, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  paymentBox: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
  },
  paymentText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  err: { color: "#DC2626", marginTop: spacing.sm, fontSize: 13 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 1, fontWeight: "700" },
  bottomPrice: { fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 2 },
});
