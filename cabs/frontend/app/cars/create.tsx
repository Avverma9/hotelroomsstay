import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { type Car, getMyCars, updateCar } from "../../src/api";
import { useAuth } from "../../src/auth";
import { colors, radii, spacing } from "../../src/theme";

const VEHICLE_TYPES = ["Car", "Bike", "Bus"] as const;
const SHARING_TYPES = ["Private", "Shared"] as const;
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
const TRANSMISSIONS = ["Automatic", "Manual"] as const;

export default function CreateRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ carToEdit?: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [showCarPicker, setShowCarPicker] = useState(false);

  const isEditMode = !!params.carToEdit;

  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>("Car");
  const [sharingType, setSharingType] = useState<(typeof SHARING_TYPES)[number]>("Private");
  const [fuelType, setFuelType] = useState<(typeof FUEL_TYPES)[number]>("Petrol");
  const [transmission, setTransmission] = useState<(typeof TRANSMISSIONS)[number]>("Automatic");
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
    color: "White",
    mileage: "0",
    seater: "4",
  });

  useEffect(() => {
    const fetchUserCars = async () => {
      try {
        const cars = await getMyCars();
        if (!cars || cars.length === 0) {
          Alert.alert(
            "No Car Found",
            "You don't have any cars assigned. Please contact support to add a car.",
            [{ text: "OK", onPress: () => router.back() }],
          );
          return;
        }
        setMyCars(cars);
        if (params.carToEdit) {
          setSelectedCarId(params.carToEdit);
        } else if (cars.length === 1) {
          setSelectedCarId(cars[0]._id);
        } else {
          setShowCarPicker(true);
        }
      } catch (error) {
        Alert.alert("Error", "Could not fetch your cars.", [{ text: "OK", onPress: () => router.back() }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserCars();
  }, [router, params.carToEdit]);

  const selectedCar = useMemo(() => myCars.find((c) => c._id === selectedCarId), [myCars, selectedCarId]);

  useEffect(() => {
    if (selectedCar) {
      const pickupDateObj = isEditMode ? isoToDate(selectedCar.pickupD) : null;
      const dropDateObj = isEditMode ? isoToDate(selectedCar.dropD) : null;

      setForm({
        make: selectedCar.make || "",
        model: selectedCar.model || "",
        vehicleNumber: selectedCar.vehicleNumber || "",
        year: selectedCar.year ? String(selectedCar.year) : "",
        color: selectedCar.color || "White",
        mileage: selectedCar.mileage ? String(selectedCar.mileage) : "0",
        seater: selectedCar.seater ? String(selectedCar.seater) : "4",
        // Trip-specific fields
        pickupP: isEditMode ? selectedCar.pickupP || "" : "",
        dropP: isEditMode ? selectedCar.dropP || "" : "",
        pickupDate: pickupDateObj ? formatDateValue(pickupDateObj) : "",
        pickupTime: pickupDateObj ? formatTimeValue(pickupDateObj) : "",
        dropDate: dropDateObj ? formatDateValue(dropDateObj) : "",
        dropTime: dropDateObj ? formatTimeValue(dropDateObj) : "",
        price: isEditMode ? String(selectedCar.price || "") : "",
        perPersonCost: isEditMode ? String(selectedCar.perPersonCost || "") : "",
      });

      // Type assertions add kardiye hain yahan:
      setVehicleType((selectedCar.vehicleType as typeof VEHICLE_TYPES[number]) || "Car");
      setSharingType((selectedCar.sharingType as typeof SHARING_TYPES[number]) || "Private");
      setFuelType((selectedCar.fuelType as typeof FUEL_TYPES[number]) || "Petrol");
      setTransmission((selectedCar.transmission as typeof TRANSMISSIONS[number]) || "Automatic");
    }
  }, [selectedCar, params.carToEdit]);
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
    if (!user || !selectedCarId || !selectedCar) return;
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
      const newSeatConfig = selectedCar.seatConfig?.map((seat) => ({
        ...seat,
        isBooked: false,
        bookedBy: "",
      }));

      const payload: Partial<Car> = {
        pickupP: form.pickupP.trim(),
        dropP: form.dropP.trim(),
        pickupD: pickupISO,
        dropD: dropISO,
        price: Number(form.price) || 0,
        perPersonCost: sharingType === "Shared" ? Number(form.perPersonCost) || undefined : undefined,
        isAvailable: true,
        runningStatus: "Available",
        seatConfig: newSeatConfig,
        sharingType: sharingType,
      };

      await updateCar(selectedCarId, payload);
      Alert.alert(
        isEditMode ? "Ride Updated" : "Ride Published",
        isEditMode ? "Your ride has been updated successfully." : "Your new ride has been published successfully.",
      );
      router.replace("/cars/my-rides" as any);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Could not publish ride. Please try again.";
      Alert.alert("Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/bookings')}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{isEditMode ? "Edit Ride" : "Publish New Ride"}</Text>
              <Text style={styles.subtitle}>
                {isEditMode
                  ? "Update your ride details and save."
                  : "Pickup, drop, date aur time fill karke ride publish karo."}
              </Text>
            </View>
          </View>

          <Section title="Ride Info">
            <Field label="Make" value={form.make} editable={false} />
            <Field label="Model" value={form.model} editable={false} />
            <Field
              label="Vehicle Number"
              value={form.vehicleNumber}
              editable={false}
            />
            <Field label="Year" value={form.year} editable={false} />
          </Section>

          <Section title="Route">
            <Field label="Pickup Point" value={form.pickupP} onChangeText={(v: string) => setField("pickupP", v)} placeholder="New Delhi Railway Station" />
            <Field label="Drop Point" value={form.dropP} onChangeText={(v: string) => setField("dropP", v)} placeholder="Jaipur Airport" />
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
            <PickerChips label="Vehicle Type" value={vehicleType} options={VEHICLE_TYPES} disabled />
            <PickerChips label="Sharing Type" value={sharingType} options={SHARING_TYPES} onChange={setSharingType} />
            <PickerChips label="Fuel Type" value={fuelType} options={FUEL_TYPES} disabled />
            <PickerChips label="Transmission" value={transmission} options={TRANSMISSIONS} disabled />
            <Field label="Total Trip Price" value={form.price} onChangeText={(v: string) => setField("price", v)} keyboardType="numeric" placeholder="2500" />
            {sharingType === "Shared" && (
              <Field label="Per Person Cost" value={form.perPersonCost} onChangeText={(v: string) => setField("perPersonCost", v)} keyboardType="numeric" placeholder="450" />
            )}
            <Field label="Seater" value={form.seater} editable={false} />
            <Field label="Color" value={form.color} editable={false} />
            <Field label="Mileage" value={form.mileage} editable={false} />
          </Section>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{isEditMode ? "Update Ride" : "Publish Ride"}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCarPicker} transparent animationType="slide" onRequestClose={() => { if (myCars.length === 1) setShowCarPicker(false) }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Car</Text>
              {myCars.length > 1 && <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>}
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {myCars.map((car) => (
                <TouchableOpacity
                  key={car._id}
                  style={[styles.optionRow, selectedCarId === car._id && styles.optionRowActive]}
                  onPress={() => {
                    setSelectedCarId(car._id);
                    setShowCarPicker(false);
                  }}
                >
                  <Text style={[styles.optionText, selectedCarId === car._id && styles.optionTextActive]}>{`${car.make} ${car.model} (${car.vehicleNumber})`}</Text>
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

function isoToDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function PickerChips({ label, value, options, onChange, disabled }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt: string) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.chip,
                active && styles.chipActive,
                disabled && { opacity: 0.6 }
              ]}
              onPress={() => onChange && onChange(opt)}
              disabled={disabled}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
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
  input: { backgroundColor: colors.inputBg, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, justifyContent: "center", borderWidth: 1, borderColor: 'transparent' },
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