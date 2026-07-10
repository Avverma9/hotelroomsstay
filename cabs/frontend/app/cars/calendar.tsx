/**
 * Availability Calendar — Rider (owner) view per vehicle.
 * Route: /cars/calendar?carId=xxx&carName=xxx
 *
 * Shows a monthly grid with day-level availability markers:
 *   🔴 Red   → Private or fully-busy ride active (BLOCKING)
 *   🟡 Amber → Shared ride active (seats may still be free) (PARTIAL)
 *   🟢 Green → Only completed/cancelled bookings — vehicle free
 *   ⬜ Empty → No bookings at all that day
 *
 * Tap any marked day → bottom sheet lists all bookings for that day.
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBookingsByCar, type Booking } from "../../src/api";
import {
  buildBookingMap,
  formatRange,
  getDayStatus,
  toDateKey,
  type DayStatus,
} from "../../src/availability";
import { colors, radii, spacing, statusColors } from "../../src/theme";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG: Record<DayStatus, { dot: string; label: string }> = {
  busy:    { dot: "#EF4444", label: "Busy (active ride)" },
  partial: { dot: "#F59E0B", label: "Partial (shared)" },
  history: { dot: "#10B981", label: "Completed ride" },
  free:    { dot: "transparent", label: "Free" },
};

// --- Helpers ----------------------------------------------------------------

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  // Monday-start: getDay() 0=Sun → treat as 6; Mon=0 … Sun=6
  const startOffset = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(new Date(year, month, d));
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// --- Component --------------------------------------------------------------

export default function CalendarScreen() {
  const router = useRouter();
  const { carId, carName } = useLocalSearchParams<{
    carId: string;
    carName?: string;
  }>();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Animated sheet
  const sheetAnim = useRef(new Animated.Value(400)).current;

  const openSheet = (key: string) => {
    setSelectedDay(key);
    setSheetVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setSelectedDay(null);
    });
  };

  // Pan responder to swipe-down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) closeSheet();
        else
          Animated.spring(sheetAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  const loadMonth = useCallback(async () => {
    if (!carId) return;
    setLoading(true);
    setError("");
    try {
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const result = await getBookingsByCar(carId, {
        dateFrom: firstDay,
        dateTo: lastDay,
      });
      setBookings(Array.isArray(result?.bookings) ? result.bookings : []);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setBookings([]);
      } else {
        setError("Could not load availability. Pull to retry.");
      }
    } finally {
      setLoading(false);
    }
  }, [carId, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const bookingMap = useMemo(() => buildBookingMap(bookings), [bookings]);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const selectedBookings = selectedDay ? (bookingMap.get(selectedDay) ?? []) : [];
  const todayKey = toDateKey(today);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/cars/my-rides" as any)}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Availability Calendar</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {carName || "Your Vehicle"}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadMonth}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity style={styles.navBtn} onPress={goNext}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {(Object.entries(STATUS_CONFIG) as [DayStatus, typeof STATUS_CONFIG[DayStatus]][])
            .filter(([k]) => k !== "free")
            .map(([key, cfg]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cfg.dot }]} />
                <Text style={styles.legendText}>{cfg.label}</Text>
              </View>
            ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calCard}>
          {/* Day headers */}
          <View style={styles.dayRow}>
            {DAY_LABELS.map((l) => (
              <View key={l} style={styles.dayCell}>
                <Text style={styles.dayLabel}>{l}</Text>
              </View>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadMonth} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Date cells */
            <View style={styles.gridWrap}>
              {grid.map((date, idx) => {
                if (!date) {
                  return <View key={`e-${idx}`} style={styles.dayCell} />;
                }
                const key = toDateKey(date);
                const status = getDayStatus(key, bookingMap);
                const isToday = key === todayKey;
                const isPast = date < today && !isToday;
                const hasMark = status !== "free";
                const dotColor = STATUS_CONFIG[status].dot;

                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isToday && styles.todayCell,
                      pressed && styles.pressedCell,
                    ]}
                    onPress={() => hasMark && openSheet(key)}
                    disabled={!hasMark}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isToday && styles.todayText,
                        isPast && !hasMark && styles.pastText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {hasMark && (
                      <View
                        style={[styles.statusDot, { backgroundColor: dotColor }]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Monthly summary */}
        {!loading && !error && (
          <MonthlySummary bookings={bookings} />
        )}
      </ScrollView>

      {/* Bottom Sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selectedDay
              ? new Date(selectedDay).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : ""}
          </Text>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {selectedBookings.length === 0 ? (
              <Text style={styles.sheetEmpty}>No bookings on this day.</Text>
            ) : (
              selectedBookings.map((b) => (
                <DayBookingRow key={b._id} booking={b} />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DayBookingRow({ booking }: { booking: Booking }) {
  const cfg = statusColors[booking.bookingStatus ?? ""] ?? { bg: "#F1F5F9", text: "#64748B" };
  return (
    <View style={styles.bookingRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.bookingRowTop}>
          <Text style={styles.bookingId}>
            #{booking.bookingId || booking._id?.slice(-6).toUpperCase()}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusChipText, { color: cfg.text }]}>
              {booking.bookingStatus}
            </Text>
          </View>
        </View>
        <Text style={styles.bookingPassenger} numberOfLines={1}>
          {booking.passengerName || booking.bookedBy || "Passenger"}
        </Text>
        <Text style={styles.bookingRange}>
          {formatRange(booking.pickupD, booking.dropD)}
        </Text>
        <View style={styles.bookingMeta}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.bookingMetaText} numberOfLines={1}>
            {booking.pickupP || "—"} → {booking.dropP || "—"}
          </Text>
        </View>
      </View>
      <Text style={styles.bookingPrice}>₹{Math.round(booking.price ?? 0)}</Text>
    </View>
  );
}

function MonthlySummary({ bookings }: { bookings: Booking[] }) {
  const totalActive = bookings.filter((b) =>
    ["Pending", "Confirmed", "Available", "Ride in Progress"].includes(b.bookingStatus ?? "")
  ).length;
  const totalCompleted = bookings.filter((b) => b.bookingStatus === "Completed").length;
  const totalRevenue = bookings
    .filter((b) => b.bookingStatus === "Completed")
    .reduce((sum, b) => sum + (b.price ?? 0), 0);

  return (
    <View style={styles.summaryRow}>
      <SummaryTile icon="car-sport" label="Active" value={String(totalActive)} color={colors.warning} />
      <SummaryTile icon="checkmark-circle" label="Completed" value={String(totalCompleted)} color={colors.success} />
      <SummaryTile icon="cash" label="Earned" value={`₹${Math.round(totalRevenue)}`} color={colors.primary} />
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.summaryTile, { borderColor: color + "30" }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 17, fontWeight: "800", color: colors.text },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },

  calCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0A1128",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dayRow: { flexDirection: "row" },
  gridWrap: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  dateText: { fontSize: 14, fontWeight: "600", color: colors.text },
  todayCell: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
  },
  todayText: { color: colors.primary, fontWeight: "800" },
  pastText: { color: colors.textLight },
  pressedCell: { opacity: 0.65 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },

  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  errorText: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  retryText: { color: colors.primary, fontWeight: "700", fontSize: 13 },

  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
  },
  summaryValue: { fontSize: 18, fontWeight: "900" },
  summaryLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },

  // Bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
  },
  sheetEmpty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },

  bookingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  bookingRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    fontFamily: "monospace",
  },
  statusChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  bookingPassenger: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  bookingRange: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  bookingMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  bookingMetaText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    alignSelf: "center",
  },
});
