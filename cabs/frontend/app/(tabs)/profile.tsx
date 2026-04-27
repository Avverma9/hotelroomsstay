import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth";
import { colors, IMAGES, radii, spacing } from "../../src/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Image source={{ uri: IMAGES.authHero }} style={styles.cover} />
        <View style={styles.coverOverlay} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "U")[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name} testID="profile-name">{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Row icon="call" label="Mobile" value={user?.mobile || "—"} />
        <View style={styles.divider} />
        <Row icon="mail" label="Email" value={user?.email || "—"} />
        <View style={styles.divider} />
        <Row icon="finger-print" label="Rider ID" value={user?.id || "—"} mono />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} testID="logout-btn">
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>TravelGo • v1.0</Text>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text
          style={[styles.rowValue, mono && { fontFamily: "monospace", fontSize: 12 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderRadius: radii.xxl,
    overflow: "hidden",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  cover: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,17,40,0.55)" },
  avatarWrap: { alignItems: "center", padding: spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: colors.primary },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  email: { color: "#FFD8D9", fontSize: 13, marginTop: 2 },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.sm,
    shadowColor: "#0A1128",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: 12 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 1 },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: "600", marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },
  logoutBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
  footer: { textAlign: "center", color: colors.textLight, marginTop: spacing.lg, fontSize: 12 },
});
