import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getMyCars,
  getOwnerBookings,
  getOwnerAvailability,
  addOwnerAvailability,
  deleteOwnerAvailability,
} from "../../src/api";
import type { Booking, Car, OwnerAvailability } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing, statusColors } from "../../src/theme";

const ACTIVE_STATUSES = new Set(["PickupPending", "Available", "Ride in Progress"]);

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const dayStart = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c.getTime(); };
const dayEnd = (d: Date) => { const c = new Date(d); c.setHours(23, 59, 59, 999); return c.getTime(); };

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  // Availability edit state
  const [availList, setAvailList] = useState<OwnerAvailability[]>([]);
  const [calEditMode, setCalEditMode] = useState(false);
  const [calRangeStart, setCalRangeStart] = useState<Date | null>(null);
  const [calRangeEnd, setCalRangeEnd] = useState<Date | null>(null);
  const [calSaving, setCalSaving] = useState(false);

  // Dynamic layout calculations
  const PADDING_H = 16;
  const contentWidth = width - PADDING_H * 2;
  const quickCardWidth = (contentWidth - 12) / 2; // 12px gap
  const calCardWidth = contentWidth - PADDING_H * 2; // 16px internal padding for section card
  const dayCellSize = Math.floor((calCardWidth - 6 * 6) / 7); // 7 cols, 6 gaps of 6px

  const loadAvailability = useCallback(async () => {
    try {
      const from = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString();
      const to = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const res = await getOwnerAvailability(undefined, { dateFrom: from, dateTo: to });
      setAvailList(res?.availability ?? []);
    } catch {
      setAvailList([]);
    }
  }, [selectedMonth]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [c, b] = await Promise.all([getMyCars(), getOwnerBookings(user.id)]);
      setCars(c);
      setBookings(b);
      await loadAvailability();
    } finally {
      setLoading(false);
    }
  }, [user, loadAvailability]);

  const submitCalRange = useCallback(async (mode: 'available' | 'unavailable') => {
    if (!user) return Alert.alert('Login required', 'Please login first.');
    if (!calRangeStart) return Alert.alert('Select dates', 'Tap a start date first.');
    const s = calRangeStart;
    const e = calRangeEnd ?? calRangeStart;
    const start = s <= e ? s : e;
    const end = s <= e ? e : s;
    const endOfDay = new Date(end); endOfDay.setHours(23, 59, 59, 999);
    try {
      setCalSaving(true);
      const carId = cars[0]?._id;
      await addOwnerAvailability({ startDate: start.toISOString(), endDate: endOfDay.toISOString(), mode, carId });
      Alert.alert('Saved ✓', `Days marked as ${mode}`);
      setCalRangeStart(null); setCalRangeEnd(null); setCalEditMode(false);
      await loadAvailability();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? err?.message ?? 'Could not save');
    } finally {
      setCalSaving(false);
    }
  }, [user, calRangeStart, calRangeEnd, cars, loadAvailability]);

  const deleteAvail = useCallback(async (id: string) => {
    try {
      await deleteOwnerAvailability(id);
      await loadAvailability();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? err?.message ?? 'Could not delete');
    }
  }, [loadAvailability]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  useEffect(() => { if (user) loadAvailability(); }, [selectedMonth, user]);

  const activeBookings = useMemo(() => bookings.filter((b) => ACTIVE_STATUSES.has(b.rideStatus || "") || b.bookingStatus === "Confirmed"), [bookings]);
  const monthDays = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const days: (Date | null)[] = Array.from({ length: start.getDay() }, () => null);
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), d));
    return days;
  }, [selectedMonth]);

  const dayBuckets = useMemo(() => monthDays.filter((d): d is Date => !!d).map((day) => {
    const items = bookings.filter((b) => {
      const pickup = new Date(b.pickupD || b.createdAt || 0);
      const drop = new Date(b.dropD || b.pickupD || b.createdAt || 0);
      return pickup.getTime() <= dayEnd(day) && drop.getTime() >= dayStart(day);
    });
    return { day, items, active: items.some((b) => ACTIVE_STATUSES.has(b.rideStatus || "") || b.bookingStatus === "Confirmed") };
  }), [bookings, monthDays]);

  const selectedSummary = useMemo(() => dayBuckets.find((bucket) => sameDay(bucket.day, selectedMonth)) || dayBuckets[0], [dayBuckets, selectedMonth]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "U")[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.headerActionBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={[styles.quickGrid, { paddingHorizontal: PADDING_H }]}>
          <QuickCard w={quickCardWidth} label="My Cars" value={cars.length} icon="car-sport" onPress={() => router.push("/(tabs)/cars")} />
          <QuickCard w={quickCardWidth} label="Bookings" value={bookings.length} icon="time" onPress={() => router.push("/(tabs)/bookings")} />
          <QuickCard w={quickCardWidth} label="Published Rides" value={cars.length} icon="albums" onPress={() => router.push("/cars/my-rides")} />
          <QuickCard w={quickCardWidth} label="Calendar" value={dayBuckets.filter((d) => d.active).length} icon="calendar" onPress={() => {
            if (cars.length > 0) {
              const c = cars[0];
              router.push({ pathname: "/cars/calendar", params: { carId: c._id, carName: `${c.make || ""} ${c.model || ""}` } });
            } else Alert.alert("No vehicles", "Add a car first.");
          }} />
        </View>

        {/* Account Info */}
        <Section title="Account Details" pad={PADDING_H}>
          <InfoRow icon="call" label="Mobile" value={user?.mobile || "—"} />
          <InfoRow icon="mail" label="Email" value={user?.email || "—"} />
          <InfoRow icon="finger-print" label="Rider ID" value={user?.id || "—"} mono isLast />
        </Section>

        {/* My Rides */}
        <Section title="Active Rides" pad={PADDING_H} actionLabel="View All" onAction={() => router.push("/(tabs)/bookings")}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : activeBookings.length === 0 ? (
            <EmptyState icon="flash-outline" title="No active rides" text="Your upcoming rides will appear here." />
          ) : (
            <FlatList
              data={activeBookings.slice(0, 3)}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <RideRow 
                  booking={item} 
                  isLast={index === Math.min(activeBookings.length, 3) - 1}
                  onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item._id, data: JSON.stringify(item) } })} 
                />
              )}
            />
          )}
        </Section>

        {/* Calendar */}
        <Section 
          title="Availability & Schedule" 
          pad={PADDING_H}
          actionIcon={calEditMode ? "close-circle" : "create"} 
          onAction={() => {
            if (!user) return Alert.alert('Required', 'Please login to edit availability.');
            setCalEditMode(e => !e);
            setCalRangeStart(null); setCalRangeEnd(null);
          }}
        >
          {/* Month Navigator */}
          <View style={styles.monthBar}>
            <TouchableOpacity onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthLabel(selectedMonth)}</Text>
            <TouchableOpacity onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <Legend color="#D1FAE5" label="Free" />
            <Legend color="#FEE2E2" label="Booked" />
            <Legend color="#E5E7EB" label="Blocked" />
          </View>

          {calEditMode && (
            <View style={styles.editHint}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.editHintText}>
                {!calRangeStart ? 'Select start date' : !calRangeEnd ? 'Select end date' : 'Apply changes below'}
              </Text>
            </View>
          )}

          {/* Days Header */}
          <View style={styles.weekRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <View key={i} style={{ width: dayCellSize, alignItems: 'center' }}><Text style={styles.weekLabel}>{d}</Text></View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {monthDays.map((day, idx) => {
              if (!day) return <View key={`blank-${idx}`} style={{ width: dayCellSize, height: dayCellSize }} />;
              const buckets = dayBuckets.find((b) => sameDay(b.day, day));
              const hasActive = !!buckets?.active;
              const booked = buckets?.items.length || 0;
              const ts = day.getTime();
              
              const isUnavail = availList.some(a => a.mode === 'unavailable' && ts >= new Date(a.startDate).setHours(0,0,0,0) && ts <= new Date(a.endDate).setHours(23,59,59,999));
              const isOwnerAvail = availList.some(a => a.mode === 'available' && ts >= new Date(a.startDate).setHours(0,0,0,0) && ts <= new Date(a.endDate).setHours(23,59,59,999));
              
              const isInRange = calEditMode && calRangeStart && (() => {
                const s = Math.min(calRangeStart.getTime(), calRangeEnd?.getTime() || calRangeStart.getTime());
                const e = Math.max(calRangeStart.getTime(), calRangeEnd?.getTime() || calRangeStart.getTime());
                return ts >= s && ts <= e;
              })();
              const isRangeEdge = calEditMode && ((calRangeStart && sameDay(day, calRangeStart)) || (calRangeEnd && sameDay(day, calRangeEnd)));

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.dayCell,
                    { width: dayCellSize, height: dayCellSize },
                    hasActive && !isUnavail && styles.dayCellActive,
                    isUnavail && styles.dayCellUnavail,
                    isOwnerAvail && !hasActive && styles.dayCellOwnerAvail,
                    isInRange && styles.dayCellRange,
                    isRangeEdge && styles.dayCellRangeEdge,
                  ]}
                  onPress={() => {
                    if (!calEditMode) return setSelectedMonth(new Date(day));
                    if (!calRangeStart) return setCalRangeStart(day);
                    if (!calRangeEnd) return setCalRangeEnd(day);
                    setCalRangeStart(day); setCalRangeEnd(null);
                  }}
                >
                  <Text style={[styles.dayNum, hasActive && !isUnavail && styles.dayNumActive, isUnavail && styles.dayNumUnavail, isRangeEdge && styles.dayNumEdge]}>
                    {day.getDate()}
                  </Text>
                  <Text style={[styles.dayMeta, hasActive && !isUnavail && styles.dayNumActive, isUnavail && styles.dayNumUnavail]}>
                    {isUnavail ? 'Block' : isOwnerAvail ? 'Avail' : booked ? `${booked} rds` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Edit Action Bar */}
          {calEditMode && calRangeStart && (
            <View style={styles.calEditBar}>
              <Text style={styles.calEditBarText} numberOfLines={1}>
                {calRangeStart.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                {calRangeEnd && !sameDay(calRangeEnd, calRangeStart) ? ` — ${calRangeEnd.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={styles.calBtnGhost} onPress={() => { setCalRangeStart(null); setCalRangeEnd(null); }}>
                  <Text style={styles.calBtnGhostText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.calActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => submitCalRange('unavailable')} disabled={calSaving}>
                  <Text style={[styles.calActionText, { color: '#DC2626' }]}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.calActionBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => submitCalRange('available')} disabled={calSaving}>
                  <Text style={[styles.calActionText, { color: '#059669' }]}>Free</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Blocked Dates List */}
          {availList.filter(a => a.mode === 'unavailable').length > 0 && !calEditMode && (
            <View style={styles.availListWrap}>
              <Text style={styles.availListTitle}>Blocked Periods</Text>
              {availList.filter(a => a.mode === 'unavailable').map((a, i, arr) => (
                <View key={a._id} style={[styles.availRow, i < arr.length - 1 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.availRangeText}>
                      {new Date(a.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} — {new Date(a.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </Text>
                    {a.note && <Text style={styles.availNote}>{a.note}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete?', 'Remove this block?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteAvail(a._id) }])} style={styles.availDeleteBtn}>
                    <Ionicons name="trash" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Day Summary */}
          {selectedSummary && !calEditMode && selectedSummary.items.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{selectedSummary.day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              <Text style={styles.summaryText}>{selectedSummary.items.length} booking{selectedSummary.items.length > 1 ? "s" : ""}</Text>
              {selectedSummary.items.map((b, i) => (
                <View key={b._id} style={[styles.summaryItem, i > 0 && styles.borderTop]}>
                  <Text style={styles.summaryItemTitle}>{b.make || b.carDetails?.make || "Car"} {b.model || b.carDetails?.model || ""}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.summaryItemMeta}>{b.pickupP || "—"} <Ionicons name="arrow-forward" size={10} color={colors.textMuted}/> {b.dropP || "—"}</Text>
                    <Text style={styles.summaryStatusBadge}>{b.rideStatus || "Pending"}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Compact Sub-components
function Section({ title, children, actionLabel, actionIcon, onAction, pad }: any) {
  return (
    <View style={{ paddingHorizontal: pad, marginTop: 24 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {(actionLabel || actionIcon) && (
          <TouchableOpacity onPress={onAction} style={styles.sectionActionBtn}>
            {actionIcon ? <Ionicons name={actionIcon} size={20} color={colors.primary} /> : <Text style={styles.sectionActionText}>{actionLabel}</Text>}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value, mono, isLast }: any) {
  return (
    <View style={[styles.infoRow, !isLast && styles.borderBottom]}>
      <View style={styles.rowIconBg}><Ionicons name={icon} size={16} color={colors.primary} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.monoText]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function QuickCard({ label, value, icon, onPress, w }: any) {
  return (
    <TouchableOpacity style={[styles.quickCard, { width: w }]} onPress={onPress}>
      <View style={styles.quickIconWrap}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View>
        <Text style={styles.quickValue}>{value}</Text>
        <Text style={styles.quickLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function RideRow({ booking, onPress, isLast }: any) {
  const cfg = statusColors[booking.rideStatus || "PickupPending"] || { bg: "#F1F5F9", text: "#64748B" };
  return (
    <TouchableOpacity style={[styles.rideRow, !isLast && styles.borderBottom]} onPress={onPress}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.rideTitle} numberOfLines={1}>{booking.make || booking.carDetails?.make || "Vehicle"} {booking.model || booking.carDetails?.model || ""}</Text>
        <Text style={styles.rideMeta} numberOfLines={1}>{booking.pickupP || "—"} <Ionicons name="arrow-forward" size={10} color={colors.textMuted}/> {booking.dropP || "—"}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}><Text style={[styles.badgeText, { color: cfg.text }]}>{booking.rideStatus || "Pending"}</Text></View>
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

function EmptyState({ icon, title, text }: any) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "800", color: colors.primary },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontWeight: "500" },
  headerActionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  quickIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  quickValue: { fontSize: 18, fontWeight: "800", color: colors.text, lineHeight: 22 },
  quickLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  sectionActionBtn: { paddingVertical: 4, paddingLeft: 10 },
  sectionActionText: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, paddingHorizontal: 16, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  rowIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600", flex: 1 },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: "600", textAlign: "right", maxWidth: '50%' },
  monoText: { fontFamily: "monospace", fontSize: 12, color: colors.textMuted },
  
  rideRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rideTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  rideMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: "500" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  borderTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 },

  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 8 },
  monthBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  
  legendRow: { flexDirection: "row", gap: 12, marginBottom: 16, justifyContent: "center" },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  
  weekRow: { flexDirection: "row", marginBottom: 8, justifyContent: "space-between" },
  weekLabel: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "space-between" },
  dayCell: { borderRadius: 10, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
  dayCellActive: { backgroundColor: colors.primarySoft },
  dayCellUnavail: { backgroundColor: '#F3F4F6' },
  dayCellOwnerAvail: { backgroundColor: '#D1FAE5' },
  dayCellRange: { backgroundColor: colors.primarySoft, borderRadius: 4 },
  dayCellRangeEdge: { backgroundColor: colors.primary, borderRadius: 10 },
  dayNum: { fontSize: 14, fontWeight: "600", color: colors.text },
  dayNumActive: { color: colors.primary, fontWeight: "800" },
  dayNumUnavail: { color: '#9CA3AF' },
  dayNumEdge: { color: colors.surface, fontWeight: '800' },
  dayMeta: { fontSize: 9, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, borderRadius: 8, padding: 10, marginBottom: 12 },
  editHintText: { fontSize: 12, color: colors.primary, fontWeight: '700', flex: 1 },
  
  calEditBar: { marginTop: 16, backgroundColor: colors.inputBg, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calEditBarText: { fontSize: 12, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  calBtnGhost: { paddingHorizontal: 12, paddingVertical: 8 },
  calBtnGhostText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  calActionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  calActionText: { fontSize: 12, fontWeight: '700' },
  
  availListWrap: { marginTop: 16, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  availListTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  availRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  availRangeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  availNote: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  availDeleteBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  
  summaryCard: { marginTop: 16, backgroundColor: colors.inputBg, borderRadius: radii.lg, padding: 14 },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  summaryText: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 4 },
  summaryItemTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 },
  summaryItemMeta: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  summaryStatusBadge: { fontSize: 10, fontWeight: "700", color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  empty: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted },
  
  logoutBtn: { marginHorizontal: 16, marginTop: 32, paddingVertical: 16, borderRadius: radii.xl, backgroundColor: "#fff", borderWidth: 1, borderColor: "#FEE2E2", alignItems: "center" },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});