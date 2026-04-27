import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
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
import { formatApiError, useAuth } from "../../src/auth";
import { colors, IMAGES, radii, spacing } from "../../src/theme";
import Button from "../../src/ui";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setErr(null);
    if (!email.trim() || !password) {
      setErr("Please fill email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.heroWrap}>
            <Image source={{ uri: IMAGES.authHero }} style={styles.hero} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroBadge} testID="brand-badge">HRS CABS · RIDER</Text>
              <Text style={styles.heroTitle}>Rider{"\n"}Portal</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Rider Login</Text>
            <Text style={styles.subtitle}>This app is for registered Riders only</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="login-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  testID="login-password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!show}
                  style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
                />
                <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.eye} testID="toggle-pw">
                  <Ionicons name={show ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {err ? (
              <Text style={styles.err} testID="login-error">
                {err}
              </Text>
            ) : null}

            <Button
              title="Login"
              onPress={onLogin}
              loading={loading}
              testID="login-submit-button"
              style={{ marginTop: spacing.md }}
            />

            <Text style={styles.riderNote}>Only accounts with the Rider role can login.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  heroWrap: {
    height: 240,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radii.xxl,
    overflow: "hidden",
    position: "relative",
  },
  hero: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,17,40,0.35)",
  },
  heroTextWrap: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.lg,
  },
  heroBadge: {
    color: "#FFD8D9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  form: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: colors.textMuted, fontSize: 14 },
  field: { marginTop: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 56,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    paddingRight: 12,
  },
  eye: { padding: 8 },
  err: { color: "#DC2626", marginTop: spacing.sm, fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerMuted: { color: colors.textMuted },
  footerLink: { color: colors.primary, fontWeight: "700" },
  riderNote: { textAlign: "center", marginTop: spacing.md, fontSize: 12, color: colors.textLight, lineHeight: 18 },
});
