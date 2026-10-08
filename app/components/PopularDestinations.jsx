import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import PlayStoreWavyLoader from "./PlayStoreWavyLoader";
import * as Location from "expo-location";
// Icons के लिए @expo/vector-icons (Ionicons) का उपयोग किया गया है
import { Ionicons } from "@expo/vector-icons";

const PopularDestinations = ({ locations = [], onSelectLocation }) => {
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleNearMe = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted.current) return;
      if (status !== "granted") {
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!isMounted.current) return;
      const rev = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (!isMounted.current) return;
      const city = rev?.[0]?.city || rev?.[0]?.region || "Nearby";
      setLoading(false);
      if (onSelectLocation) onSelectLocation(city);
    } catch (e) {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <View className="mt-6 pl-4">
      {/* Header */}
      <View className="flex-row justify-between items-center pr-4 mb-3.5">
        <Text className="text-[17px] font-bold text-slate-900 tracking-tight">
          Popular Destinations
        </Text>
      </View>

      {/* Destinations Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {/* Near Me Special Card */}
        <TouchableOpacity
          className="mr-3.5 items-center"
          activeOpacity={0.75}
          onPress={handleNearMe}
          disabled={loading}
        >
          <View className="w-[76px] h-[76px] rounded-[22px] bg-blue-50/80 border border-blue-100/60 items-center justify-center shadow-sm mb-2">
            {loading ? (
              <PlayStoreWavyLoader size="small" color="#2563EB" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                <Ionicons name="navigate" size={20} color="#2563EB" />
              </View>
            )}
          </View>
          <Text
            className="text-[12px] font-medium text-blue-600 text-center w-[76px]"
            numberOfLines={1}
          >
            Near Me
          </Text>
        </TouchableOpacity>

        {/* Location Cards */}
        {locations?.map((d) => (
          <TouchableOpacity
            key={d._id}
            className="mr-3.5 items-center"
            activeOpacity={0.8}
            onPress={() => (onSelectLocation ? onSelectLocation(d?.location) : null)}
          >
            {/* Image Container with Smooth Rounded Corners & Soft Shadow */}
            <View className="w-[76px] h-[76px] rounded-[22px] overflow-hidden bg-slate-100 border border-black/5 shadow-sm mb-2">
              <Image
                source={{
                  uri:
                    d?.images?.[0] ||
                    "https://images.unsplash.com/photo-1548013146-72479768bbaa?w=400",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            {/* City / Location Label */}
            <Text
              className="text-[12px] font-medium text-slate-800 text-center w-[76px]"
              numberOfLines={1}
            >
              {d.location}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default PopularDestinations;
