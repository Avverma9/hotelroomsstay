import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { baseURL } from "../utils/baseUrl";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

function BgBubbles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.bubble, { width: 280, height: 280, borderRadius: 140, top: -60, right: -70, backgroundColor: "rgba(255,255,255,0.18)" }]} />
      <View style={[styles.bubble, { width: 200, height: 200, borderRadius: 100, bottom: 80, left: -60, backgroundColor: "rgba(255,255,255,0.12)" }]} />
      <View style={[styles.bubble, { width: 100, height: 100, borderRadius: 50, top: 120, left: 20, backgroundColor: "rgba(255,255,255,0.10)" }]} />
      <View style={[styles.bubble, { width: 130, height: 130, borderRadius: 65, bottom: 200, right: 10, backgroundColor: "rgba(255,255,255,0.10)" }]} />
      <View style={[styles.bubble, { width: 40, height: 40, borderRadius: 20, top: 300, right: 40, backgroundColor: "rgba(255,255,255,0.15)" }]} />
      <View style={[styles.bubble, { width: 24, height: 24, borderRadius: 12, top: 200, left: 180, backgroundColor: "rgba(255,255,255,0.20)" }]} />
    </View>
  );
}

function BgIcons() {
  const icons = [
    { name: "airplane-outline", top: 60, left: 24, size: 20, opacity: 0.18, rotate: "-25deg" },
    { name: "bed-outline", top: 110, right: 30, size: 18, opacity: 0.15, rotate: "10deg" },
    { name: "compass-outline", top: 260, left: 18, size: 16, opacity: 0.18, rotate: "0deg" },
    { name: "map-outline", top: 310, right: 22, size: 18, opacity: 0.14, rotate: "-15deg" },
    { name: "restaurant-outline", bottom: 280, left: 26, size: 16, opacity: 0.15, rotate: "8deg" },
    { name: "camera-outline", bottom: 240, right: 28, size: 18, opacity: 0.14, rotate: "-10deg" },
    { name: "umbrella-outline", bottom: 160, left: 60, size: 14, opacity: 0.16, rotate: "5deg" },
    { name: "wine-outline", top: 180, right: 60, size: 14, opacity: 0.16, rotate: "-5deg" },
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {icons.map((ic, i) => {
        const pos = {};
        if (ic.top !== undefined) pos.top = ic.top;
        if (ic.bottom !== undefined) pos.bottom = ic.bottom;
        if (ic.left !== undefined) pos.left = ic.left;
        if (ic.right !== undefined) pos.right = ic.right;
        return (
          <View key={i} style={[{ position: "absolute", opacity: ic.opacity, transform: [{ rotate: ic.rotate }] }, pos]}>
            <Ionicons name={ic.name} size={ic.size} color="#ffffff" />
          </View>
        );
      })}
    </View>
  );
}

function CountryCodePicker({ selectedCode, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === selectedCode);
  return (
    <>
      <TouchableOpacity
        style={[styles.countryButton, disabled && { opacity: 0.5 }]}
        disabled={disabled}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 18 }}>{selected?.flag}</Text>
        <Text style={styles.countryButtonText}>{selectedCode}</Text>
        <Ionicons name="chevron-down" size={11} color="#0ea882" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.countryModal}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={17} color="#2d7a6a" />
              </TouchableOpacity>
            </View>
            {COUNTRY_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.countryItem, item.code === selectedCode && styles.countryItemActive]}
                onPress={() => { onSelect(item.code); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>{item.flag}</Text>
                <Text style={styles.countryItemName}>{item.name}</Text>
                <Text style={styles.countryItemCode}>{item.code}</Text>
                {item.code === selectedCode && <Ionicons name="checkmark-circle" size={16} color="#0ea882" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function SixDigitOTP({ value, onComplete, disabled }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const refs = useRef([]);

  useEffect(() => {
    if (!value) { setDigits(Array(6).fill("")); return; }
    if (value.length === 6) setDigits(value.split(""));
  }, [value]);

  const onChange = (i, text) => {
    if (!/^[0-9]?$/.test(text)) return;
    const next = [...digits];
    next[i] = text;
    setDigits(next);
    if (text && i < 5) refs.current[i + 1]?.focus();
    const joined = next.join("");
    onComplete(joined.length === 6 ? joined : "");
  };

  const onKey = (i, key) => {
    if (key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          onChangeText={(t) => onChange(i, t)}
          onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
          style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectionColor="#0ea882"
        />
      ))}
    </View>
  );
}

export default function LoginPage({ navigation }) {
  const { signIn } = useAuth();

  const [mode, setMode] = useState("password");
  const [authMethod, setAuthMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(-30)).current;
  const cardY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, tension: 45, friction: 9, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const toast = (type, t1, t2) =>
    Toast.show({ type, text1: t1, text2: t2, position: "top", visibilityTime: 3000 });

  const extractAuth = (res) => {
    const b = res?.data || {};
    const n = b?.data && typeof b.data === "object" ? b.data : {};
    return {
      token: b?.rsToken || n?.rsToken || b?.token || n?.token || "",
      userId: b?.userId || n?.userId || "",
      email: b?.email || n?.email || email || "",
    };
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) { toast("error", "Required", "Enter email and password."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/signIn`, { email, password });
      const auth = extractAuth(res);
      if (!auth.token || !auth.userId) throw new Error("Missing credentials.");
      await signIn(auth.token, auth.userId, auth.email);
      toast("success", "Welcome Back!", "Logged in successfully.");
    } catch (err) {
      toast("error", "Login Failed", err.response?.data?.message || "Invalid credentials.");
    } finally { setLoading(false); }
  };

  const requestOtp = async () => {
    if (authMethod === "email" && !email) { toast("error", "Required", "Enter your email."); return; }
    if (authMethod === "mobile" && !phone) { toast("error", "Required", "Enter your mobile number."); return; }
    setLoading(true);
    try {
      let res;
      if (authMethod === "email") {
        res = await axios.post(`${baseURL}/mail/send-otp`, { email, loginType: "user" });
      } else {
        res = await axios.post(`${baseURL}/send-otp`, { phoneNumber: `${countryCode}${phone}` });
      }
      toast("success", "OTP Sent", res.data?.message || "Check your inbox.");
      setOtpSent(true);
      setResendTimer(60);
    } catch (err) {
      toast("error", "Failed", err.response?.data?.message || "Could not send OTP.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast("error", "Invalid", "Enter the 6-digit code."); return; }
    setLoading(true);
    try {
      let res;
      if (authMethod === "email") {
        res = await axios.post(`${baseURL}/mail/verify-otp`, { email, otp, loginType: "user" });
      } else {
        const fp = `${countryCode}${phone}`;
        res = await axios.post(`${baseURL}/verify-otp`, { phoneNumber: fp, mobile: fp, code: otp });
      }
      const auth = extractAuth(res);
      if (!auth.token || !auth.userId) throw new Error("Missing credentials.");
      await signIn(auth.token, auth.userId, auth.email);
      toast("success", "Welcome!", "Authenticated successfully.");
    } catch (err) {
      toast("error", "Verification Failed", err.response?.data?.message || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  const onSubmit = () => {
    if (mode === "password") { handlePasswordLogin(); return; }
    if (!otpSent) requestOtp(); else verifyOtp();
  };

  const submitDisabled = loading || (mode === "otp" && otpSent && otp.length !== 6);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Full vivid teal-green gradient covers entire screen */}
      <LinearGradient
        colors={["#0f9b8a", "#13b89e", "#0ea882", "#0d9b75"]}
        locations={[0, 0.3, 0.65, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <BgBubbles />
      <BgIcons />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* BRAND HEADER */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: logoY }] }]}>
              <View style={styles.logoBadge}>
                <LinearGradient colors={["#ffffff", "#edfaf6"]} style={styles.logoBadgeInner}>
                  <Ionicons name="business" size={28} color="#0ea882" />
                </LinearGradient>
              </View>
              <Text style={styles.brandName}>HotelRoomsStay</Text>
              <View style={styles.taglineRow}>
                <View style={styles.taglineDot} />
                <Text style={styles.tagline}>Luxury  ·  Comfort  ·  Travel</Text>
                <View style={styles.taglineDot} />
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color="rgba(255,255,255,0.65)" style={{ marginHorizontal: 2 }} />
                ))}
              </View>
            </Animated.View>

            {/* LOGIN CARD */}
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: cardY }] }]}>
         
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSub}>Sign in to your account</Text>

                {/* Mode toggle */}
                <View style={styles.modeWrap}>
                  {[
                    { key: "password", label: "Password", icon: "key-outline" },
                    { key: "otp", label: "OTP Login", icon: "phone-portrait-outline" },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
                      onPress={() => { setMode(m.key); setOtpSent(false); }}
                      activeOpacity={0.8}
                    >
                      {mode === m.key && (
                        <LinearGradient
                          colors={["#0ea882", "#13b89e"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Ionicons name={m.icon} size={14} color={mode === m.key ? "#fff" : "#6ab8a8"} />
                      <Text style={[styles.modeBtnText, mode === m.key && { color: "#fff" }]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* OTP sub method */}
                {mode === "otp" && !otpSent && (
                  <View style={styles.subWrap}>
                    {[
                      { key: "email", label: "Email OTP", icon: "mail-outline" },
                      { key: "mobile", label: "Mobile OTP", icon: "call-outline" },
                    ].map((a) => (
                      <TouchableOpacity
                        key={a.key}
                        style={[styles.subBtn, authMethod === a.key && styles.subBtnActive]}
                        onPress={() => setAuthMethod(a.key)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={a.icon} size={13} color={authMethod === a.key ? "#0ea882" : "#a0c8c0"} />
                        <Text style={[styles.subBtnText, authMethod === a.key && styles.subBtnTextActive]}>
                          {a.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Email */}
                {(mode === "password" || authMethod === "email") && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="mail-outline" size={17} color="#0ea882" />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        editable={!(mode === "otp" && otpSent)}
                        placeholder="Enter your email"
                        placeholderTextColor="#b0d8d0"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        selectionColor="#0ea882"
                      />
                    </View>
                  </View>
                )}

                {/* Mobile */}
                {mode === "otp" && authMethod === "mobile" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>MOBILE NUMBER</Text>
                    <View style={styles.phoneRow}>
                      <CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} disabled={otpSent} />
                      <View style={[styles.inputBox, { flex: 1 }]}>
                        <View style={styles.inputIconWrap}>
                          <Ionicons name="call-outline" size={17} color="#0ea882" />
                        </View>
                        <TextInput
                          value={phone}
                          onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
                          editable={!otpSent}
                          placeholder="Mobile number"
                          placeholderTextColor="#b0d8d0"
                          keyboardType="phone-pad"
                          style={styles.input}
                          selectionColor="#0ea882"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Password */}
                {mode === "password" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="lock-closed-outline" size={17} color="#0ea882" />
                      </View>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#b0d8d0"
                        style={styles.input}
                        selectionColor="#0ea882"
                      />
                      <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#7ab5ad" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* OTP entry */}
                {mode === "otp" && otpSent && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>VERIFICATION CODE</Text>
                    <Text style={styles.otpHint}>
                      Code sent to your {authMethod === "email" ? "email" : "mobile"}
                    </Text>
                    <SixDigitOTP disabled={loading} value={otp} onComplete={setOtp} />
                  </View>
                )}

                {/* Submit button */}
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={submitDisabled}
                  activeOpacity={0.85}
                  style={{ opacity: submitDisabled ? 0.55 : 1, marginTop: 6 }}
                >
                  <LinearGradient
                    colors={["#0d9e85", "#13b89e", "#10c99a"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {mode === "password" ? "Sign In" : otpSent ? "Verify & Sign In" : "Send OTP"}
                        </Text>
                        <View style={styles.submitArrow}>
                          <Ionicons name="arrow-forward" size={15} color="#0ea882" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend */}
                {mode === "otp" && otpSent && (
                  <View style={styles.resendWrap}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimer}>
                        Resend in <Text style={styles.resendNum}>{resendTimer}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={requestOtp} activeOpacity={0.7}>
                        <Text style={styles.resendLink}>↺  Resend Code</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Divider */}
                <View style={styles.divRow}>
                  <View style={styles.divLine} />
                  <Text style={styles.divText}>or</Text>
                  <View style={styles.divLine} />
                </View>

                {/* Register link */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  style={styles.registerBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.registerText}>
                    New here?{" "}
                    <Text style={styles.registerLink}>Create an Account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
              © 2025 HotelRoomsStay · Premium Travel Experience
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  bubble: { position: "absolute" },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center",
  },

  // Header
  header: { alignItems: "center", marginBottom: 26 },
  logoBadge: {
    width: 72, height: 72, borderRadius: 22,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  logoBadgeInner: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 11, letterSpacing: 1.5, fontWeight: "500" },
  starsRow: { flexDirection: "row", alignItems: "center" },

  // Card
  card: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  cardAccentBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cardAccentText: { color: "#fff", fontSize: 11, letterSpacing: 3, fontWeight: "700" },
  cardAccentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  cardBody: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 },
  cardTitle: {
    color: "#0a4035",
    fontSize: 24,
    fontWeight: "800",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    marginBottom: 3,
  },
  cardSub: { color: "#7ab5ad", fontSize: 13, marginBottom: 20 },

  // Mode toggle
  modeWrap: {
    flexDirection: "row",
    backgroundColor: "#f0fdf8",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#c8ece6",
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    overflow: "hidden",
  },
  modeBtnText: { color: "#6ab8a8", fontSize: 13, fontWeight: "700" },

  // Sub toggle
  subWrap: { flexDirection: "row", gap: 8, marginBottom: 16 },
  subBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    backgroundColor: "#f5fdfb",
  },
  subBtnActive: { borderColor: "#0ea882", backgroundColor: "#e6f8f3" },
  subBtnText: { color: "#a0c8c0", fontSize: 12, fontWeight: "600" },
  subBtnTextActive: { color: "#0ea882" },

  // Fields
  fieldGroup: { marginBottom: 14 },
  label: { color: "#7ab5ad", fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 7 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5fdfb",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    height: 52,
    overflow: "hidden",
  },
  inputIconWrap: {
    width: 46, height: "100%",
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "#ddf2ee",
  },
  input: {
    flex: 1,
    color: "#0a4035",
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 14,
  },
  eyeBtn: { paddingHorizontal: 14 },

  // Phone
  phoneRow: { flexDirection: "row", gap: 8 },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5fdfb",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    paddingHorizontal: 10,
    height: 52,
    minWidth: 88,
  },
  countryButtonText: { color: "#0ea882", fontSize: 13, fontWeight: "700" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  countryModal: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#c8ece6",
  },
  countryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5f2",
  },
  countryModalTitle: { color: "#0a4035", fontSize: 15, fontWeight: "700" },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#f0faf8",
    alignItems: "center", justifyContent: "center",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2fbf8",
  },
  countryItemActive: { backgroundColor: "#edfaf5" },
  countryItemName: { flex: 1, color: "#2d6b5f", fontSize: 14 },
  countryItemCode: { color: "#0ea882", fontSize: 14, fontWeight: "700" },

  // OTP
  otpHint: { color: "#96b8b4", fontSize: 12, marginBottom: 10 },
  otpRow: { flexDirection: "row", gap: 6 },
  otpBox: {
    flex: 1, height: 52,
    backgroundColor: "#f5fdfb",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    textAlign: "center",
    fontSize: 20, fontWeight: "700",
    color: "#0a4035",
  },
  otpBoxFilled: { borderColor: "#0ea882", backgroundColor: "#e6f8f3" },

  // Submit
  submitBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#0ea882",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  submitText: { color: "#ffffff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  submitArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },

  // Resend
  resendWrap: { alignItems: "center", marginTop: 10 },
  resendTimer: { color: "#96b8b4", fontSize: 12 },
  resendNum: { color: "#0ea882", fontWeight: "700" },
  resendLink: { color: "#0ea882", fontSize: 13, fontWeight: "700" },

  // Divider
  divRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: "#daf0ea" },
  divText: { color: "#96b8b4", fontSize: 13, fontWeight: "600" },

  // Register
  registerBtn: { alignItems: "center", paddingVertical: 4 },
  registerText: { color: "#7ab5ad", fontSize: 14 },
  registerLink: { color: "#0ea882", fontWeight: "800" },

  // Footer
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 20,
  },
});