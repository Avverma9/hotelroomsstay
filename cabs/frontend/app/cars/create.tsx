import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addCar } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing } from "../../src/theme";

const VEHICLE_TYPES = ["Car", "Bike", "Bus"] as const;
const SHARING_TYPES = ["Private", "Shared"] as const;
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
const TRANSMISSIONS = ["Automatic", "Manual"] as const;

export default function CreateRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>("Car");
  const [sharingType, setSharingType] = useState<(typeof SHARING_TYPES)[number]>("Private");
  const [fuelType, setFuelType] = useState<(typeof FUEL_TYPES)[number]>("Petrol");
  const [transmission, setTransmission] = useState<(typeof TRANSMISSIONS)[number]>("Automatic");
  const [form, setForm] = useState({
    make: "",
    model: "",
    vehicleNumber: "",
    year: String(new Date().getFullYear()),
    pickupP: "",
    dropP: "",
    pickupDate: "",
    pickupTime: "",
    dropDate: "",
    dropTime: "",
    price: "",
    perPersonCost: "",
    color: "",
    mileage: "",
    seater: "",
    ownerName: user?.name || "",
    ownerEmail: user?.email || "",
    ownerMobile: user?.mobile || "",
  });

  const pickupISO = useMemo(() => combineDateTime(form.pickupDate, form.pickupTime), [form.pickupDate, form.pickupTime]);
  const dropISO = useMemo(() => combineDateTime(form.dropDate, form.dropTime), [form.dropDate, form.dropTime]);

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.make.trim() || !form.model.trim()) {
      Alert.alert("Missing info", "Make aur model zaroor bharo.");
      return;
    }
    if (!form.pickupP.trim() || !form.dropP.trim()) {
      Alert.alert("Missing info", "Pickup aur drop point zaroor bharo.");
      return;
    }
    if (!pickupISO || !dropISO) {
      Alert.alert("Missing info", "Pickup aur drop date-time dono bharo.");
      return;
    }
    if (new Date(pickupISO).getTime() >= new Date(dropISO).getTime()) {
      Alert.alert("Invalid time", "Drop date/time pickup se baad hona chahiye.");
      return;
    }

    setSaving(true);
    try {
      await addCar({
        make: form.make.trim(),
        model: form.model.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        vehicleType,
        sharingType,
        year: Number(form.year) || new Date().getFullYear(),
        pickupP: form.pickupP.trim(),
        dropP: form.dropP.trim(),
        pickupD: pickupISO,
        dropD: dropISO,
        price: Number(form.price) || 0,
        perPersonCost: Number(form.perPersonCost) || undefined,
        color: form.color.trim() || "White",
        mileage: Number(form.mileage) || 0,
        fuelType,
        transmission,
        seater: Number(form.seater) || undefined,
        ownerName: form.ownerName.trim() || user.name || "Owner",
        ownerEmail: form.ownerEmail.trim() || user.email || "",
        ownerMobile: form.ownerMobile.trim() || user.mobile || "",
      });
      Alert.alert("Ride created", "New ride successfully create ho gaya.");
      router.replace("/(tabs)/bookings");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Ride create nahi ho paya. Dobara try karo.";
      Alert.alert("Create failed", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Create New Ride</Text>
              <Text style={styles.subtitle}>Pickup, drop, date aur time fill karke ride publish karo.</Text>
            </View>
          </View>

          <Section title="Ride Info">
            <Field label="Make" value={form.make} onChangeText={(v) => setField("make", v)} placeholder="Toyota" />
            <Field label="Model" value={form.model} onChangeText={(v) => setField("model", v)} placeholder="Innova" />
            <Field label="Vehicle Number" value={form.vehicleNumber} onChangeText={(v) => setField("vehicleNumber", v)} placeholder="DL01AB1234" />
            <Field label="Year" value={form.year} onChangeText={(v) => setField("year", v)} keyboardType="numeric" placeholder="2026" />
          </Section>

          <Section title="Route">
            <Field label="Pickup Point" value={form.pickupP} onChangeText={(v) => setField("pickupP", v)} placeholder="New Delhi Railway Station" />
            <Field label="Drop Point" value={form.dropP} onChangeText={(v) => setField("dropP", v)} placeholder="Jaipur Airport" />
            <DateTimeRow
              dateLabel="Pickup Date"
              timeLabel="Pickup Time"
              dateValue={form.pickupDate}
              timeValue={form.pickupTime}
              onDateChange={(v) => setField("pickupDate", v)}
              onTimeChange={(v) => setField("pickupTime", v)}
            />
            <DateTimeRow
              dateLabel="Drop Date"
              timeLabel="Drop Time"
              dateValue={form.dropDate}
              timeValue={form.dropTime}
              onDateChange={(v) => setField("dropDate", v)}
              onTimeChange={(v) => setField("dropTime", v)}
            />
          </Section>

          <Section title="Pricing & Vehicle">
            <PickerChips label="Vehicle Type" value={vehicleType} options={VEHICLE_TYPES} onChange={setVehicleType} />
            <PickerChips label="Sharing Type" value={sharingType} options={SHARING_TYPES} onChange={setSharingType} />
            <PickerChips label="Fuel Type" value={fuelType} options={FUEL_TYPES} onChange={setFuelType} />
            <PickerChips label="Transmission" value={transmission} options={TRANSMISSIONS} onChange={setTransmission} />
            <Field label="Price" value={form.price} onChangeText={(v) => setField("price", v)} keyboardType="numeric" placeholder="2500" />
            <Field label="Per Person Cost" value={form.perPersonCost} onChangeText={(v) => setField("perPersonCost", v)} keyboardType="numeric" placeholder="450" />
            <Field label="Seater" value={form.seater} onChangeText={(v) => setField("seater", v)} keyboardType="numeric" placeholder="6" />
            <Field label="Color" value={form.color} onChangeText={(v) => setField("color", v)} placeholder="White" />
            <Field label="Mileage" value={form.mileage} onChangeText={(v) => setField("mileage", v)} keyboardType="numeric" placeholder="16" />
          </Section>

          <Section title="Owner">
            <Field label="Owner Name" value={form.ownerName} onChangeText={(v) => setField("ownerName", v)} placeholder="Your name" />
            <Field label="Owner Email" value={form.ownerEmail} onChangeText={(v) => setField("ownerEmail", v)} placeholder="name@example.com" />
            <Field label="Owner Mobile" value={form.ownerMobile} onChangeText={(v) => setField("ownerMobile", v)} keyboardType="phone-pad" placeholder="9876543210" />
          </Section>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create New Ride</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function combineDateTime(date: string, time: string) {
  if (!date.trim() || !time.trim()) return "";
  const candidate = new Date(`${date}T${time}:00`);
  return Number.isNaN(candidate.getTime()) ? "" : candidate.toISOString();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field(props: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.textLight}
      />
    </View>
  );
}

function DateTimeRow({ dateLabel, timeLabel, dateValue, timeValue, onDateChange, onTimeChange }: any) {
  return (
    <View style={styles.dateGrid}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{dateLabel}</Text>
        <TextInput style={styles.input} placeholder="2026-07-03" placeholderTextColor={colors.textLight} value={dateValue} onChangeText={onDateChange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{timeLabel}</Text>
        <TextInput style={styles.input} placeholder="14:30" placeholderTextColor={colors.textLight} value={timeValue} onChangeText={onTimeChange} />
      </View>
    </View>
  );
}

function PickerChips({ label, value, options, onChange }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt: string) => {
          const active = value === opt;
          return (
            <TouchableOpacity key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(opt)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md },
  field: { marginBottom: spacing.sm },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  dateGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: spacing.sm },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
