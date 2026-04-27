import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, radii } from "./theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  testID,
}: Props) {
  const base: ViewStyle = {
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  };
  let bg = colors.primary;
  let text = "#fff";
  let border = "transparent";
  if (variant === "secondary") {
    bg = colors.primarySoft;
    text = colors.primary;
  } else if (variant === "outline") {
    bg = "transparent";
    text = colors.text;
    border = colors.border;
  }
  if (disabled || loading) {
    bg = variant === "primary" ? "#F4B5B8" : bg;
  }

  return (
    <TouchableOpacity
      testID={testID}
      disabled={disabled || loading}
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        base,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === "outline" ? 1.5 : 0 },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text style={[styles.text, { color: text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});

export function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "#FEF3C7", text: "#D97706" },
    Confirmed: { bg: "#D1FAE5", text: "#059669" },
    InProgress: { bg: "#DBEAFE", text: "#2563EB" },
    AwaitingPickup: { bg: "#DBEAFE", text: "#2563EB" },
    AwaitingConfirmation: { bg: "#FEF3C7", text: "#D97706" },
    Completed: { bg: "#E0E7FF", text: "#4F46E5" },
    Cancelled: { bg: "#FEE2E2", text: "#DC2626" },
    Failed: { bg: "#FEE2E2", text: "#DC2626" },
  };
  const s = status && map[status] ? map[status] : { bg: "#F1F5F9", text: "#64748B" };
  return (
    <View style={[pillStyles.wrap, { backgroundColor: s.bg }]}>
      <Text style={[pillStyles.txt, { color: s.text }]}>{status || "Unknown"}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  txt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
});
