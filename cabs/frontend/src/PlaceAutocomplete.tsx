import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  type StyleProp,
  Text,
  type TextStyle,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "./theme";

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
};

type PlaceSuggestion = {
  id: string;
  label: string;
};

type PlaceAutocompleteProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  inputStyle?: StyleProp<TextStyle>;
  editable?: boolean;
};

function getPlaceLabel(feature: PhotonFeature) {
  const place = feature.properties || {};
  const street = [place.street, place.housenumber].filter(Boolean).join(" ");
  const parts = [
    place.name,
    street && street !== place.name ? street : undefined,
    place.city || place.district,
    place.state,
    place.postcode,
    place.country,
  ].filter((part): part is string => Boolean(part));
  return [...new Set(parts)].join(", ");
}

export default function PlaceAutocomplete({
  value,
  onChangeText,
  placeholder,
  inputStyle,
  editable = true,
}: PlaceAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (!editable || selected || query.length < 1) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Photon returned ${response.status}`);
        }

        const data = await response.json();
        const features = Array.isArray(data.features) ? data.features as PhotonFeature[] : [];
        setSuggestions(
          features
            .map((feature, index) => ({
              id: `${feature.geometry?.coordinates?.join(",") || "place"}-${index}`,
              label: getPlaceLabel(feature),
            }))
            .filter((place) => place.label.length > 0),
        );
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError("Place suggestions are unavailable. Check your connection and try again.");
          console.error("Place lookup failed:", requestError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [editable, selected, value]);

  const showResults = focused && editable && !selected && value.trim().length >= 1;

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={(text) => {
          setSelected(false);
          setSuggestions([]);
          setLoading(false);
          setError(null);
          onChangeText(text);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        editable={editable}
        style={inputStyle}
        autoCorrect={false}
        accessibilityLabel={placeholder || "Search for a place"}
      />
      {showResults && (
        <View style={styles.results}>
          {loading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Searching places…</Text>
            </View>
          ) : error ? (
            <Text style={styles.statusText}>{error}</Text>
          ) : suggestions.length > 0 ? (
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
                    setLoading(false);
                    setError(null);
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {place.label}
                  </Text>
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
}

const styles = StyleSheet.create({
  container: { position: "relative", zIndex: 2 },
  results: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 220,
    overflow: "hidden",
    zIndex: 10,
  },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 8, padding: 12 },
  statusText: { color: colors.textMuted, fontSize: 13, padding: 12 },
  suggestion: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  suggestionText: { color: colors.text, flex: 1, fontSize: 14 },
  attribution: {
    color: colors.textLight,
    fontSize: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
