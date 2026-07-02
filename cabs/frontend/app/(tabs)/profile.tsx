import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyCars, getOwnerBookings } from "../../src/api";
import type { Booking, Car } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

const ACTIVE_STATUSES = new Set(["PickupPending", "Available", "Ride in Progress"]);

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const dayStart = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const dayEnd = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [c, b] = await Promise.all([getMyCars(user.id), getOwnerBookings(user.id)]);
      setCars(c);
      setBookings(b);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const activeBookings = useMemo(
    () => bookings.filter((b) => ACTIVE_STATUSES.has(b.rideStatus || "") || b.bookingStatus === "Confirmed"),
    [bookings],
  );

  const monthDays = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const startOffset = start.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i += 1) days.push(null);
    for (let d = 1; d <= end.getDate(); d += 1) days.push(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), d));
    return days;
  }, [selectedMonth]);

  const dayBuckets = useMemo(() => {
    return monthDays
      .filter((d): d is Date => !!d)
      .map((day) => {
        const items = bookings.filter((b) => {
          const pickup = new Date(b.pickupD || b.createdAt || 0);
          const drop = new Date(b.dropD || b.pickupD || b.createdAt || 0);
          return pickup.getTime() <= dayEnd(day) && drop.getTime() >= dayStart(day);
        });
        const active = items.some((b) => ACTIVE_STATUSES.has(b.rideStatus || "") || b.bookingStatus === "Confirmed");
        return { day, items, active };
      });
  }, [bookings, monthDays]);

  const selectedSummary = useMemo(() => {
    return dayBuckets.find((bucket) => sameDay(bucket.day, selectedMonth)) || dayBuckets[0];
  }, [dayBuckets, selectedMonth]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "U")[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} testID="profile-name">{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          <QuickCard label="My Cars" value={cars.length} onPress={() => router.push("/(tabs)/cars")} icon="car-sport" />
          <QuickCard label="Ride History" value={bookings.length} onPress={() => router.push("/(tabs)/bookings")} icon="time" />
          <QuickCard label="My Ride" value={activeBookings.length} onPress={() => router.push("/(tabs)/bookings")} icon="flash" />
          <QuickCard label="Calendar" value={dayBuckets.filter((d) => d.active).length} onPress={() => {}} icon="calendar-outline" />
        </View>

        <Section title="Account">
          <InfoRow icon="call" label="Mobile" value={user?.mobile || "—"} />
          <InfoRow icon="mail" label="Email" value={user?.email || "—"} />
          <InfoRow icon="finger-print" label="Rider ID" value={user?.id || "—"} mono />
        </Section>

        <Section
          title="My Ride"
          actionLabel="Open History"
          onAction={() => router.push("/(tabs)/bookings")}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : activeBookings.length === 0 ? (
            <EmptyState icon="flash-outline" title="No active rides" text="Current and upcoming rides will appear here." />
          ) : (
            <FlatList
              data={activeBookings.slice(0, 3)}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <RideRow booking={item} onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item._id, data: JSON.stringify(item) } })} />
              )}
            />
          )}
        </Section>

        <Section title="Calendar">
          <View style={styles.monthBar}>
            <TouchableOpacity onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthLabel(selectedMonth)}</Text>
            <TouchableOpacity onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <Legend color="#D1FAE5" label="Available" />
            <Legend color="#FEE2E2" label="Booked" />
            <Legend color="#FEF3C7" label="Mixed" />
          </View>

          <View style={styles.weekRow}>
            {[
              { key: "sun", label: "S" },
              { key: "mon", label: "M" },
              { key: "tue", label: "T" },
              { key: "wed", label: "W" },
              { key: "thu", label: "T" },
              { key: "fri", label: "F" },
              { key: "sat", label: "S" },
            ].map((d) => (
              <Text key={d.key} style={styles.weekLabel}>{d.label}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthDays.map((day, idx) => {
              if (!day) return <View key={`blank-${idx}`} style={styles.dayCellBlank} />;
              const buckets = dayBuckets.find((b) => sameDay(b.day, day));
              const hasActive = !!buckets?.active;
              const booked = buckets?.items.length || 0;
              return (
                <TouchableOpacity key={day.toISOString()} style={[styles.dayCell, hasActive && styles.dayCellActive]} onPress={() => setSelectedMonth(new Date(day))}>
                  <Text style={[styles.dayNum, hasActive && styles.dayNumActive]}>{day.getDate()}</Text>
                  <Text style={[styles.dayMeta, hasActive && styles.dayNumActive]}>{booked ? `${booked} ride${booked > 1 ? "s" : ""}` : "Free"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedSummary ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{selectedSummary.day.toDateString()}</Text>
              <Text style={styles.summaryText}>
                {selectedSummary.items.length} booking{selectedSummary.items.length !== 1 ? "s" : ""} on this day.
              </Text>
              {selectedSummary.items.slice(0, 3).map((b) => (
                <View key={b._id} style={styles.summaryItem}>
                  <Text style={styles.summaryItemTitle}>{b.make || b.carDetails?.make || "—"} {b.model || b.carDetails?.model || ""}</Text>
                  <Text style={styles.summaryItemMeta}>{b.pickupP || "—"} → {b.dropP || "—"} · {b.rideStatus || "PickupPending"}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, actionLabel, onAction }: { title: string; children: React.ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel ? <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{actionLabel}</Text></TouchableOpacity> : null}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, mono && { fontFamily: "monospace", fontSize: 12 }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function QuickCard({ label, value, icon, onPress }: { label: string; value: number; icon: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RideRow({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const cfg = statusColors[booking.rideStatus || "PickupPending"] || { bg: "#F1F5F9", text: "#64748B" };
  return (
    <TouchableOpacity style={styles.rideRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rideTitle}>{booking.make || booking.carDetails?.make || "—"} {booking.model || booking.carDetails?.model || ""}</Text>
        <Text style={styles.rideMeta}>{booking.pickupP || "—"} → {booking.dropP || "—"}</Text>
      </View>
      <View style={[styles.rideBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.rideBadgeText, { color: cfg.text }]}>{booking.rideStatus || "PickupPending"}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.textLight} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.primary },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logoutIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.lg, gap: spacing.sm },
  quickCard: { width: "48%", backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, gap: 6 },
  quickValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  quickLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "700" },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  sectionAction: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 1 },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: "600", marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: spacing.md, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  rideRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  rideTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  rideMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rideBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rideBadgeText: { fontSize: 11, fontWeight: "800" },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  monthBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  legendRow: { flexDirection: "row", gap: 10, marginBottom: spacing.sm },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.textMuted },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: "center", color: colors.textMuted, fontWeight: "700", fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayCellBlank: { width: "13.1%", aspectRatio: 1, borderRadius: 14 },
  dayCell: { width: "13.1%", aspectRatio: 1, borderRadius: 14, backgroundColor: colors.inputBg, padding: 6, alignItems: "center", justifyContent: "center" },
  dayCellActive: { backgroundColor: colors.primarySoft },
  dayNum: { fontSize: 13, fontWeight: "800", color: colors.text },
  dayNumActive: { color: colors.primary },
  dayMeta: { fontSize: 8, color: colors.textMuted, marginTop: 2, textAlign: "center" },
  summaryCard: { marginTop: spacing.md, backgroundColor: colors.inputBg, borderRadius: radii.xl, padding: spacing.md },
  summaryTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  summaryText: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  summaryItem: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  summaryItemTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  summaryItemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  logoutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999, backgroundColor: "#FEE2E2" },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
