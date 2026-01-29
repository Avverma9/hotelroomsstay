import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Wifi,
  Wind,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Navigation2,
} from "lucide-react";
import { getRoomEffectivePrice } from "../HotelSearch";

const FALLBACK_HOTEL_IMAGE = "https://via.placeholder.com/800x500?text=No+Image";

const deriveHotelIdentifier = (hotel) => {
  if (!hotel) return null;
  const candidates = [
    hotel.hotelId,
    hotel._id,
    hotel.id,
    hotel.hotelCode,
    hotel.slug,
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    if (typeof candidate === "string" && candidate.trim().length) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return null;
};

const buildGalleryImages = (hotel) => {
  const collected = [];
  const pushImages = (images) => {
    if (!Array.isArray(images)) return;
    images.forEach((img) => {
      if (img) collected.push(img);
    });
  };
  if (hotel?.coverImage) collected.push(hotel.coverImage);
  if (hotel?.thumbnailImage) collected.push(hotel.thumbnailImage);
  pushImages(hotel?.images);
  pushImages(hotel?.gallery);
  if (Array.isArray(hotel?.rooms)) {
    hotel.rooms.forEach((room) => {
      if (room?.image) collected.push(room.image);
      pushImages(room?.images);
    });
  }
  const unique = Array.from(new Set(collected.filter(Boolean)));
  return unique.length ? unique : [FALLBACK_HOTEL_IMAGE];
};

const SolidStar = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#F59E0B"
    width={size}
    height={size}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDistanceString = (value) => {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (/km/i.test(value)) return numeric * 1000;
  if (/meter|m\b/i.test(value)) return numeric;
  return numeric * 1000;
};

const LOW_INVENTORY_THRESHOLD = 5;

export default function HotelCard({ hotel = {}, gstData, tripMeta = null }) {
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
  const galleryImages = useMemo(() => buildGalleryImages(hotel), [hotel]);
  const hotelIdentifier = useMemo(() => deriveHotelIdentifier(hotel), [hotel]);

  React.useEffect(() => {
    if (currentImgIndex >= galleryImages.length) {
      setCurrentImgIndex(0);
    }
  }, [galleryImages, currentImgIndex]);

  const minPrice = useMemo(() => {
    if (!hotel.rooms || hotel.rooms.length === 0) return 0;
    const derivedMin = hotel.rooms.reduce((min, room) => {
      const price = toNumber(room?.finalPrice ?? room?.price, Number.MAX_SAFE_INTEGER);
      return price < min ? price : min;
    }, Number.MAX_SAFE_INTEGER);

    return derivedMin === Number.MAX_SAFE_INTEGER ? 0 : derivedMin;
  }, [hotel.rooms]);

  // Derive the best active offer from the hotel or its rooms
  const activeOffer = useMemo(() => {
      // Check top-level first
      if (hotel.isOffer || hotel.offerApplied) {
          return {
              name: hotel.offerName || hotel.offerTitle || 'Offer',
              value: toNumber(hotel.offerPriceLess || hotel.offerValue, 0),
              isPercentage: false
          };
      }

      // Fallback to rooms: Find the room with an offer and the max savings
      const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
      const roomWithOffer = rooms.find(r => r.offerApplied || r.isOffer);
      
      if (roomWithOffer) {
          return {
              name: roomWithOffer.offerName || roomWithOffer.offerTitle || 'Limited Deal',
              value: toNumber(roomWithOffer.offerPriceLess || roomWithOffer.offerValue, 0),
              isPercentage: Boolean(roomWithOffer.offerPercent > 0)
          };
      }
      return null;
  }, [hotel]);

  const calculateGstAmount = useCallback(
    (price) => {
      if (!gstData) return 0;

      const gstMin =
        gstData.gstMinThreshold ??
        gstData.minThreshold ??
        gstData.gstMin ??
        gstData.min ??
        0;
      const gstMax =
        gstData.gstMaxThreshold ??
        gstData.maxThreshold ??
        gstData.gstMax ??
        gstData.max ??
        Number.MAX_SAFE_INTEGER;
      const gstRate =
        gstData.gstPrice ??
        gstData.defaultRate ??
        gstData.gstRate ??
        gstData.rate ??
        0;

      if (price >= gstMin && price <= gstMax && gstRate > 0) {
        return (price * gstRate) / 100;
      }
      return 0;
    },
    [gstData]
  );

  const priceDetails = useMemo(() => {
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];

    // Try to use effective room price (handles monthly/seasonal pricing) when tripMeta dates are available
    const checkInStr = tripMeta?.checkIn ?? "";
    const checkOutStr = tripMeta?.checkOut ?? "";

    let chosenRoom = null;
    let chosenEffectivePrice = null;

    if (rooms.length) {
      for (const room of rooms) {
        const eff = getRoomEffectivePrice(room, checkInStr, checkOutStr);
        const effNum = toNumber(eff, Number.MAX_SAFE_INTEGER);
        if (chosenRoom === null || effNum < toNumber(chosenEffectivePrice, Number.MAX_SAFE_INTEGER)) {
          chosenRoom = room;
          chosenEffectivePrice = eff;
        }
      }
    }

    const summaryBase = toNumber(hotel.pricing?.startingFrom, 0);
    const summaryWithGst = toNumber(hotel.pricing?.startingFromWithGST, 0);

    const basePrice = chosenRoom
      ? toNumber(chosenEffectivePrice ?? chosenRoom.finalPrice ?? chosenRoom.price, summaryBase || minPrice)
      : summaryBase || minPrice;

    const gstFromRoom = toNumber(chosenRoom?.gstAmount, 0);
    const gstFromSummary = summaryWithGst && basePrice ? Math.max(summaryWithGst - basePrice, 0) : 0;
    const gstAmount = gstFromRoom || gstFromSummary || calculateGstAmount(basePrice);

    const finalPrice = toNumber(
      chosenRoom?.priceWithGST ?? hotel.pricing?.startingFromWithGST ?? basePrice + gstAmount,
      basePrice + gstAmount
    );

    return {
      basePrice,
      finalPrice,
      gstAmount,
      gstPercent:
        chosenRoom?.gstPercent ??
        hotel.pricing?.gstPercent ??
        gstData?.gstPrice ??
        gstData?.defaultRate ??
        null,
      roomType: chosenRoom?.type || null,
      includesTaxes: Boolean(
        chosenRoom?.priceWithGST || hotel.pricing?.startingFromWithGST || hotel.pricing?.gstApplicable
      ),
    };
  }, [calculateGstAmount, gstData, hotel.pricing, hotel.rooms, minPrice, tripMeta]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN"), []);

  const formatCurrency = useCallback(
    (value) => currencyFormatter.format(Math.round(value || 0)),
    [currencyFormatter]
  );

  const starRatingNumber =
    hotel.starRating === undefined || hotel.starRating === null || hotel.starRating === ""
      ? null
      : Number(hotel.starRating);
  const formattedStarRating =
    starRatingNumber !== null && Number.isFinite(starRatingNumber)
      ? Number.isInteger(starRatingNumber)
        ? String(starRatingNumber)
        : starRatingNumber.toFixed(1)
      : null;

  // Only use availabilityStatus if it's a non-empty string (ignore numeric 0 or empty)
  const rawAvailabilityStatus = hotel.availability?.status;
  const availabilityStatus = typeof rawAvailabilityStatus === 'string' && rawAvailabilityStatus.trim() 
    ? rawAvailabilityStatus 
    : null;
  const availabilityRooms =
    typeof hotel.availability?.availableRooms === "number"
      ? hotel.availability.availableRooms
      : null;
  const roomsAvailableFromRoomData = Array.isArray(hotel.rooms)
    ? hotel.rooms.reduce((sum, room) => {
        const available =
          room?.availableCount !== undefined
            ? toNumber(room.availableCount, 0)
            : room?.countRooms !== undefined && room?.bookedCount !== undefined
            ? Math.max(toNumber(room.countRooms, 0) - toNumber(room.bookedCount, 0), 0)
            : 0;
        return sum + available;
      }, 0)
    : null;

  const availableRoomsCount =
    availabilityRooms !== null
      ? availabilityRooms
      : roomsAvailableFromRoomData && roomsAvailableFromRoomData > 0
      ? roomsAvailableFromRoomData
      : null;

  const isLowInventory =
    typeof availableRoomsCount === "number" &&
    availableRoomsCount > 0 &&
    availableRoomsCount <= LOW_INVENTORY_THRESHOLD;

  const distanceMeters = useMemo(() => {
    const meterCandidates = [
      hotel.distanceInMeters,
      hotel.distanceMeter,
      hotel.distance_meters,
      hotel.distanceMeters,
      hotel.distanceValue,
      hotel.distance_from_search,
      hotel.distance?.meters,
      hotel.distance?.meter,
      hotel.distance?.value,
    ];

    for (const candidate of meterCandidates) {
      const parsed = toOptionalNumber(candidate);
      if (parsed && parsed > 0) return parsed;
    }

    const kmCandidates = [
      hotel.distanceInKm,
      hotel.distanceKm,
      hotel.distance_km,
      hotel.distanceKilometers,
      hotel.distance?.kilometers,
      hotel.distance?.km,
      hotel.distanceKmValue,
      hotel.distance,
    ];

    for (const candidate of kmCandidates) {
      const parsed = toOptionalNumber(candidate);
      if (parsed && parsed > 0) {
        const assumedMeters = parsed > 50 ? parsed : parsed * 1000;
        // If the parsed number is very large, assume it was already in meters
        return parsed >= 1000 ? parsed : assumedMeters;
      }
    }

    const stringCandidates = [
      hotel.distanceText,
      hotel.distanceLabel,
      hotel.distanceInfo,
      hotel.distanceDetails,
      hotel.landmarkDistance,
      hotel.distanceDescription,
      hotel.distanceNote,
      hotel.distanceFromSearch,
      hotel.distance_from_search,
    ];

    for (const candidate of stringCandidates) {
      const parsed = parseDistanceString(candidate);
      if (parsed && parsed > 0) return parsed;
    }

    return null;
  }, [hotel]);

  const distanceDisplay = useMemo(() => {
    if (!distanceMeters || distanceMeters <= 0) return null;
    if (distanceMeters >= 1000) {
      const km = distanceMeters / 1000;
      const formatted = km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
      return { label: formatted, rawMeters: distanceMeters };
    }
    const roundedMeters = Math.max(50, Math.round(distanceMeters / 50) * 50);
    return { label: `${roundedMeters} m`, rawMeters: distanceMeters };
  }, [distanceMeters]);

  const distanceDescriptor = useMemo(() => {
    if (distanceDisplay) {
      const reference = hotel.landmark || hotel.destination || hotel.city || "your search";
      const suffix = reference ? `from ${reference}` : "away";
      return `${distanceDisplay.label} ${suffix}`;
    }

    const rawText =
      hotel.distanceText ||
      hotel.distanceLabel ||
      hotel.distanceInfo ||
      hotel.distanceDetails ||
      hotel.landmarkDistance ||
      hotel.distanceDescription ||
      hotel.distanceNote ||
      hotel.distanceFromSearch ||
      hotel.distance_from_search ||
      null;

    if (rawText && typeof rawText === "string") {
      return rawText;
    }

    return null;
  }, [
    distanceDisplay,
    hotel.landmark,
    hotel.destination,
    hotel.city,
    hotel.distanceText,
    hotel.distanceLabel,
    hotel.distanceInfo,
    hotel.distanceDetails,
    hotel.landmarkDistance,
    hotel.distanceDescription,
    hotel.distanceNote,
    hotel.distanceFromSearch,
    hotel.distance_from_search,
  ]);

  const availabilityTone = useMemo(() => {
    if (!availabilityStatus) {
      return { mobile: "", desktop: "" };
    }

    if (isLowInventory) {
      return {
        mobile: "bg-amber-600/90 text-white",
        desktop: "bg-amber-50 text-amber-700 border border-amber-200",
      };
    }

    const normalized = availabilityStatus.toLowerCase();
    if (normalized.includes("available") || normalized.includes("open")) {
      return {
        mobile: "bg-green-600/90 text-white",
        desktop: "bg-green-50 text-green-700 border border-green-200",
      };
    }
    if (normalized.includes("sold") || normalized.includes("full")) {
      return {
        mobile: "bg-red-600/90 text-white",
        desktop: "bg-red-50 text-red-700 border border-red-200",
      };
    }
    return {
      mobile: "bg-amber-600/90 text-white",
      desktop: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }, [availabilityStatus, isLowInventory]);

  // Normalize amenities to a flat array of strings. Backend sometimes returns
  // [{ hotelId, amenities: [ ... ] }] or an array of strings.
  const normalizedAmenities = React.useMemo(() => {
    if (!hotel.amenities) return [];
    if (!Array.isArray(hotel.amenities))
      return String(hotel.amenities).split(",").filter(s => s && s.trim());
    if (hotel.amenities.length === 0) return [];

    const first = hotel.amenities[0];
    // Common backend shape: [{ hotelId: '...', amenities: [ 'Free Wi-Fi', ... ] }]
    if (first && Array.isArray(first.amenities)) {
      return first.amenities.filter(a => a && typeof a === "string" && a.trim());
    }

    // If it's already an array of strings
    if (hotel.amenities.every((a) => typeof a === "string"))
      return hotel.amenities.filter(a => a && a.trim());

    // Fallback: flatten possible nested structures and extract string values
    const flat = hotel.amenities.flatMap((a) => {
      if (!a) return [];
      if (typeof a === "string") return a.trim() ? [a] : [];
      if (Array.isArray(a.amenities)) return a.amenities.filter(x => x && typeof x === "string" && x.trim());
      if (typeof a === "object") {
        // collect string properties
        return Object.values(a).filter((v) => typeof v === "string" && v.trim());
      }
      // Skip non-string falsy values like 0
      return [];
    });

    return flat;
  }, [hotel.amenities]);

  const nextSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleCardClick = () => {
    navigate('/book-now', {
      state: {
        hotel,
        priceDetails,
        tripMeta,
        // Always pass the real backend identifier so BookNow can fetch details.
        // Avoid fallback ids like "hotel-<name>".
        hotelId: hotelIdentifier || hotel?.hotelId || hotel?._id || hotel?.id || null,
      },
    });
  };

  return (
    <>
      {/* Mobile View - Overlay Card */}
      <div
        onClick={handleCardClick}
        className="md:hidden relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-4"
      >
    {/* Taller card like earlier, but with minimal details */}
    <div className="relative w-full min-h-96">
        {/* Background Image */}
        <img
          src={galleryImages[currentImgIndex] || FALLBACK_HOTEL_IMAGE}
          alt={hotel.hotelName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.target.src = FALLBACK_HOTEL_IMAGE;
          }}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent pointer-events-none"></div>

        {/* Image Navigation */}
        {galleryImages.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={prevSlide}
                className="bg-white/90 hover:bg-white p-2 rounded-full text-gray-800 shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="bg-white/90 hover:bg-white p-2 rounded-full text-gray-800 shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="absolute top-4 inset-x-0 flex justify-center gap-1 z-10">
              {galleryImages.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === currentImgIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 flex-wrap max-w-[85%]">
            {formattedStarRating && toNumber(formattedStarRating) > 0 && (
              <div className="flex items-center gap-1 bg-blue-600/90 px-2 py-1 rounded-full shadow-lg text-white text-xs font-semibold">
                <SolidStar size={12} />
                <span>{formattedStarRating}</span>
              </div>
            )}
            {hotel.propertyType && hotel.propertyType[0] && (
              <span className="text-xs bg-blue-600/90 text-white px-2 py-1 rounded-full shadow-lg font-semibold uppercase tracking-wide">
                {hotel.propertyType[0]}
              </span>
            )}
            {availabilityStatus && (
              <span
                className={`text-xs px-2 py-1 rounded-full shadow-lg font-semibold uppercase tracking-wide ${availabilityTone.mobile}`}
              >
                {availabilityStatus}
              </span>
            )}
            {/* Offer badge - use derived activeOffer */}
            {activeOffer && (
              <span className="text-xs bg-rose-500 text-white px-2 py-1 rounded-full shadow-lg font-semibold uppercase animate-pulse">
                {activeOffer.name}
                {activeOffer.value > 0 ? ` • Save ₹${activeOffer.value}` : ""}
              </span>
            )}
          </div>
        </div>

        {isLowInventory && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1 bg-red-600/95 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xl border border-white/40 animate-bounce">
              Hurry! Only {availableRoomsCount} left
            </span>
          </div>
        )}

        {/* Bottom content overlay */}
        <div className="absolute inset-x-0 bottom-3 px-3 z-10">
          <div className="w-full bg-black/55 backdrop-blur-xl rounded-2xl p-2.5 border border-white/10 shadow-xl">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-white line-clamp-1 drop-shadow-lg">
                  {hotel.hotelName || "Hotel"}
                </h3>
                <p className="text-xs text-gray-200 flex items-center gap-1 mt-0.5 line-clamp-1">
                  <MapPin size={13} className="text-gray-300 shrink-0" />
                  <span className="truncate">
                    {hotel.landmark ? `${hotel.landmark}, ` : ""}
                    {hotel.city || ""}
                  </span>
                </p>
              </div>

              <div className="text-right bg-white/15 px-3 py-2 rounded-2xl shadow-lg border border-white/20 min-w-30">
                {priceDetails.basePrice > 0 && priceDetails.basePrice !== priceDetails.finalPrice && (
                  <p className="text-[10px] text-gray-300">Base ₹{formatCurrency(priceDetails.basePrice)}</p>
                )}
                <p className="text-xl font-bold text-white drop-shadow-lg">₹{formatCurrency(priceDetails.finalPrice)}</p>
                {priceDetails.roomType && (
                  <p className="text-[10px] text-gray-200 mt-0.5 line-clamp-1">{priceDetails.roomType}</p>
                )}
                <p className="text-[10px] text-gray-300">Including GST</p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {normalizedAmenities &&
                normalizedAmenities.slice(0, 3).map((amenity, i) => {
                  const amenityLabel =
                    typeof amenity === "string"
                      ? amenity
                      : amenity && (amenity.name || amenity.label)
                      ? amenity.name || amenity.label
                      : String(amenity);
                  return (
                    <span
                      key={i}
                      className="text-[10px] text-white bg-white/20 px-2 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/5"
                    >
                      {amenityLabel.includes("Wi-Fi") && <Wifi size={10} />}
                      {amenityLabel.includes("AC") && <Wind size={10} />}
                      {(amenityLabel.includes("Food") || amenityLabel.includes("Breakfast")) && (
                        <Utensils size={10} />
                      )}
                      {amenityLabel}
                    </span>
                  );
                })}
              {normalizedAmenities && normalizedAmenities.length > 3 && (
                <span className="text-[10px] text-blue-200 font-semibold px-2 py-1 bg-white/10 rounded-full shadow-md">
                  +{normalizedAmenities.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        </div>
      </div>

      {/* Desktop View - List Layout */}
      <div
        onClick={handleCardClick}
        className="hidden md:flex bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 mb-4 overflow-hidden group cursor-pointer relative"
      >
        {isLowInventory && (
          <div className="absolute top-3 right-4 z-20">
            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
              Hurry! Only {availableRoomsCount} rooms left
            </span>
          </div>
        )}
        <div className="relative w-72 shrink-0 bg-gray-100">
          <img
            src={galleryImages[currentImgIndex] || FALLBACK_HOTEL_IMAGE}
            alt={hotel.hotelName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = FALLBACK_HOTEL_IMAGE;
            }}
          />
          {galleryImages.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={prevSlide}
                  className="bg-white/80 hover:bg-white p-1 rounded-full text-gray-800 shadow-sm z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextSlide}
                  className="bg-white/80 hover:bg-white p-1 rounded-full text-gray-800 shadow-sm z-10"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {galleryImages.slice(0, 5).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx === currentImgIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {formattedStarRating && toNumber(formattedStarRating) > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                      <SolidStar size={12} />
                      {formattedStarRating}
                    </span>
                  )}
                  {hotel.propertyType && hotel.propertyType[0] && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 uppercase font-semibold tracking-wide">
                      {hotel.propertyType[0]}
                    </span>
                  )}
                  {availabilityStatus && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide ${availabilityTone.desktop}`}
                    >
                      {availabilityStatus}
                    </span>
                  )}
                  {activeOffer && (
                    <span className="text-[11px] bg-rose-500 text-white px-2 py-0.5 rounded font-semibold ml-1">
                      {activeOffer.name}
                      {activeOffer.value > 0
                        ? ` • Save ₹${activeOffer.value}`
                        : ""}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {hotel.hotelName || "Hotel"}
                </h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  {hotel.landmark ? `${hotel.landmark}, ` : ""}
                  {hotel.city || ""}
                </p>
                {distanceDescriptor && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Navigation2 size={12} className="text-blue-500" />
                    {distanceDescriptor}
                  </p>
                )}
              </div>
            </div>

            {/* Amenities moved below the divider to keep details separated */}
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              {hotel.rating && toNumber(hotel.rating) > 0 && (
                <>
                  <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded shadow-sm">
                    {hotel.rating}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-none">
                      {hotel.rating >= 4.5
                        ? "Excellent"
                        : hotel.rating >= 4
                        ? "Very Good"
                        : hotel.rating >= 3.5
                        ? "Good"
                        : "Average"}
                    </p>
                    {(hotel.reviews || hotel.reviewCount) ? (
                      <p className="text-xs text-gray-500">
                        {hotel.reviews || hotel.reviewCount} ratings
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                {priceDetails.basePrice > 0 && priceDetails.basePrice !== priceDetails.finalPrice && (
                  <p className="text-xs text-gray-400">
                    Base ₹{formatCurrency(priceDetails.basePrice)}
                  </p>
                )}
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{formatCurrency(priceDetails.finalPrice)}
                  </span>
                  <span className="text-xs text-gray-500">/ night</span>
                </div>
                {priceDetails.gstAmount > 0 ? (
                  <p className="text-[11px] text-gray-500">
                    Includes ₹{formatCurrency(priceDetails.gstAmount)} taxes
                    {priceDetails.gstPercent ? ` (${priceDetails.gstPercent}%)` : ""}
                  </p>
                ) : (
                  priceDetails.includesTaxes && (
                    <p className="text-[11px] text-gray-500">Taxes already included</p>
                  )
                )}
                {priceDetails.roomType && (
                  <p className="text-xs text-gray-500 mt-1">{priceDetails.roomType}</p>
                )}
                {hotel.pricing?.gstNote && (
                  <p className="text-[10px] text-gray-400 mt-1">{hotel.pricing.gstNote}</p>
                )}
                {isLowInventory && (
                  <p className="text-xs text-red-500 font-semibold mt-1 animate-pulse">
                    Hurry! Only {availableRoomsCount} rooms left
                  </p>
                )}
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-5 rounded-lg shadow-sm transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                View Details
              </button>
            </div>
          </div>

          {/* Amenities placed below the divider so details appear under it */}
          <div className="mt-3 flex flex-wrap gap-2">
            {normalizedAmenities &&
              normalizedAmenities.slice(0, 4).map((amenity, i) => {
                const amenityLabel =
                  typeof amenity === "string"
                    ? amenity
                    : amenity && (amenity.name || amenity.label)
                    ? amenity.name || amenity.label
                    : String(amenity);
                return (
                  <span
                    key={i}
                    className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center"
                  >
                    {amenityLabel.includes("Wi-Fi") && (
                      <Wifi size={10} className="mr-1" />
                    )}
                    {amenityLabel.includes("AC") && (
                      <Wind size={10} className="mr-1" />
                    )}
                    {(amenityLabel.includes("Food") ||
                      amenityLabel.includes("Breakfast")) && (
                      <Utensils size={10} className="mr-1" />
                    )}
                    {amenityLabel}
                  </span>
                );
              })}
            {normalizedAmenities && normalizedAmenities.length > 4 && (
              <span className="text-[11px] text-blue-600 font-medium px-1 py-1">
                +{normalizedAmenities.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

