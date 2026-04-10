import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

/* â”€â”€ Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const C = {
  bg:        "#f0f4f8",
  card:      "#ffffff",
  navy:      "#1e3a5f",
  indigo:    "#6366f1",
  indigoSoft:"#eef2ff",
  text1:     "#0f172a",
  text2:     "#334155",
  text3:     "#64748b",
  text4:     "#94a3b8",
  border:    "#e2e8f0",
  green:     "#16a34a",
  greenSoft: "#dcfce7",
  red:       "#dc2626",
  redSoft:   "#fee2e2",
  amber:     "#d97706",
  amberSoft: "#fef3c7",
  teal:      "#0f9b8e",
};

/* â”€â”€ Category buckets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const QUICK_KEYS   = new Set(["checkIn", "checkOut", "paymentMode"]);
const RULE_KEYS    = new Set([
  "petsAllowed", "smokingAllowed", "alcoholAllowed",
  "bachelorAllowed", "unmarriedCouplesAllowed",
  "internationalGuestAllowed", "idProofRequired",
  "childPolicy", "extraBed",
]);
const TIMING_KEYS  = new Set(["checkIn", "checkOut"]);

/* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const parseLines = (value) =>
  String(value ?? "").trim().split(/\n+/).map((l) => l.trim()).filter(Boolean);

const parsePoint = (line) => {
  const num = line.match(/^(\d+[.)]\s*)(.+)/);
  if (num) return { type: "numbered", num: num[1].trim(), text: num[2].trim() };
  const bul = line.match(/^[â€¢\-*â–ªâ—¦]\s*(.+)/);
  if (bul) return { type: "bullet", text: bul[1].trim() };
  return { type: "plain", text: line };
};

const getSentiment = (value) => {
  const v = String(value).toLowerCase();
  if (/not allowed|not permitted|prohibited|no\b|restricted|not be/.test(v)) return "negative";
  if (/\ballowed\b|permitted|available|yes\b|included|free\b|welcome|accepted/.test(v)) return "positive";
  return "neutral";
};

/* â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* Single chip for Quick Info row */
const QuickChip = ({ icon, label, value }) => (
  <View style={styles.quickChip}>
    <View style={styles.quickChipIcon}>
      <Ionicons name={icon} size={16} color={C.indigo} />
    </View>
    <Text style={styles.quickChipLabel}>{label}</Text>
    <Text style={styles.quickChipValue}>{value}</Text>
  </View>
);

/* Allowed / Not-Allowed pill for guest rules */
const RulePill = ({ icon, label, value }) => {
  const sentiment = getSentiment(value);
  const color     = sentiment === "positive" ? C.green : sentiment === "negative" ? C.red : C.amber;
  const bg        = sentiment === "positive" ? C.greenSoft : sentiment === "negative" ? C.redSoft : C.amberSoft;
  const dotIcon   = sentiment === "positive" ? "checkmark-circle" : sentiment === "negative" ? "close-circle" : "remove-circle";
  return (
    <View style={styles.rulePill}>
      <View style={styles.rulePillLeft}>
        <View style={[styles.rulePillIconWrap, { backgroundColor: C.indigoSoft }]}>
          <Ionicons name={icon} size={14} color={C.indigo} />
        </View>
        <Text style={styles.rulePillLabel}>{label}</Text>
      </View>
      <View style={[styles.rulePillBadge, { backgroundColor: bg }]}>
        <Ionicons name={dotIcon} size={12} color={color} />
        <Text style={[styles.rulePillBadgeText, { color }]}>{value}</Text>
      </View>
    </View>
  );
};

/* Multi-line policy block with bullet / numbered support */
const PolicyBlock = ({ icon, label, value }) => {
  const lines = parseLines(value);
  const isMultiLine = lines.length > 1;
  return (
    <View style={styles.policyBlock}>
      <View style={styles.policyBlockHeader}>
        <View style={styles.policyBlockIconWrap}>
          <Ionicons name={icon} size={15} color={C.indigo} />
        </View>
        <Text style={styles.policyBlockTitle}>{label}</Text>
      </View>
      {isMultiLine ? (
        <View style={styles.policyBlockLines}>
          {lines.map((line, i) => {
            const p = parsePoint(line);
            return (
              <View key={i} style={styles.policyLine}>
                {p.type === "numbered" ? (
                  <Text style={styles.policyLineNum}>{p.num}</Text>
                ) : (
                  <View style={styles.policyLineDot} />
                )}
                <Text style={styles.policyLineText}>{p.text}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.policyBlockSingle}>{lines[0] ?? value}</Text>
      )}
    </View>
  );
};

/* â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PolicyScreen = ({ navigation, route }) => {
  const hotelName   = String(route?.params?.hotelName || "Hotel").trim();
  const policyItems = Array.isArray(route?.params?.policyItems) ? route.params.policyItems : [];

  const { quickItems, ruleItems, blockItems } = useMemo(() => {
    const quick = [], rules = [], blocks = [];
    policyItems.forEach((item) => {
      if (!item?.value) return;
      const k = item.key;
      if (QUICK_KEYS.has(k)) { quick.push(item); return; }
      if (RULE_KEYS.has(k))  { rules.push(item); return; }
      blocks.push(item);
    });
    return { quickItems: quick, ruleItems: rules, blockItems: blocks };
  }, [policyItems]);

  const isEmpty = quickItems.length + ruleItems.length + blockItems.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={C.navy} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Hotel Policies</Text>
          {!!hotelName && (
            <Text numberOfLines={1} style={styles.headerSub}>{hotelName}</Text>
          )}
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={20} color={C.indigo} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={40} color={C.text4} />
            <Text style={styles.emptyText}>No policy information available yet.</Text>
          </View>
        ) : (
          <>
            {/* â”€â”€ Quick Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {quickItems.length > 0 && (
              <View style={styles.section}>
                <SectionHeading icon="time-outline" label="Quick Info" />
                <View style={styles.quickRow}>
                  {quickItems.map((item) => (
                    <QuickChip key={item.key} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </View>
              </View>
            )}

            {/* â”€â”€ Guest Rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {ruleItems.length > 0 && (
              <View style={styles.section}>
                <SectionHeading icon="people-outline" label="Guest Rules" />
                <View style={styles.card}>
                  {ruleItems.map((item, i) => (
                    <View key={item.key}>
                      <RulePill icon={item.icon} label={item.label} value={item.value} />
                      {i < ruleItems.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* â”€â”€ Policy Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {blockItems.length > 0 && (
              <View style={styles.section}>
                <SectionHeading icon="document-text-outline" label="Policy Details" />
                <View style={styles.card}>
                  {blockItems.map((item, i) => (
                    <View key={item.key}>
                      <PolicyBlock icon={item.icon} label={item.label} value={item.value} />
                      {i < blockItems.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/* â”€â”€ Section heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SectionHeading = ({ icon, label }) => (
  <View style={styles.sectionHeading}>
    <Ionicons name={icon} size={13} color={C.indigo} />
    <Text style={styles.sectionHeadingText}>{label}</Text>
  </View>
);

/* â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 4 },
  headerText:   { flex: 1 },
  headerTitle:  { fontSize: 17, fontWeight: "800", color: C.text1, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: C.text3, marginTop: 1 },
  headerIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  scroll:       { flex: 1 },
  scrollContent:{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 30 },

  emptyWrap:    { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: C.text4, textAlign: "center" },

  section:      { marginBottom: 18 },
  sectionHeading:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  sectionHeadingText:  { fontSize: 10, fontWeight: "800", color: C.indigo, letterSpacing: 0.9, textTransform: "uppercase" },

  card:         { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  /* Quick chips */
  quickRow:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickChip:    { flex: 1, minWidth: 120, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 6 },
  quickChipIcon:{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  quickChipLabel:{ fontSize: 10, fontWeight: "700", color: C.text3, textTransform: "uppercase", letterSpacing: 0.6 },
  quickChipValue:{ fontSize: 14, fontWeight: "800", color: C.text1 },

  /* Rule pills */
  rulePill:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  rulePillLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rulePillIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rulePillLabel:{ fontSize: 13, fontWeight: "600", color: C.text2 },
  rulePillBadge:{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  rulePillBadgeText: { fontSize: 11, fontWeight: "700" },

  /* Policy blocks */
  policyBlock:  { paddingHorizontal: 16, paddingVertical: 14 },
  policyBlockHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 },
  policyBlockIconWrap: { width: 28, height: 28, borderRadius: 7, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  policyBlockTitle:    { fontSize: 13, fontWeight: "700", color: C.text1 },
  policyBlockSingle:   { fontSize: 13, color: C.text2, lineHeight: 20, paddingLeft: 37 },
  policyBlockLines:    { gap: 8, paddingLeft: 37 },
  policyLine:          { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  policyLineNum:       { fontSize: 11, fontWeight: "700", color: C.indigo, lineHeight: 19, minWidth: 18 },
  policyLineDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: C.text4, marginTop: 7 },
  policyLineText:      { flex: 1, fontSize: 13, color: C.text3, lineHeight: 19 },
});

export default PolicyScreen;

