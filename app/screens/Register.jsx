import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
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
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { baseURL } from "../utils/baseUrl";

const { width, height } = Dimensions.get("window");

const getFileNameFromUri = (uri) => {
  if (!uri) return "profile.jpg";
  const parts = uri.split("/");
  return parts[parts.length - 1] || "profile.jpg";
};

const getMimeType = (uri) => {
  const ext = (uri || "").split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
};

// Floating soft bubbles on background
function BgBubbles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.bubble, { width: 260, height: 260, borderRadius: 130, top: -55, right: -65, backgroundColor: "rgba(255,255,255,0.18)" }]} />
      <View style={[styles.bubble, { width: 190, height: 190, borderRadius: 95, bottom: 100, left: -55, backgroundColor: "rgba(255,255,255,0.12)" }]} />
      <View style={[styles.bubble, { width: 90, height: 90, borderRadius: 45, top: 140, left: 22, backgroundColor: "rgba(255,255,255,0.10)" }]} />
      <View style={[styles.bubble, { width: 110, height: 110, borderRadius: 55, bottom: 250, right: 12, backgroundColor: "rgba(255,255,255,0.10)" }]} />
      <View style={[styles.bubble, { width: 36, height: 36, borderRadius: 18, top: 320, right: 40, backgroundColor: "rgba(255,255,255,0.15)" }]} />
      <View style={[styles.bubble, { width: 22, height: 22, borderRadius: 11, top: 220, left: 170, backgroundColor: "rgba(255,255,255,0.20)" }]} />
    </View>
  );
}

// Floating travel icons
function BgIcons() {
  const icons = [
    { name: "airplane-outline", top: 55, left: 22, size: 18, opacity: 0.16, rotate: "-25deg" },
    { name: "bed-outline", top: 100, right: 28, size: 16, opacity: 0.14, rotate: "10deg" },
    { name: "compass-outline", top: 240, left: 16, size: 15, opacity: 0.16, rotate: "0deg" },
    { name: "map-outline", top: 290, right: 20, size: 16, opacity: 0.13, rotate: "-15deg" },
    { name: "restaurant-outline", bottom: 260, left: 24, size: 15, opacity: 0.14, rotate: "8deg" },
    { name: "camera-outline", bottom: 220, right: 26, size: 16, opacity: 0.13, rotate: "-10deg" },
    { name: "umbrella-outline", bottom: 150, left: 55, size: 13, opacity: 0.15, rotate: "5deg" },
    { name: "wine-outline", top: 175, right: 55, size: 13, opacity: 0.15, rotate: "-5deg" },
    { name: "key-outline", bottom: 340, right: 55, size: 14, opacity: 0.13, rotate: "20deg" },
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

// Reusable labeled field wrapper
function Field({ label, children, half }) {
  return (
    <View style={[styles.fieldGroup, half && styles.fieldHalf]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function RegisterPage({ navigation }) {
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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

  const toast = (type, t1, t2) =>
    Toast.show({ type, text1: t1, text2: t2, position: "top", visibilityTime: 3000 });

  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      setSelectedImage({
        uri: file.uri,
        name: file.fileName || getFileNameFromUri(file.uri),
        type: file.mimeType || getMimeType(file.uri),
      });
    } catch {
      toast("error", "Error", "Could not open file picker.");
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !mobile.trim() || !password.trim()) {
      toast("error", "Required", "Please fill all required fields.");
      return;
    }
    if (password.trim().length < 6) {
      toast("error", "Too Short", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userName: username.trim(),
        address: address.trim() || undefined,
        email: email.trim(),
        mobile: mobile.trim(),
        password,
      };
      let response;
      if (selectedImage?.uri) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
          }
        });
        formData.append("images", {
          uri: selectedImage.uri,
          name: selectedImage.name,
          type: selectedImage.type,
        });
        response = await axios.post(`${baseURL}/Signup`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axios.post(`${baseURL}/Signup`, payload);
      }
      toast("success", "Welcome!", response?.data?.message || "Registration successful.");
      navigation.navigate("Login");
    } catch (err) {
      toast("error", "Registration Failed", err?.response?.data?.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Full vivid teal-green gradient — same as LoginPage */}
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
            {/* ── BRAND HEADER ── */}
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

            {/* ── REGISTER CARD ── */}
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: cardY }] }]}>
              {/* Teal top accent bar */}
              <LinearGradient
                colors={["#0ea882", "#13b89e"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.cardAccentBar}
              >
                <Text style={styles.cardAccentText}>CREATE ACCOUNT</Text>
                <View style={styles.cardAccentDot} />
              </LinearGradient>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Join Us</Text>
                <Text style={styles.cardSub}>Create your free account today</Text>

                {/* Row 1: Name + Email */}
                <View style={styles.row}>
                  <Field label="FULL NAME" half>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="person-outline" size={16} color="#0ea882" />
                      </View>
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Your name"
                        placeholderTextColor="#b0d8d0"
                        autoCapitalize="words"
                        style={styles.input}
                        selectionColor="#0ea882"
                      />
                    </View>
                  </Field>

                  <Field label="EMAIL" half>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="mail-outline" size={16} color="#0ea882" />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Your email"
                        placeholderTextColor="#b0d8d0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        selectionColor="#0ea882"
                      />
                    </View>
                  </Field>
                </View>

                {/* Row 2: Mobile + Password */}
                <View style={styles.row}>
                  <Field label="MOBILE" half>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="call-outline" size={16} color="#0ea882" />
                      </View>
                      <TextInput
                        value={mobile}
                        onChangeText={(val) => setMobile(val.replace(/[^\d]/g, ""))}
                        placeholder="Mobile no."
                        placeholderTextColor="#b0d8d0"
                        keyboardType="phone-pad"
                        style={styles.input}
                        selectionColor="#0ea882"
                      />
                    </View>
                  </Field>

                  <Field label="PASSWORD" half>
                    <View style={styles.inputBox}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="lock-closed-outline" size={16} color="#0ea882" />
                      </View>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Min 6 chars"
                        placeholderTextColor="#b0d8d0"
                        secureTextEntry={!showPassword}
                        style={[styles.input, { flex: 1 }]}
                        selectionColor="#0ea882"
                      />
                      <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={17} color="#7ab5ad" />
                      </TouchableOpacity>
                    </View>
                  </Field>
                </View>

                {/* Address — full width */}
                <Field label="ADDRESS (OPTIONAL)">
                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="location-outline" size={16} color="#0ea882" />
                    </View>
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Your address"
                      placeholderTextColor="#b0d8d0"
                      style={styles.input}
                      selectionColor="#0ea882"
                    />
                  </View>
                </Field>

                {/* Profile picture */}
                <Field label="PROFILE PICTURE (OPTIONAL)">
                  <TouchableOpacity
                    style={styles.filePickerBox}
                    onPress={handlePickFile}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={selectedImage ? ["#e6f8f3", "#f0fdf9"] : ["#f5fdfb", "#f0fdf9"]}
                      style={styles.filePickerInner}
                    >
                      <View style={styles.fileIconCircle}>
                        <Ionicons
                          name={selectedImage ? "checkmark-circle" : "image-outline"}
                          size={20}
                          color={selectedImage ? "#0ea882" : "#7ab5ad"}
                        />
                      </View>
                      <View style={styles.fileTextWrap}>
                        <Text style={[styles.fileLabel, selectedImage && styles.fileLabelActive]}>
                          {selectedImage ? "Photo Selected" : "Choose Photo"}
                        </Text>
                        <Text numberOfLines={1} style={styles.fileName}>
                          {selectedImage?.name || "Tap to browse gallery"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#7ab5ad" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Field>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={{ opacity: loading ? 0.55 : 1, marginTop: 4 }}
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
                        <Text style={styles.submitText}>Create Account</Text>
                        <View style={styles.submitArrow}>
                          <Ionicons name="arrow-forward" size={15} color="#0ea882" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divRow}>
                  <View style={styles.divLine} />
                  <Text style={styles.divText}>or</Text>
                  <View style={styles.divLine} />
                </View>

                {/* Login link */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  style={styles.loginBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text style={styles.loginLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
              By continuing, you agree to our Terms & Privacy Policy
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
  header: { alignItems: "center", marginBottom: 22 },
  logoBadge: {
    width: 68, height: 68, borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  logoBadgeInner: {
    width: 68, height: 68, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    marginBottom: 7,
    textShadowColor: "rgba(0,0,0,0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 11, letterSpacing: 1.5, fontWeight: "500" },
  starsRow: { flexDirection: "row", alignItems: "center" },

  // Card
  card: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  cardAccentBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  cardAccentText: { color: "#fff", fontSize: 10, letterSpacing: 3, fontWeight: "700" },
  cardAccentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  cardBody: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  cardTitle: {
    color: "#0a4035",
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    marginBottom: 2,
  },
  cardSub: { color: "#7ab5ad", fontSize: 12, marginBottom: 18 },

  // Row layout
  row: { flexDirection: "row", gap: 10, marginBottom: 0 },
  fieldHalf: { flex: 1 },

  // Fields
  fieldGroup: { marginBottom: 12 },
  label: { color: "#7ab5ad", fontSize: 9, letterSpacing: 2, fontWeight: "700", marginBottom: 6 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5fdfb",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    height: 48,
    overflow: "hidden",
  },
  inputIconWrap: {
    width: 40, height: "100%",
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "#ddf2ee",
  },
  input: {
    flex: 1,
    color: "#0a4035",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  eyeBtn: { paddingHorizontal: 10 },

  // File picker
  filePickerBox: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#c8ece6",
    borderStyle: "dashed",
  },
  filePickerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fileIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(14,168,130,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  fileTextWrap: { flex: 1 },
  fileLabel: { color: "#7ab5ad", fontSize: 12, fontWeight: "700" },
  fileLabelActive: { color: "#0ea882" },
  fileName: { color: "#a0c8c0", fontSize: 11, marginTop: 1 },

  // Submit
  submitBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#0ea882",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  submitText: { color: "#ffffff", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  submitArrow: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },

  // Divider
  divRow: { flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: "#daf0ea" },
  divText: { color: "#96b8b4", fontSize: 12, fontWeight: "600" },

  // Login link
  loginBtn: { alignItems: "center", paddingVertical: 2 },
  loginText: { color: "#7ab5ad", fontSize: 13 },
  loginLink: { color: "#0ea882", fontWeight: "800" },

  // Footer
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 16,
  },
});