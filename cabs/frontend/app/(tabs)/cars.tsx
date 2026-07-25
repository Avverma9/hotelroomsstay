/**
 * My Cars Tab — lists all cars owned by the logged-in Rider.
 * Tap a car to view details / edit.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyCars } from "../../src/api";
import type { Car } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, IMAGES, radii, spacing } from "../../src/theme";

export default function MyCarsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyCars();
      setCars(data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cars</Text>
        <Text style={styles.subtitle}>
          {cars.length} {cars.length === 1 ? "vehicle" : "vehicles"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} size="large" />
      ) : cars.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="car-sport-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No cars registered</Text>
          <Text style={styles.emptyText}>
            Contact your admin to register a car under your account.
          </Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/cars/${item._id}`)}
              testID={`car-card-${item._id}`}
            >
              <Image
                source={{ uri: item.images?.[0] || IMAGES.carPlaceholder }}
                style={styles.cardImg}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                {/* Header Row: Name & Status Badges */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTopTextContainer}>
                    <Text style={styles.carName} numberOfLines={1}>
                      {item.make} {item.model}
                    </Text>
                    <Text style={styles.carSub} numberOfLines={1}>
                      {item.year ? `${item.year} • ` : ""}
                      {item.color || "No Color"} • {item.vehicleType}
                    </Text>
                  </View>
                  
                  {/* Status Badges Column */}
                  <View style={styles.badgesColumn}>
                    {/* 1. Vehicle Availability */}
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: item.isAvailable ? "#E6F4EA" : "#FCE8E6" },
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: item.isAvailable ? "#1E8E3E" : "#D93025" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: item.isAvailable ? "#1E8E3E" : "#D93025" },
                        ]}
                      >
                       Vehicle Status :- {item.isAvailable ? "Available" : "Unavailable"}
                      </Text>
                    </View>

                    {/* 2. Running Status */}
                    <View style={[styles.badge, styles.runningBadge]}>
                      <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.badgeText, { color: colors.text }]}>
                       Trip Status :- {item.runningStatus || "Idle"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Info Chips Row */}
                <View style={styles.infoRow}>
                  <InfoChip icon="swap-horizontal" value={item.sharingType || "N/A"} />
                  <InfoChip icon="people" value={`${item.seater || "?"} Seats`} />
                  <InfoChip
                    icon="cash"
                    value={`₹${item.sharingType === "Shared" ? item.perPersonCost || 0 : item.price || 0}`}
                  />
                </View>

                {/* Route Row */}
                {(item.pickupP || item.dropP) && (
                  <View style={styles.routeRow}>
                    <Ionicons name="location" size={14} color={colors.primary} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {item.pickupP || "TBD"}  →  {item.dropP || "TBD"}
                    </Text>
                  </View>
                )}

                {/* Footer Row: Vehicle Number & Action */}
                <View style={styles.cardFooter}>
                  <Text style={styles.vNum}>{item.vehicleNumber || "UNREGISTERED"}</Text>
                  <View style={styles.editBtn}>
                    <Ionicons name="settings-outline" size={16} color={colors.primary} />
                    <Text style={styles.editText}>Manage</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --------------------------------------------------------
// Sub-components
// --------------------------------------------------------
function InfoChip({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.chipText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// --------------------------------------------------------
// Styles
// --------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl, 
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardImg: {
    width: "100%",
    height: 150,
    backgroundColor: colors.inputBg,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardTopTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  carName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  carSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 3,
  },
  badgesColumn: {
    alignItems: "flex-end",
    gap: 6, // Adds perfect spacing between the two badges
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
  },
  runningBadge: {
    backgroundColor: colors.inputBg,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: spacing.md,
  },
  routeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  vNum: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
});