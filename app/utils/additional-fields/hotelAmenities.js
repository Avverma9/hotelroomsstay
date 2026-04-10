import { useEffect, useState } from "react";
import api from "../api";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.amenities)) return payload.amenities;

  return [];
};

const ENDPOINTS = [
  "/additional/get-hotel-amenities",
  "/additional/get-hotel-amenity",
  "/additional/get-amenities",
  "/additional/get-amenity",
];

export const useHotelAmenities = () => {
  const [hotelAmenities, setHotelAmenities] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchAmenities = async () => {
      for (const endpoint of ENDPOINTS) {
        try {
          const response = await api.get(endpoint);
          const list = extractList(response.data);

          if (!mounted) return;
          setHotelAmenities(list);
          return;
        } catch {
        }
      }

      if (mounted) setHotelAmenities([]);
    };

    fetchAmenities();

    return () => {
      mounted = false;
    };
  }, []);

  return hotelAmenities;
};
