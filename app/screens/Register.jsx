import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { baseURL } from "../utils/baseUrl";

const { width } = Dimensions.get("window");

const THEME = {
  bg: "#FFFFFF",
  cardBg: "#FFFFFF",
  primary: "#0D9488",
  primaryLight: "#14B8A6",
  accentSoft: "#F0FDFA",
  textMain: "#0F172A",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",
  inputBg: "#F8FAFC",
  borderColor: "#E2E8F0",
  borderActive: "#0D9488",
  doodleColor: "#CBD5E1",
};

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

function HotelFoodDoodles() {
  const doodles = [
    { type: "material", name: "silverware-fork-knife", top: 40, left: 24, size: 22, rotate: "-15deg" },
    { type: "ion", name: "bed-outline", top: 90, right: 30, size: 24, rotate: "12deg" },
    { type: "material", name: "coffee-outline", top: 180, left: 35, size: 20, rotate: "-8deg" },
    { type: "material", name: "room-service-outline", top: 240, right: 28, size: 24, rotate: "15deg" },
    { type: "ion", name: "wine-outline", top: 340, left: 20, size: 22, rotate: "-12deg" },
    { type: "material", name: "croissant", top: 410, right: 35, size: 22, rotate: "18deg" },
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

function Field({ label, children, half }) {
  return (
    <View style={[styles.fieldBlock, half && styles.fieldHalf]}>
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
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const toast = (type, t1, t2) =>
    Toast.show({ type, text1: t1, text2: t2, position: "top", visibilityTime: 3000 });

  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Light Clean Background with Hotel Doodles */}
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

            {/* REGISTER CARD */}
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.greetingTitle}>Create an Account</Text>
                <Text style={styles.greetingSub}>Join our premier membership program</Text>
              </View>

              {/* ROW 1: Name & Mobile */}
              <View style={styles.row}>
                <Field label="FULL NAME" half>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder="John Doe"
                      placeholderTextColor={THEME.textSubtle}
                      autoCapitalize="words"
                      style={styles.input}
                      selectionColor={THEME.primary}
                    />
                  </View>
                </Field>

                <Field label="MOBILE" half>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={16} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={mobile}
                      onChangeText={(val) => setMobile(val.replace(/[^\d]/g, ""))}
                      placeholder="Phone no."
                      placeholderTextColor={THEME.textSubtle}
                      keyboardType="phone-pad"
                      style={styles.input}
                      selectionColor={THEME.primary}
                    />
                  </View>
                </Field>
              </View>

              {/* ROW 2: Email & Password */}
              <View style={styles.row}>
                <Field label="EMAIL" half>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={16} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="name@domain.com"
                      placeholderTextColor={THEME.textSubtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                      selectionColor={THEME.primary}
                    />
                  </View>
                </Field>

                <Field label="PASSWORD" half>
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={16} color={THEME.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Min 6 chars"
                      placeholderTextColor={THEME.textSubtle}
                      secureTextEntry={!showPassword}
                      style={[styles.input, { flex: 1 }]}
                      selectionColor={THEME.primary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeToggle}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={15}
                        color={THEME.textSubtle}
                      />
                    </TouchableOpacity>
                  </View>
                </Field>
              </View>

              {/* ADDRESS FIELD */}
              <Field label="ADDRESS (OPTIONAL)">
                <View style={styles.inputWrap}>
                  <Ionicons name="location-outline" size={16} color={THEME.textSubtle} style={styles.inputIcon} />
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter city or full address"
                    placeholderTextColor={THEME.textSubtle}
                    style={styles.input}
                    selectionColor={THEME.primary}
                  />
                </View>
              </Field>

              {/* PROFILE PHOTO PICKER */}
              <Field label="PROFILE PHOTO (OPTIONAL)">
                <TouchableOpacity
                  style={[styles.filePickerBox, selectedImage && styles.filePickerBoxActive]}
                  onPress={handlePickFile}
                  activeOpacity={0.8}
                >
                  <View style={styles.filePickerInner}>
                    {selectedImage?.uri ? (
                      <Image source={{ uri: selectedImage.uri }} style={styles.avatarPreview} />
                    ) : (
                      <View style={styles.fileIconCircle}>
                        <Ionicons name="image-outline" size={18} color={THEME.primary} />
                      </View>
                    )}
                    <View style={styles.fileTextWrap}>
                      <Text style={[styles.fileLabel, selectedImage && styles.fileLabelActive]}>
                        {selectedImage ? "Photo Selected" : "Upload Avatar"}
                      </Text>
                      <Text numberOfLines={1} style={styles.fileName}>
                        {selectedImage?.name || "Tap to browse image"}
                      </Text>
                    </View>
                    <Ionicons
                      name={selectedImage ? "checkmark-circle" : "chevron-forward"}
                      size={18}
                      color={selectedImage ? THEME.primary : THEME.textSubtle}
                    />
                  </View>
                </TouchableOpacity>
              </Field>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
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
                      <Text style={styles.actionBtnText}>Complete Registration</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* DIVIDER */}
              <View style={styles.dividerBlock}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* LOGIN REDIRECT */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.loginButton}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* BRAND FOOTER */}
            <Animated.Text style={[styles.pageFooter, { opacity: fadeAnim }]}>
              By signing up, you agree to our Terms & Privacy Policy
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
    marginBottom: 16,
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

  // Field & Row layout
  row: {
    flexDirection: "row",
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
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
    fontSize: 13,
    color: THEME.textMain,
    fontWeight: "500",
  },
  eyeToggle: {
    padding: 6,
  },

  // File Picker
  filePickerBox: {
    borderRadius: 12,
    backgroundColor: THEME.inputBg,
    borderWidth: 1.2,
    borderColor: THEME.borderColor,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  filePickerBoxActive: {
    borderColor: THEME.primary,
    borderStyle: "solid",
    backgroundColor: THEME.accentSoft,
  },
  filePickerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  fileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E6FFFA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPreview: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  fileTextWrap: {
    flex: 1,
  },
  fileLabel: {
    color: THEME.textMain,
    fontSize: 12,
    fontWeight: "600",
  },
  fileLabelActive: {
    color: THEME.primary,
  },
  fileName: {
    color: THEME.textSubtle,
    fontSize: 11,
    marginTop: 1,
  },

  // Action Button
  actionBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
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

  // Login link
  loginButton: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  loginHighlight: {
    color: THEME.primary,
    fontWeight: "700",
  },

  // Footer
  pageFooter: {
    textAlign: "center",
    color: THEME.textSubtle,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "500",
    marginTop: 16,
  },
});