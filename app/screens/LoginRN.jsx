import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { baseURL } from "../utils/baseUrl";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");

const THEME = {
  bg: "#FFFFFF",
  cardBg: "#FFFFFF",
  primary: "#0D9488", // Fresh Emerald Teal
  primaryLight: "#14B8A6",
  accentSoft: "#F0FDFA",
  textMain: "#0F172A",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",
  inputBg: "#F8FAFC",
  borderColor: "#E2E8F0",
  borderActive: "#0D9488",
  doodleColor: "#CBD5E1", // Soft slate for light doodles
};

const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

function HotelFoodDoodles() {
  const doodles = [
    { type: "material", name: "silverware-fork-knife", top: 40, left: 24, size: 22, rotate: "-15deg" },
    { type: "ion", name: "bed-outline", top: 90, right: 30, size: 24, rotate: "12deg" },
    { type: "material", name: "coffee-outline", top: 180, left: 35, size: 20, rotate: "-8deg" },
    { type: "material", name: "room-service-outline", top: 240, right: 28, size: 24, rotate: "15deg" },
    { type: "ion", name: "wine-outline", top: 340, left: 20, size: 22, rotate: "-12deg" },
    { type: "material", name: "food", top: 410, right: 35, size: 22, rotate: "18deg" },
    { type: "ion", name: "key-outline", bottom: 220, left: 32, size: 20, rotate: "25deg" },
    { type: "material", name: "cupcake", bottom: 160, right: 40, size: 22, rotate: "-14deg" },
    { type: "ion", name: "restaurant-outline", bottom: 90, left: 28, size: 22, rotate: "10deg" },
    { type: "material", name: "glass-cocktail", bottom: 50, right: 30, size: 22, rotate: "-15deg" },
    { type: "ion", name: "compass-outline", top: 130, left: 160, size: 18, rotate: "5deg" },
    { type: "material", name: "pizza", bottom: 300, right: 18, size: 20, rotate: "-20deg" },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {doodles.map((d, index) => {
        const stylePos = {
          position: "absolute",
          top: d.top,
          bottom: d.bottom,
          left: d.left,
          right: d.right,
          transform: [{ rotate: d.rotate }],
          opacity: 0.35,
        };
        return (
          <View key={index} style={stylePos}>
            {d.type === "ion" ? (
              <Ionicons name={d.name} size={d.size} color={THEME.doodleColor} />
            ) : (
              <MaterialCommunityIcons name={d.name} size={d.size} color={THEME.doodleColor} />
            )}
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
        style={[styles.countryTrigger, disabled && { opacity: 0.5 }]}
        disabled={disabled}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 18 }}>{selected?.flag}</Text>
        <Text style={styles.countryTriggerText}>{selectedCode}</Text>
        <Ionicons name="chevron-down" size={12} color={THEME.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.countryModalCard}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={16} color={THEME.textMain} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryOption, item.code === selectedCode && styles.countryOptionSelected]}
                  onPress={() => {
                    onSelect(item.code);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{item.flag}</Text>
                  <Text style={styles.countryOptionName}>{item.name}</Text>
                  <Text style={styles.countryOptionCode}>{item.code}</Text>
                  {item.code === selectedCode && (
                    <Ionicons name="checkmark-circle" size={18} color={THEME.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
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
    if (!value) {
      setDigits(Array(6).fill(""));
      return;
    }
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
    <View style={styles.otpContainer}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChangeText={(t) => onChange(i, t)}
          onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
          style={[styles.otpInput, d ? styles.otpInputFilled : null]}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectionColor={THEME.primary}
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
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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
    if (!email || !password) {
      toast("error", "Required", "Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/signIn`, { email, password });
      const auth = extractAuth(res);
      if (!auth.token || !auth.userId) throw new Error("Missing credentials.");
      await signIn(auth.token, auth.userId, auth.email, res.data?.refreshToken);
      toast("success", "Welcome Back", "Signed in successfully.");
    } catch (err) {
      toast("error", "Login Failed", err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (authMethod === "email" && !email) {
      toast("error", "Required", "Enter your email.");
      return;
    }
    if (authMethod === "mobile" && !phone) {
      toast("error", "Required", "Enter your mobile number.");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (authMethod === "email") {
        res = await axios.post(`${baseURL}/mail/send-otp`, { email, loginType: "user" });
      } else {
        res = await axios.post(`${baseURL}/send-otp`, { phoneNumber: `${countryCode}${phone}` });
      }
      toast("success", "OTP Sent", res.data?.message || "Verification code dispatched.");
      setOtpSent(true);
      setResendTimer(60);
    } catch (err) {
      toast("error", "Failed", err.response?.data?.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast("error", "Invalid", "Enter the 6-digit code.");
      return;
    }
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
      await signIn(auth.token, auth.userId, auth.email, res.data?.refreshToken);
      toast("success", "Verified", "Access granted.");
    } catch (err) {
      toast("error", "Verification Failed", err.response?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    if (mode === "password") {
      handlePasswordLogin();
      return;
    }
    if (!otpSent) requestOtp();
    else verifyOtp();
  };

  const submitDisabled = loading || (mode === "otp" && otpSent && otp.length !== 6);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Crisp White Background with Doodles */}
      <View style={StyleSheet.absoluteFillObject} />
      <HotelFoodDoodles />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* BRAND HEADER */}
            <Animated.View style={[styles.brandHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoBadgeContainer}>
                <LinearGradient colors={["#0D9488", "#14B8A6"]} style={styles.logoBadge}>
                  <MaterialCommunityIcons name="office-building" size={26} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.brandTitle}>HotelRoomsStay</Text>
              <Text style={styles.brandSubtitle}>STAY & DINE EXPERIENCES</Text>
            </Animated.View>

            {/* FORM CARD */}
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.greetingTitle}>Welcome Back</Text>
                <Text style={styles.greetingSub}>Please sign in to access your reservations</Text>
              </View>

              {/* SEGMENTED CONTROL */}
              <View style={styles.segmentContainer}>
                {[
                  { key: "password", label: "Password", icon: "lock-closed-outline" },
                  { key: "otp", label: "Fast OTP", icon: "phone-portrait-outline" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.segmentBtn, mode === item.key && styles.segmentBtnActive]}
                    onPress={() => {
                      setMode(item.key);
                      setOtpSent(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={mode === item.key ? THEME.primary : THEME.textMuted}
                    />
                    <Text style={[styles.segmentBtnText, mode === item.key && styles.segmentBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* OTP DELIVERY SELECTOR */}
              {mode === "otp" && !otpSent && (
                <View style={styles.otpPillWrap}>
                  {[
                    { key: "email", label: "Email Passcode", icon: "mail-outline" },
                    { key: "mobile", label: "SMS Passcode", icon: "chatbubble-ellipses-outline" },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.otpPill, authMethod === m.key && styles.otpPillActive]}
                      onPress={() => setAuthMethod(m.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={m.icon}
                        size={14}
                        color={authMethod === m.key ? THEME.primary : THEME.textMuted}
                      />
                      <Text style={[styles.otpPillText, authMethod === m.key && styles.otpPillTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* EMAIL FIELD */}
              {(mode === "password" || authMethod === "email") && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={17} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      editable={!(mode === "otp" && otpSent)}
                      placeholder="e.g. yourname@domain.com"
                      placeholderTextColor={THEME.textSubtle}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                      selectionColor={THEME.primary}
                    />
                  </View>
                </View>
              )}

              {/* MOBILE FIELD */}
              {mode === "otp" && authMethod === "mobile" && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>MOBILE NUMBER</Text>
                  <View style={styles.phoneRow}>
                    <CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} disabled={otpSent} />
                    <View style={[styles.inputWrap, { flex: 1 }]}>
                      <Ionicons name="call-outline" size={17} color={THEME.textSubtle} style={styles.inputIcon} />
                      <TextInput
                        value={phone}
                        onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
                        editable={!otpSent}
                        placeholder="Mobile number"
                        placeholderTextColor={THEME.textSubtle}
                        keyboardType="phone-pad"
                        style={styles.input}
                        selectionColor={THEME.primary}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* PASSWORD FIELD */}
              {mode === "password" && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={17} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={THEME.textSubtle}
                      style={styles.input}
                      selectionColor={THEME.primary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeToggle}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={17}
                        color={THEME.textSubtle}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OTP DIGIT SECTION */}
              {mode === "otp" && otpSent && (
                <View style={styles.fieldBlock}>
                  <View style={styles.otpMetaRow}>
                    <Text style={styles.label}>ENTER 6-DIGIT CODE</Text>
                    <Text style={styles.targetInfo}>
                      {authMethod === "email" ? email : `${countryCode} ${phone}`}
                    </Text>
                  </View>
                  <SixDigitOTP disabled={loading} value={otp} onComplete={setOtp} />
                </View>
              )}

              {/* ACTION BUTTON */}
              <TouchableOpacity
                onPress={onSubmit}
                disabled={submitDisabled}
                activeOpacity={0.85}
                style={[styles.actionBtn, submitDisabled && styles.actionBtnDisabled]}
              >
                <LinearGradient
                  colors={["#0D9488", "#14B8A6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>
                        {mode === "password" ? "Sign In" : otpSent ? "Verify & Proceed" : "Send Verification Code"}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* RESEND LINK */}
              {mode === "otp" && otpSent && (
                <View style={styles.resendBlock}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimer}>
                      Request another code in <Text style={styles.timerHighlight}>{resendTimer}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={requestOtp} activeOpacity={0.7}>
                      <Text style={styles.resendAction}>Resend Passcode</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* DIVIDER */}
              <View style={styles.dividerBlock}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* REGISTER REDIRECT */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                style={styles.signupButton}
                activeOpacity={0.7}
              >
                <Text style={styles.signupText}>
                  Don’t have an account? <Text style={styles.signupHighlight}>Create One</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* BRAND FOOTER */}
            <Animated.Text style={[styles.pageFooter, { opacity: fadeAnim }]}>
              © 2026 HotelRoomsStay • Curated Hospitality
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center",
  },

  // Brand Header
  brandHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadgeContainer: {
    marginBottom: 10,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.textMain,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: THEME.textMuted,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 18,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.textMain,
  },
  greetingSub: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 3,
  },

  // Segment
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  segmentBtnTextActive: {
    color: THEME.primary,
    fontWeight: "700",
  },

  // OTP Pills
  otpPillWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  otpPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    backgroundColor: THEME.inputBg,
  },
  otpPillActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.accentSoft,
  },
  otpPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.textMuted,
  },
  otpPillTextActive: {
    color: THEME.primary,
    fontWeight: "700",
  },

  // Fields
  fieldBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: THEME.textMuted,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.textMain,
    fontWeight: "500",
  },
  eyeToggle: {
    padding: 6,
  },

  // Phone
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  countryTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    paddingHorizontal: 10,
    height: 48,
  },
  countryTriggerText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMain,
  },

  // OTP Fields
  otpMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  targetInfo: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: "500",
  },
  otpContainer: {
    flexDirection: "row",
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 50,
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderColor,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textMain,
  },
  otpInputFilled: {
    borderColor: THEME.primary,
    backgroundColor: THEME.accentSoft,
  },

  // Action Button
  actionBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },

  // Resend
  resendBlock: {
    alignItems: "center",
    marginTop: 10,
  },
  resendTimer: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  timerHighlight: {
    fontWeight: "700",
    color: THEME.primary,
  },
  resendAction: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.primary,
  },

  // Divider
  dividerBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.borderColor,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSubtle,
  },

  // Signup
  signupButton: {
    alignItems: "center",
  },
  signupText: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  signupHighlight: {
    color: THEME.primary,
    fontWeight: "700",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  countryModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    maxHeight: 380,
    overflow: "hidden",
  },
  countryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderColor,
  },
  countryModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textMain,
  },
  modalCloseBtn: {
    padding: 4,
  },
  countryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  countryOptionSelected: {
    backgroundColor: THEME.accentSoft,
  },
  countryOptionName: {
    flex: 1,
    fontSize: 14,
    color: THEME.textMain,
  },
  countryOptionCode: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
  },

  // Footer
  pageFooter: {
    textAlign: "center",
    color: THEME.textSubtle,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
    marginTop: 18,
  },
});
