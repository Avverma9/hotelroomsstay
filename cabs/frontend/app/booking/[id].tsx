/**
 * Booking Detail — Rider view.
 * - Shows full booking info: passenger, route, payment, seats
 * - Pending: Confirm / Cancel buttons
 * - Confirmed + rideStatus=Available: Verify Pickup Code form
 * - rideStatus=Ride in Progress: Verify Drop Code form
 * - Ride Completed: shows summary
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  changeBookingStatus,
  getOwnerBookings,
  verifyDropCode,
  verifyPickupCode,
} from "../../src/api";
import type { Booking } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";
import Button from "../../src/ui";

export default function RiderBookingDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupCode, setPickupCode] = useState("");
  const [dropCode, setDropCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    (async () => {
      // Try snapshot
      if (data) {
        try {
          setBooking(JSON.parse(String(data)));
          setLoading(false);
          return;
        } catch {
          // fallthrough
        }
      }
      // Fallback: fetch owner bookings and find by id
      try {
        if (user?.id) {
          const list = await getOwnerBookings(user.id);
          const found = (list || []).find((b) => b._id === id);
          setBooking(found || null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, data, user]);

  const refreshBooking = async () => {
    if (!user?.id) return;
    const list = await getOwnerBookings(user.id);
    const found = (list || []).find((b) => b._id === id);
    if (found) setBooking(found);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    setActioning(true);
    try {
      await changeBookingStatus(booking._id, newStatus);
      await refreshBooking();
    } catch {
      Alert.alert("Error", "Failed to update status.");
    } finally {
      setActioning(false);
    }
  };

  const handleVerifyPickup = async () => {
    if (!booking || !pickupCode.trim()) return;
    setVerifying(true);
    try {
      await verifyPickupCode(booking._id, pickupCode.trim());
      setPickupCode("");
      await refreshBooking();
      Alert.alert("Ride Started", "Pickup code verified. Ride is now in progress.");
    } catch (err: any) {
      Alert.alert("Invalid Code", err?.response?.data?.message || "Pickup code is incorrect.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyDrop = async () => {
    if (!booking || !dropCode.trim()) return;
    setVerifying(true);
    try {
      await verifyDropCode(booking._id, dropCode.trim());
      setDropCode("");
      await refreshBooking();
      Alert.alert("Ride Completed", "Drop code verified. Booking marked as completed.");
    } catch (err: any) {
      Alert.alert("Invalid Code", err?.response?.data?.message || "Drop code is incorrect.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <Text style={{ color: colors.textMuted }}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const bStatusCfg = statusColors[booking.bookingStatus || "Pending"] || { bg: "#F1F5F9", text: "#64748B" };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="booking-detail-back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Detail</Text>
        </View>

        <View style={styles.content}>
          {/* Car + Status */}
          <View style={styles.topCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>
                {booking.carDetails?.make || booking.make || "—"}{" "}
                {booking.carDetails?.model || booking.model || ""}
              </Text>
              <Text style={styles.bookingId}>#{booking.bookingId || booking._id?.slice(-6)}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: bStatusCfg.bg }]}>
              <Text style={[styles.statusText, { color: bStatusCfg.text }]}>{booking.bookingStatus || "Pending"}</Text>
            </View>
          </View>

          {/* Ride status */}
          {booking.rideStatus && (
            <View style={styles.rideStatusRow}>
              <Ionicons name="navigate-circle" size={16} color={colors.primary} />
              <Text style={styles.rideStatusText}>Ride: {booking.rideStatus}</Text>
            </View>
          )}

          {/* Passenger info */}
          <SectionCard title="Passenger">
            <InfoRow icon="person-outline" label="Name" value={booking.passengerName || booking.bookedBy || "—"} />
            <InfoRow icon="call-outline" label="Mobile" value={booking.customerMobile || "—"} />
            <InfoRow icon="mail-outline" label="Email" value={booking.customerEmail || "—"} />
          </SectionCard>

          {/* Route */}
          <SectionCard title="Route">
            <View style={styles.routeBox}>
              <View style={styles.routeCol}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: colors.text }]} />
              </View>
              <View style={{ flex: 1, gap: 18 }}>
                <View>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeVal}>{booking.pickupP || "—"}</Text>
                  <Text style={styles.routeDate}>{booking.pickupD ? new Date(booking.pickupD).toLocaleString() : "—"}</Text>
                </View>
                <View>
                  <Text style={styles.routeLabel}>DROP</Text>
                  <Text style={styles.routeVal}>{booking.dropP || "—"}</Text>
                  <Text style={styles.routeDate}>{booking.dropD ? new Date(booking.dropD).toLocaleString() : "—"}</Text>
                </View>
              </View>
            </View>
          </SectionCard>

          {/* Payment */}
          <SectionCard title="Payment">
            <InfoRow icon="cash-outline" label="Amount" value={`₹${Math.round(booking.price || 0)}`} />
            <InfoRow icon="card-outline" label="Method" value={booking.paymentMethod || "—"} />
            <InfoRow icon="checkmark-circle-outline" label="Paid" value={booking.isPaid ? "Yes" : "No"} />
          </SectionCard>

          {/* Seats */}
          {booking.seats && booking.seats.length > 0 && (
            <SectionCard title={`Seats (${booking.totalSeatsBooked || booking.seats.length})`}>
              <View style={styles.seatRow}>
                {booking.seats.map((s: any) => (
                  <View key={s._id || s.seatNumber} style={styles.seatBadge}>
                    <Text style={styles.seatBadgeText}>{s.seatNumber}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}

          {/* ── ACTION ZONE ── */}

          {/* Confirm / Cancel (when Pending) */}
          {booking.bookingStatus === "Pending" && (
            <SectionCard title="Actions">
              <Text style={styles.actionHint}>Confirm or cancel this booking:</Text>
              <View style={styles.actionBtns}>
                <Button
                  title={actioning ? "..." : "Confirm"}
                  onPress={() => handleStatusChange("Confirmed")}
                  disabled={actioning}
                  testID="confirm-booking-btn"
                  style={{ flex: 1 }}
                />
                <TouchableOpacity
                  style={styles.cancelBtn}
                  disabled={actioning}
                  onPress={() => handleStatusChange("Cancelled")}
                  testID="cancel-booking-btn"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          )}

          {/* Verify Pickup Code — only when Confirmed + rideStatus Available */}
          {booking.bookingStatus === "Confirmed" &&
            booking.rideStatus === "Available" && (
              <SectionCard title="Verify Pickup Code">
                <Text style={styles.actionHint}>
                  Ask passenger for their 6-digit pickup code to start the ride.
                </Text>
                <TextInput
                  style={styles.codeInput}
                  value={pickupCode}
                  onChangeText={setPickupCode}
                  placeholder="Enter pickup code"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  maxLength={6}
                  testID="pickup-code-input"
                />
                <Button
                  title={verifying ? "Verifying…" : "Start Ride"}
                  onPress={handleVerifyPickup}
                  disabled={verifying || pickupCode.length < 4}
                  testID="verify-pickup-btn"
                />
              </SectionCard>
            )}

          {/* Verify Drop Code (rideStatus Ride in Progress) */}
          {booking.rideStatus === "Ride in Progress" && (
            <SectionCard title="Verify Drop Code">
              <Text style={styles.actionHint}>
                Ask passenger for their 6-digit drop code to complete the ride.
              </Text>
              <TextInput
                style={styles.codeInput}
                value={dropCode}
                onChangeText={setDropCode}
                placeholder="Enter drop code"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={6}
                testID="drop-code-input"
              />
              <Button
                title={verifying ? "Verifying…" : "Complete Ride"}
                onPress={handleVerifyDrop}
                disabled={verifying || dropCode.length < 4}
                testID="verify-drop-btn"
              />
            </SectionCard>
          )}

          {/* Completed */}
          {booking.rideStatus === "Ride Completed" && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={32} color="#059669" />
              <Text style={styles.completedText}>Ride Completed</Text>
              <Text style={styles.completedSub}>This booking has been successfully completed.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
  topCard: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.md, flexDirection: "row", alignItems: "flex-start", shadowColor: "#0A1128", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  carName: { fontSize: 18, fontWeight: "800", color: colors.text },
  bookingId: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: "monospace" },
  statusChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginLeft: spacing.sm },
  statusText: { fontSize: 12, fontWeight: "700" },
  rideStatusRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: spacing.sm },
  rideStatusText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, shadowColor: "#0A1128", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
  sectionBody: { gap: spacing.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { fontSize: 13, color: colors.textMuted, width: 60 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.text },
  routeBox: { flexDirection: "row", gap: 12 },
  routeCol: { width: 14, alignItems: "center", paddingTop: 6 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  routeLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 1 },
  routeVal: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  routeDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  seatRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  seatBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  seatBadgeText: { fontSize: 13, fontWeight: "800", color: colors.primary },
  actionHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  actionBtns: { flexDirection: "row", gap: spacing.sm },
  cancelBtn: { flex: 1, backgroundColor: "#FEE2E2", borderRadius: radii.lg, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { color: "#DC2626", fontWeight: "800", fontSize: 14 },
  codeInput: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: 8, textAlign: "center", marginBottom: spacing.sm },
  completedBanner: { backgroundColor: "#D1FAE5", borderRadius: radii.xl, padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  completedText: { fontSize: 18, fontWeight: "800", color: "#059669" },
  completedSub: { fontSize: 13, color: "#047857", textAlign: "center" },
});
