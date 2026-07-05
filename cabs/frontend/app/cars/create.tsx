import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { addCar } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing } from "../../src/theme";

const VEHICLE_TYPES = ["Car", "Bike", "Bus"] as const;
const SHARING_TYPES = ["Private", "Shared"] as const;
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
const TRANSMISSIONS = ["Automatic", "Manual"] as const;
const CAR_MAKES = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Mahindra",
  "Tata",
  "Maruti Suzuki",
  "Ford",
  "BMW",
  "Mercedes",
  "Audi",
  "Volkswagen",
  "Nissan",
  "Renault",
  "Kia",
  "MG",
  "Skoda",
  "Jeep",
  "Volvo",
  "Chevrolet",
  "Mini",
  "Porsche",
  "Land Rover",
  "Jaguar",
  "Other",
] as const;

export default function CreateRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>("Car");
  const [sharingType, setSharingType] = useState<(typeof SHARING_TYPES)[number]>("Private");
  const [fuelType, setFuelType] = useState<(typeof FUEL_TYPES)[number]>("Petrol");
  const [transmission, setTransmission] = useState<(typeof TRANSMISSIONS)[number]>("Automatic");
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [pickerTarget, setPickerTarget] = useState<"pickupDate" | "pickupTime" | "dropDate" | "dropTime" | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
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
  const handleVehicleNumberChange = (value: string) => {
    const normalized = value.replace(/\s+/g, "").toUpperCase();
    setField("vehicleNumber", normalized);
  };

  const openDateTimePicker = (target: "pickupDate" | "pickupTime" | "dropDate" | "dropTime", mode: "date" | "time") => {
    const currentValue = target.includes("Date") ? parseDateInput(form[target]) : parseTimeInput(form[target]);
    setPickerTarget(target);
    setPickerMode(mode);
    setPickerValue(currentValue || new Date());
    setShowDateTimePicker(true);
  };

  const handleDateTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDateTimePicker(false);
    if (!selectedDate || !pickerTarget) return;

    const value = pickerMode === "date" ? formatDateValue(selectedDate) : formatTimeValue(selectedDate);
    setField(pickerTarget, value);
  };

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
      const normalizedVehicleNumber = form.vehicleNumber.replace(/\s+/g, "").toUpperCase();
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        vehicleNumber: normalizedVehicleNumber,
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
      };
   
      await addCar(payload);
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
            <SelectField
              label="Make"
              value={form.make || "Select make"}
              onPress={() => setShowMakePicker(true)}
            />
            <Field label="Model" value={form.model} onChangeText={(v) => setField("model", v)} placeholder="Innova" />
            <Field
              label="Vehicle Number"
              value={form.vehicleNumber}
              onChangeText={handleVehicleNumberChange}
              placeholder="DL01AB1234"
              autoCapitalize="characters"
            />
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
              onDatePress={() => openDateTimePicker("pickupDate", "date")}
              onTimePress={() => openDateTimePicker("pickupTime", "time")}
            />
            <DateTimeRow
              dateLabel="Drop Date"
              timeLabel="Drop Time"
              dateValue={form.dropDate}
              timeValue={form.dropTime}
              onDatePress={() => openDateTimePicker("dropDate", "date")}
              onTimePress={() => openDateTimePicker("dropTime", "time")}
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

      <Modal visible={showMakePicker} transparent animationType="slide" onRequestClose={() => setShowMakePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Make</Text>
              <TouchableOpacity onPress={() => setShowMakePicker(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {CAR_MAKES.map((make) => (
                <TouchableOpacity
                  key={make}
                  style={[styles.optionRow, form.make === make && styles.optionRowActive]}
                  onPress={() => {
                    setField("make", make);
                    setShowMakePicker(false);
                  }}
                >
                  <Text style={[styles.optionText, form.make === make && styles.optionTextActive]}>{make}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDateTimePicker && pickerTarget && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateTimeChange}
        />
      )}
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

function DateTimeRow({ dateLabel, timeLabel, dateValue, timeValue, onDatePress, onTimePress }: any) {
  return (
    <View style={styles.dateGrid}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{dateLabel}</Text>
        <TouchableOpacity style={styles.input} onPress={onDatePress}>
          <Text style={[styles.inputText, !dateValue && styles.placeholderText]}>{dateValue || "Select date"}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{timeLabel}</Text>
        <TouchableOpacity style={styles.input} onPress={onTimePress}>
          <Text style={[styles.inputText, !timeValue && styles.placeholderText]}>{timeValue || "Select time"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SelectField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={onPress}>
        <Text style={[styles.inputText, value === "Select make" && styles.placeholderText]}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
}

function parseDateInput(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseTimeInput(value: string) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeValue(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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
  input: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, justifyContent: "center" },
  inputText: { fontSize: 15, color: colors.text },
  placeholderText: { color: colors.textLight },
  dateGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.md, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalClose: { color: colors.primary, fontWeight: "700" },
  optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionRowActive: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: 15, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: "700" },
  chipTextActive: { color: colors.primary },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: spacing.sm },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
