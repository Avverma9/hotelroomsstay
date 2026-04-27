import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { colors, radii, spacing } from "../../src/theme";
import Button from "../../src/ui";

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    setErr(null);
    if (!name.trim() || !email.trim() || !password || !mobile.trim()) {
      setErr("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be 6+ characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: mobile.trim(),
      });
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
          <TouchableOpacity style={styles.back} onPress={() => router.back()} testID="signup-back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start booking rides in minutes</Text>

          <Field label="Full name" value={name} onChange={setName} placeholder="Aman Sharma" testID="signup-name-input" />
          <Field
            label="Mobile"
            value={mobile}
            onChange={setMobile}
            placeholder="9876543210"
            keyboardType="phone-pad"
            testID="signup-mobile-input"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            testID="signup-email-input"
          />

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                testID="signup-password-input"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!show}
                style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
              />
              <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.eye}>
                <Ionicons name={show ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {err ? (
            <Text style={styles.err} testID="signup-error">
              {err}
            </Text>
          ) : null}

          <Button
            title="Create Account"
            onPress={onSignup}
            loading={loading}
            testID="signup-submit-button"
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity testID="go-login-link">
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        testID={props.testID}
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={props.keyboardType}
        autoCapitalize={props.keyboardType === "email-address" ? "none" : "words"}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  back: { width: 40, height: 40, justifyContent: "center", marginBottom: spacing.sm },
  title: { fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
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
});
