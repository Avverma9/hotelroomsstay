import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PlaceAutocomplete = ({
  value = "",
  onChangeText,
  placeholder,
  style,
  editable = true,
  autoCapitalize = "words",
  keyboardType = "default",
  placeholderTextColor = "#94a3b8",
  ...textInputProps
}) => {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const query = String(value).trim();
    if (!focused || !editable || selected || !query) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Photon returned ${response.status}`);
        const data = await response.json();
        setSuggestions(
          (Array.isArray(data.features) ? data.features : [])
            .map(({ properties = {}, geometry }, index) => {
              const street = [properties.street, properties.housenumber].filter(Boolean).join(" ");
              const parts = [
                properties.name,
                street && street !== properties.name ? street : "",
                properties.city || properties.district,
                properties.state,
                properties.postcode,
                properties.country,
              ].filter(Boolean);
              return {
                id: `${geometry?.coordinates?.join(",") || "place"}-${index}`,
                label: [...new Set(parts)].join(", "),
              };
            })
            .filter((place) => place.label),
        );
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError("Place suggestions are unavailable. Check your connection and try again.");
          console.error("Place lookup failed:", requestError);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [editable, focused, selected, value]);

  const showResults = focused && editable && !selected && String(value).trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        {...textInputProps}
        value={value}
        onChangeText={(text) => {
          setSelected(false);
          setSuggestions([]);
          setError("");
          onChangeText(text);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={style}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        accessibilityLabel={placeholder || "Search for a place"}
      />
      {showResults && (
        <View style={styles.results}>
          {loading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.statusText}>Searching places…</Text>
            </View>
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : suggestions.length ? (
            <>
              {suggestions.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${place.label}`}
                  style={styles.suggestion}
                  onPressIn={() => {
                    onChangeText(place.label);
                    setSelected(true);
                    setFocused(false);
                    setSuggestions([]);
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#2563eb" />
                  <Text style={styles.suggestionText} numberOfLines={2}>{place.label}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.attribution}>OpenStreetMap contributors · Photon</Text>
            </>
          ) : (
            <Text style={styles.statusText}>No matching places found.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "relative", zIndex: 5, flex: 1 },
  results: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    left: 0,
    maxHeight: 220,
    position: "absolute",
    right: 0,
    top: "100%",
    zIndex: 20,
  },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 8, padding: 12 },
  statusText: { color: "#64748b", fontSize: 13, padding: 12 },
  suggestion: {
    alignItems: "center",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  suggestionText: { color: "#0f172a", flex: 1, fontSize: 14 },
  attribution: { color: "#94a3b8", fontSize: 10, paddingHorizontal: 12, paddingVertical: 7 },
});

export default PlaceAutocomplete;
