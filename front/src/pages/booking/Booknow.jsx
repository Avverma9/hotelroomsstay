/**
 * BookNow Page - Refactored
 * Main booking page component with modularized sub-components
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

// Redux
import useBookingOperations from "./hooks/useBookingOperations";

// Extracted Components
import CalendarPicker from "./components/CalendarPicker";
import RoomsGuestsPopup from "./components/RoomsGuestsPopup";
import PoliciesModal from "./components/PoliciesModal";
import GalleryModal from "./components/GalleryModal";
import BookingSuccessModal from "./components/BookingSuccessModal";
import {
  getAmenityIcon,
  SectionCard,
  InfoRows,
  Stars,
} from "./components/SharedUI";

// Helpers
import {
  PLACEHOLDER_IMAGE,
  DEFAULT_AMENITIES,
  formatCurrency,
  parseNumber,
  ensureIsoDate,
  normalizeHotelId,
  deriveHotelId,
  normalizeAmenities,
  extractPriceCandidate,
  sumFoodSelections,
  calculateStayNights,
  deriveRoomAvailability,
  requiredRoomsForGuests,
  pickMonthlyOverride,
  badgeForPolicy,
} from "./utils/bookingHelpers";
import {
  fetchBookingData,
  fetchMonthlyData,
} from "@/redux/slices/bookingSlice";
import { ReviewSection } from "./sections/Review";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BookNowPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const bookingState = useSelector((store) => store.booking) || {};
  const user = useSelector((store) => store.auth?.user) || null;
  const isLoggedIn = Boolean(user?.id);

  // --- UI State ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRoomsPopup, setShowRoomsPopup] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingResponseData, setBookingResponseData] = useState(null);

  const roomsPopupRef = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roomsPopupRef.current && !roomsPopupRef.current.contains(e.target)) {
        setShowRoomsPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inject compact styles
  useEffect(() => {
    if (document.getElementById("compact-booknow-styles")) return;
    const css = `
      .compact-booknow .p-6{padding:.75rem !important}
      .compact-booknow .p-5{padding:.75rem !important}
      .compact-booknow .p-4{padding:.5rem !important}
      .compact-booknow .p-3{padding:.375rem !important}
      .compact-booknow .space-y-6 > * + *{margin-top:.75rem !important}
      .compact-booknow .space-y-4 > * + *{margin-top:.5rem !important}
    `;
    const el = document.createElement("style");
    el.id = "compact-booknow-styles";
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // --- Trip Meta ---
  const initialTripMeta = useMemo(() => {
    if (!state?.tripMeta) {
      return {
        checkIn: ensureIsoDate(null, 0),
        checkOut: ensureIsoDate(null, 1),
        rooms: 1,
        guests: 1,
      };
    }
    return {
      checkIn: ensureIsoDate(state.tripMeta.checkIn, 0),
      checkOut: ensureIsoDate(state.tripMeta.checkOut, 1),
      rooms: parseNumber(state.tripMeta.rooms, 1) || 1,
      guests: parseNumber(state.tripMeta.guests, 1) || 1,
    };
  }, [state?.tripMeta]);

  const [checkInDate, setCheckInDate] = useState(initialTripMeta.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(initialTripMeta.checkOut);
  const [roomsCount, setRoomsCount] = useState(initialTripMeta.rooms);
  const [guestsCount, setGuestsCount] = useState(initialTripMeta.guests);

  useEffect(() => {
    setCheckInDate(initialTripMeta.checkIn);
    setCheckOutDate(initialTripMeta.checkOut);
    const normalizedGuests = Math.max(
      parseNumber(initialTripMeta.guests, 1),
      1
    );
    const normalizedRooms = Math.max(parseNumber(initialTripMeta.rooms, 1), 1);
    const minRooms = requiredRoomsForGuests(normalizedGuests);
    setRoomsCount(Math.max(normalizedRooms, minRooms));
    setGuestsCount(normalizedGuests);
  }, [initialTripMeta]);

  useEffect(() => {
    const minRooms = requiredRoomsForGuests(guestsCount);
    if (roomsCount < minRooms) setRoomsCount(minRooms);
  }, [guestsCount, roomsCount]);

  useEffect(() => {
    const maxGuests = Math.max(parseNumber(roomsCount, 1) * 3, 1);
    if (guestsCount > maxGuests) setGuestsCount(maxGuests);
  }, [roomsCount, guestsCount]);

  // --- Hotel Data ---
  const navigationHotel = state?.hotel || null;
  const navigationHotelId =
    normalizeHotelId(state?.hotelId) || deriveHotelId(navigationHotel);
  const storeHotel = bookingState.bookingData;
  const storeHotelId = deriveHotelId(storeHotel);
  const hotelId = navigationHotelId || storeHotelId;
  const hotel =
    hotelId && storeHotelId === hotelId
      ? storeHotel
      : navigationHotel || storeHotel;

  useEffect(() => {
    if (!hotelId) return;
    dispatch(fetchBookingData(hotelId));
    dispatch(fetchMonthlyData(hotelId));
  }, [dispatch, hotelId]);

  // --- Hotel Info ---
  const hotelName = hotel?.hotelName || hotel?.name || "Selected property";
  const hotelAddress =
    hotel?.address ||
    [hotel?.landmark, hotel?.city, hotel?.state].filter(Boolean).join(", ") ||
    "Address on confirmation";
  const hotelRating = Number.isFinite(Number(hotel?.rating))
    ? Number(hotel.rating)
    : null;
  const hotelDescription =
    hotel?.description ||
    hotel?.about ||
    "Experience a comfortable stay with us.";
  const allAmenities = useMemo(
    () => [...new Set(normalizeAmenities(hotel?.amenities, DEFAULT_AMENITIES))],
    [hotel?.amenities]
  );

  const galleryImages = useMemo(() => {
    const collected = [];
    if (Array.isArray(hotel?.images))
      collected.push(...hotel.images.filter(Boolean));
    if (hotel?.coverImage) collected.unshift(hotel.coverImage);
    const unique = Array.from(new Set(collected));
    return unique.length ? unique : [PLACEHOLDER_IMAGE];
  }, [hotel]);

  // --- Rooms with Monthly Price Override ---
  const rooms = useMemo(() => {
    const sourceRooms =
      Array.isArray(hotel?.rooms) && hotel.rooms.length ? hotel.rooms : null;
    if (!sourceRooms) {
      const fallbackPrice = parseNumber(
        hotel?.startingPrice ?? hotel?.basePrice ?? 1599,
        1599
      );
      return [
        {
          id: "primary-room",
          roomId: "primary-room",
          name: hotel?.defaultRoomName || "Premium room",
          area: hotel?.defaultRoomArea || "Approx. 180 sq.ft",
          finalPrice: fallbackPrice,
          originalPrice: fallbackPrice,
          taxes: Math.round(fallbackPrice * 0.12),
          image: hotel?.coverImage || PLACEHOLDER_IMAGE,
          amenities: normalizeAmenities(
            hotel?.amenities,
            DEFAULT_AMENITIES
          ).slice(0, 4),
          isAvailable: true,
          availableCount: 5,
          gstPercent: 12,
          priceWithGST: Math.round(fallbackPrice * 1.12),
          offerApplied: false,
          offerTitle: "",
          offerValue: 0,
          hasMonthlyPrice: false,
        },
      ];
    }

    const mappedRooms = sourceRooms.map((room, index) => {
      const baseRoomId =
        room._id || room.id || room.roomId || `room-${index + 1}`;
      const originalPrice =
        parseNumber(
          room.finalPrice ??
            room.discountedPrice ??
            room.price ??
            room.priceWithGST,
          0
        ) ||
        extractPriceCandidate(room) ||
        1599;

      // Check if this room has monthly price override for current dates
      const monthlyOverride = pickMonthlyOverride(
        bookingState.monthlyData,
        baseRoomId,
        checkInDate,
        checkOutDate
      );
      const effectivePrice = monthlyOverride?.monthPrice
        ? parseNumber(monthlyOverride.monthPrice, originalPrice)
        : originalPrice;

      const roomData = {
        id: baseRoomId,
        roomId: baseRoomId,
        name: room.name || room.type || `Room ${index + 1}`,
        area: room.size || room.area || "Approx. 180 sq.ft",
        finalPrice: effectivePrice,
        originalPrice: originalPrice,
        taxes: Math.round(
          parseNumber(room.gstAmount ?? room.taxes ?? effectivePrice * 0.12, 0)
        ),
        gstPercent: parseNumber(room.gstPercent ?? room.gstPercentage ?? 0, 0),
        priceWithGST: parseNumber(room.priceWithGST ?? 0, 0),
        image:
          room.images?.[0] ||
          room.image ||
          hotel?.images?.[index] ||
          hotel?.coverImage ||
          PLACEHOLDER_IMAGE,
        amenities: normalizeAmenities(room.amenities, DEFAULT_AMENITIES).slice(
          0,
          4
        ),
        isAvailable: deriveRoomAvailability(room),
        availableCount: parseNumber(
          room?.availableCount ?? room?.countRooms ?? room?.totalCount ?? 0,
          0
        ),
        offerApplied: Boolean(room.isOffer || room.offerApplied),
        offerTitle: room.offerName || room.offerTitle || "",
        offerValue: parseNumber(room.offerPriceLess || room.offerValue, 0),
        hasMonthlyPrice: Boolean(monthlyOverride),
        monthlyPriceMeta: monthlyOverride || null,
      };
      return roomData;
    });

    return mappedRooms;
  }, [hotel, bookingState.monthlyData, checkInDate, checkOutDate]);

  const [selectedRoomId, setSelectedRoomId] = useState(() => rooms[0]?.id);

  useEffect(() => {
    if (!rooms.length) return;
    const selected = rooms.find((room) => room.id === selectedRoomId);
    if (selected && selected.isAvailable) return;
    const firstAvailable = rooms.find((room) => room.isAvailable) || rooms[0];
    if (firstAvailable?.id && firstAvailable.id !== selectedRoomId)
      setSelectedRoomId(firstAvailable.id);
  }, [rooms, selectedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId]
  );

  // Price is already calculated in rooms array with monthly override
  const effectiveRoomNightlyPrice = useMemo(() => {
    if (!selectedRoom) return 0;
    return parseNumber(selectedRoom.finalPrice, 0);
  }, [selectedRoom]);

  const selectedRoomsPayload = useMemo(() => {
    if (!selectedRoom) return [];
    return [
      {
        _id: selectedRoom.roomId,
        roomId: selectedRoom.roomId,
        name: selectedRoom.name,
        type: selectedRoom.name,
        gstPercent: selectedRoom.gstPercent,
        priceWithGST: selectedRoom.priceWithGST,
        price: effectiveRoomNightlyPrice,
        finalPrice: effectiveRoomNightlyPrice,
        monthlyPriceApplied: selectedRoom.hasMonthlyPrice,
        monthlyPriceMeta: selectedRoom.monthlyPriceMeta,
      },
    ];
  }, [effectiveRoomNightlyPrice, selectedRoom]);

  // --- Guest Details ---
  const [guestDetails, setGuestDetails] = useState({
    name: user?.name || user?.displayName || "",
    email: user?.email || "",
    phone: user?.mobile || "",
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    setGuestDetails({
      name: user?.name || user?.displayName || "",
      email: user?.email || "",
      phone: user?.mobile || "",
    });
  }, [isLoggedIn, user]);

  // --- Pricing State ---
  const [couponCode, setCouponCode] = useState(
    () => state?.priceDetails?.coupon || ""
  );
  const [, setIsCouponApplied] = useState(Boolean(state?.priceDetails?.coupon));
  const [discountPrice, setDiscountPrice] = useState(() =>
    parseNumber(state?.priceDetails?.discount || 0)
  );
  const [gstAmount, setGstAmount] = useState(() =>
    parseNumber(state?.priceDetails?.gstAmount || 0)
  );
  const [bookingStatus, setBookingStatus] = useState(null);

  const nights = useMemo(
    () => calculateStayNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate]
  );

  // --- Food Selection ---
  const availableFoods = useMemo(
    () => (Array.isArray(hotel?.foods) ? hotel.foods : []),
    [hotel?.foods]
  );
  const [selectedFood, setSelectedFood] = useState(() => {
    const initial = state?.selectedFood;
    return Array.isArray(initial) ? initial : [];
  });

  const upsertFood = useCallback((food, nextQty) => {
    const qty = Math.max(parseNumber(nextQty, 0), 0);
    const foodId = food?.foodId || food?._id || food?.id || food?.name;
    if (!foodId) return;
    setSelectedFood((prev) => {
      const existing = Array.isArray(prev) ? prev : [];
      const idx = existing.findIndex(
        (x) => String(x.foodId || x._id || x.id || x.name) === String(foodId)
      );
      if (qty <= 0)
        return idx >= 0 ? existing.filter((_, i) => i !== idx) : existing;
      const price = parseNumber(food?.price, 0);
      const nextItem = {
        ...food,
        foodId,
        name: food?.name,
        price,
        quantity: qty,
        totalPrice: price * qty,
      };
      if (idx >= 0) {
        const copy = [...existing];
        copy[idx] = nextItem;
        return copy;
      }
      return [...existing, nextItem];
    });
  }, []);

  // --- Price Calculations ---
  const foodTotal = useMemo(
    () => sumFoodSelections(selectedFood),
    [selectedFood]
  );
  const baseSubtotal = effectiveRoomNightlyPrice * roomsCount * nights;
  const grossAmount = baseSubtotal + foodTotal;
  const subtotalAfterDiscount = Math.max(grossAmount - discountPrice, 0);
  const finalPayableTotal = subtotalAfterDiscount + gstAmount;

  const priceSummary = useMemo(
    () => ({
      roomSubtotal: Math.round(baseSubtotal),
      addonsTotal: Math.round(foodTotal),
      discount: Math.round(Math.max(discountPrice, 0)),
      taxes: Math.round(Math.max(gstAmount, 0)),
      netPay: Math.max(Math.round(finalPayableTotal), 0),
    }),
    [baseSubtotal, foodTotal, discountPrice, gstAmount, finalPayableTotal]
  );

  const guestFormValid = useMemo(() => {
    if (isLoggedIn) return true;
    const nameValid = (guestDetails.name || "").trim().length >= 2;
    const phoneDigits = (guestDetails.phone || "").replace(/[^0-9]/g, "");
    return nameValid && phoneDigits.length >= 6;
  }, [guestDetails, isLoggedIn]);

  // --- Booking Operations ---
  const { handleApplyCoupon, handleOfflineBooking, recalculateGst } =
    useBookingOperations({
      hotelId,
      hotelData: hotel,
      user,
      guestDetails,
      selectedRooms: selectedRoomsPayload,
      selectedFood,
      couponCode,
      roomsCount,
      guestsCount,
      checkInDate,
      checkOutDate,
      finalTotal: priceSummary.netPay,
      discountPrice,
      setDiscountPrice,
      setIsCouponApplied,
      setGstAmount,
      toBeCheckRoomNumber: roomsCount,
    });

  useEffect(() => {
    if (!selectedRoomsPayload.length) return;
    recalculateGst();
  }, [
    selectedRoomsPayload,
    roomsCount,
    nights,
    discountPrice,
    selectedFood,
    recalculateGst,
  ]);

  const [offlineBookingLoading, setOfflineBookingLoading] = useState(false);

  const triggerOfflineBooking = useCallback(async () => {
    if (offlineBookingLoading) return;
    setOfflineBookingLoading(true);
    const result = await handleOfflineBooking?.();
    console.log("🎉 Booking Result:", result);
    if (result?.success) {
      // Extract the actual booking data from nested response
      const actualData = result.data?.data || result.data;
      console.log("📦 Actual Booking Data to Modal:", actualData);
      setBookingResponseData(actualData);
      setShowBookingSheet(false);
      // Show success modal
      setShowSuccessModal(true);
    }
    setOfflineBookingLoading(false);
  }, [handleOfflineBooking, offlineBookingLoading]);

  // --- Policy Highlights ---
  const policy0 = hotel?.policies?.[0] || {};
  const policyHighlights = useMemo(() => {
    const base = [
      { label: "Check-in", val: policy0.checkInPolicy || policy0.checkIn },
      { label: "Check-out", val: policy0.checkOutPolicy || policy0.checkOut },
      { label: "Couples", val: policy0.unmarriedCouplesAllowed },
      { label: "Pets", val: policy0.petsAllowed },
      { label: "Smoking", val: policy0.smokingAllowed },
    ];
    return base
      .filter(
        (x) =>
          x.val !== undefined && x.val !== null && String(x.val).trim() !== ""
      )
      .slice(0, 5);
  }, [policy0]);

  // --- Reviews ---
  const reviewsArray = useMemo(() => {
    const candidates = [
      hotel?.reviews,
      hotel?.review,
      hotel?.ratings,
      hotel?.testimonials,
    ];
    const arr = candidates.find((x) => Array.isArray(x));
    return Array.isArray(arr) ? arr : [];
  }, [hotel]);

  const reviewCount = useMemo(() => {
    const direct = parseNumber(
      hotel?.reviewCount ?? hotel?.reviewsCount ?? hotel?.ratingsCount ?? 0,
      0
    );
    return direct > 0 ? direct : reviewsArray.length;
  }, [hotel, reviewsArray.length]);



  // --- Helpers ---
  const formatDateShort = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate()} ${date.toLocaleDateString("en-US", {
      month: "short",
    })}`;
  };

  const AMENITIES_PREVIEW = 8;
  const amenitiesPreview = useMemo(
    () => allAmenities.slice(0, AMENITIES_PREVIEW),
    [allAmenities]
  );
  const amenitiesRemaining = Math.max(
    allAmenities.length - AMENITIES_PREVIEW,
    0
  );
  const amenitiesToRender = showAllAmenities ? allAmenities : amenitiesPreview;

  // --- Loading State ---
  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // BookingPanel removed - inlined at render to prevent remounts and preserve input focus

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-20 font-sans compact-booknow">
      {/* Modals */}
      {showCalendar && (
        <CalendarPicker
          checkIn={checkInDate}
          checkOut={checkOutDate}
          onCheckInChange={setCheckInDate}
          onCheckOutChange={setCheckOutDate}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showPolicies && (
        <PoliciesModal
          policies={hotel?.policies}
          onClose={() => setShowPolicies(false)}
        />
      )}
      {showGallery && (
        <GalleryModal
          images={galleryImages}
          startIndex={galleryIndex}
          title={hotelName}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {hotelName}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
              <MapPin size={12} /> {hotel?.city}
              {hotel?.state ? `, ${hotel.state}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <SectionCard>
              <div className="rounded-3xl overflow-hidden border border-gray-100 bg-gray-100">
                <button
                  onClick={() => {
                    setGalleryIndex(0);
                    setShowGallery(true);
                  }}
                  className="block w-full"
                >
                  <img
                    src={galleryImages[0]}
                    alt={hotelName}
                    className="w-full h-57.5 sm:h-80 object-cover"
                  />
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {galleryImages.slice(0, 8).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setGalleryIndex(i);
                      setShowGallery(true);
                    }}
                    className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                  >
                    <img
                      src={img}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {galleryImages.length > 8 && (
                  <button
                    onClick={() => setShowGallery(true)}
                    className="shrink-0 w-16 h-16 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 flex items-center justify-center"
                  >
                    +{galleryImages.length - 8}
                  </button>
                )}
              </div>
            </SectionCard>

            {/* About */}
            <SectionCard
              title="About property"
              icon={<ShieldCheck size={20} className="text-blue-600" />}
            >
              <p className="text-gray-700 text-sm leading-relaxed">
                {hotelDescription}
              </p>
            </SectionCard>

            {/* Amenities */}
            <SectionCard
              title="Amenities"
              icon={<Sparkles size={20} className="text-yellow-500" />}
              right={
                amenitiesRemaining > 0 && (
                  <button
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="text-blue-600 text-xs font-semibold hover:underline"
                  >
                    {showAllAmenities
                      ? "Show less"
                      : `+${amenitiesRemaining} more`}
                  </button>
                )
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenitiesToRender.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-sm text-gray-700 border border-gray-100 bg-gray-50 rounded-2xl px-3 py-2"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span className="text-xs sm:text-sm leading-tight">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Rooms */}
            <SectionCard
              title="Rooms"
              icon={<Users size={20} className="text-indigo-600" />}
            >
              <div className="space-y-3">
                {rooms.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  const canSelect = Boolean(room.isAvailable);
                  return (
                    <button
                      key={room.id}
                      onClick={() => canSelect && setSelectedRoomId(room.id)}
                      disabled={!canSelect}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40"
                          : "border-gray-100 bg-white"
                      } ${!canSelect ? "opacity-60" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                          <img
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900 truncate">
                              {room.name}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600 text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {room.area} • Max 3 Guests
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900">
                                ₹{formatCurrency(room.finalPrice)}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                + ₹{formatCurrency(room.taxes)} taxes
                              </div>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                room.isAvailable
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-gray-50 border-gray-200 text-gray-700"
                              } border`}
                            >
                              {room.isAvailable ? "Available" : "Sold out"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Foods */}
            {availableFoods.length > 0 && (
              <SectionCard
                title="Foods"
                icon={<UtensilsCrossed size={20} className="text-red-500" />}
              >
                <div className="space-y-3">
                  {availableFoods.map((food, idx) => {
                    const foodId =
                      food?.foodId || food?._id || food?.id || food?.name;
                    const selected = selectedFood.find(
                      (x) =>
                        String(x.foodId || x._id || x.id || x.name) ===
                        String(foodId)
                    );
                    const qty = Math.max(parseNumber(selected?.quantity, 0), 0);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-100 p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {food?.name || "Meal"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ₹{formatCurrency(food?.price)} per item
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1">
                            <button
                              onClick={() => upsertFood(food, qty - 1)}
                              className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-600"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-bold text-gray-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => upsertFood(food, qty + 1)}
                              className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-600"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        {qty > 0 && (
                          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-bold text-gray-900">
                              ₹
                              {formatCurrency(
                                parseNumber(food?.price, 0) * qty
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Policies */}
            <SectionCard
              title="Policies"
              icon={<Info size={18} className="text-blue-500" />}
              right={
                <button
                  onClick={() => setShowPolicies(true)}
                  className="text-blue-600 text-xs font-semibold hover:underline"
                >
                  View all
                </button>
              }
            >
              {policyHighlights.length ? (
                <div className="flex flex-wrap gap-2">
                  {policyHighlights.map((p, idx) => {
                    const badge = badgeForPolicy(p.val);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-gray-100 bg-gray-50"
                      >
                        <span className="text-[11px] text-gray-600">
                          {p.label}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  Policies not available.
                </div>
              )}
            </SectionCard>

            {/* Reviews */}
           <ReviewSection
             reviewsArray={reviewsArray}
             reviewCount={reviewCount}
             hotelRating={hotelRating}
           />
          </div>

          {/* Right Column - Desktop Booking Panel */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-visible relative z-40">
                <div className="bg-linear-to-r from-blue-600 to-blue-700 p-4 text-white rounded-t-3xl">
                  <h3 className="font-bold text-lg">Your Stay</h3>
                  <p className="text-xs text-blue-100">
                    {nights} Night{nights > 1 ? "s" : ""} at {hotelName}
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Date & Room Selection */}
                  <div className="flex gap-3 relative z-50">
                    <button
                      onClick={() => setShowCalendar(true)}
                      className="flex-1 flex flex-col items-start p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition border border-transparent hover:border-blue-200"
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Dates
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mt-1">
                        <CalendarDays size={16} className="text-blue-500" />
                        <span>
                          {formatDateShort(checkInDate)} -{" "}
                          {formatDateShort(checkOutDate)}
                        </span>
                      </div>
                    </button>
                    <div className="relative" ref={roomsPopupRef}>
                      <button
                        onClick={() => setShowRoomsPopup(!showRoomsPopup)}
                        className="h-full flex flex-col items-start p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition border border-transparent hover:border-blue-200 min-w-30"
                      >
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Rooms
                        </span>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mt-1">
                          <Users size={16} className="text-blue-500" />
                          <span>
                            {roomsCount}R, {guestsCount}G
                          </span>
                        </div>
                      </button>
                      {showRoomsPopup && (
                        <RoomsGuestsPopup
                          rooms={roomsCount}
                          guests={guestsCount}
                          onRoomsChange={setRoomsCount}
                          onGuestsChange={setGuestsCount}
                          onClose={() => setShowRoomsPopup(false)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <InfoRows
                    rows={[
                      {
                        label: `Room Price (${nights} night${
                          nights > 1 ? "s" : ""
                        })`,
                        value: `₹${formatCurrency(priceSummary.roomSubtotal)}`,
                      },
                      ...(priceSummary.addonsTotal > 0
                        ? [
                            {
                              label: "Meals & Addons",
                              value: `₹${formatCurrency(
                                priceSummary.addonsTotal
                              )}`,
                            },
                          ]
                        : []),
                      {
                        label: "Taxes & Fees",
                        value: `₹${formatCurrency(priceSummary.taxes)}`,
                      },
                      ...(priceSummary.discount > 0
                        ? [
                            {
                              label: "Total Savings",
                              value: `- ₹${formatCurrency(
                                priceSummary.discount
                              )}`,
                              valueClass: "text-emerald-700",
                            },
                          ]
                        : []),
                    ]}
                  />

                  {/* Total */}
                  <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                    <span className="font-bold text-gray-900">
                      Total Payable
                    </span>
                    <span className="font-bold text-xl text-blue-600">
                      ₹{formatCurrency(priceSummary.netPay)}
                    </span>
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Have a coupon?"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <button
                      onClick={() => handleApplyCoupon?.(couponCode)}
                      disabled={!couponCode}
                      className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black disabled:opacity-50 transition"
                    >
                      APPLY
                    </button>
                  </div>

                  {/* Guest Details & Book Button (only in full panel) */}
                  <>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-gray-500" /> Guest
                        Details
                      </h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={guestDetails.name}
                          onChange={(e) =>
                            setGuestDetails({
                              ...guestDetails,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={guestDetails.phone}
                            onChange={(e) =>
                              setGuestDetails({
                                ...guestDetails,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                          />
                          <input
                            type="email"
                            placeholder="Email (Optional)"
                            value={guestDetails.email}
                            onChange={(e) =>
                              setGuestDetails({
                                ...guestDetails,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                          />
                        </div>
                        {!guestFormValid && (
                          <p className="text-xs text-rose-600">
                            Please enter valid name and mobile number.
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={
                        !guestFormValid ||
                        offlineBookingLoading ||
                        priceSummary.netPay <= 0
                      }
                      onClick={triggerOfflineBooking}
                      className={`w-full py-4 bg-linear-to-r ${
                        roomsCount > 3
                          ? "from-orange-500 to-orange-600"
                          : "from-blue-600 to-blue-700"
                      } text-white font-bold text-lg rounded-2xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-3`}
                    >
                      {offlineBookingLoading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <span>
                            {roomsCount > 3
                              ? "Request Group Booking"
                              : "Book Now & Pay at Hotel"}
                          </span>
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                    {bookingStatus?.type === "offline" && (
                      <div
                        className={`${
                          bookingStatus.status === "Pending"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-emerald-50 border-emerald-200"
                        } border rounded-2xl p-4 flex items-start gap-3`}
                      >
                        <CheckCircle2
                          size={24}
                          className={
                            bookingStatus.status === "Pending"
                              ? "text-orange-600"
                              : "text-emerald-600"
                          }
                        />
                        <div>
                          <h4 className="font-bold">
                            {bookingStatus.status === "Pending"
                              ? "Request Received"
                              : "Booking Confirmed!"}
                          </h4>
                          <p className="text-sm mt-1">
                            Reference: {bookingStatus.reference}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowBookingSheet(true)}
            className="flex-1 text-left rounded-2xl border border-gray-200 bg-white px-4 py-2"
          >
            <div className="text-[11px] uppercase font-bold text-gray-400">
              Total
            </div>
            <div className="text-base font-extrabold text-gray-900">
              ₹{formatCurrency(priceSummary.netPay)}
            </div>
          </button>
          <button
            disabled={!guestFormValid || offlineBookingLoading}
            onClick={() => setShowBookingSheet(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-60"
          >
            Book
          </button>
        </div>
      </div>

      {/* Mobile Booking Sheet */}
      {showBookingSheet && (
  <div className="fixed inset-0 z-140 bg-black/40 backdrop-blur-[2px]">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowBookingSheet(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition"
            >
              <X size={20} className="text-gray-700" />
            </button>

            {/* Blue Header with Your Stay Info */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-5 pt-6 pb-4 text-white rounded-t-3xl">
              <h3 className="font-bold text-xl">Your Stay</h3>
              <p className="text-sm text-blue-100 mt-1">
                {nights} Night{nights > 1 ? "s" : ""} at {hotelName}
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Dates and Rooms Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-500 mb-2 flex items-center gap-1">
                    <CalendarDays size={14} /> Dates
                  </div>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-200"
                  >
                    <div className="text-sm font-bold text-gray-900">
                      {formatDateShort(checkInDate)} -{" "}
                      {formatDateShort(checkOutDate)}
                    </div>
                  </button>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-gray-500 mb-2 flex items-center gap-1">
                    <Users size={14} /> Rooms
                  </div>
                  <button
                    onClick={() => setShowRoomsPopup(!showRoomsPopup)}
                    className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-200"
                  >
                    <div className="text-sm font-bold text-gray-900">
                      {roomsCount}R, {guestsCount}G
                    </div>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Room Price ({nights} night{nights > 1 ? "s" : ""})
                  </span>
                  <span className="font-bold text-gray-900">
                    ₹{formatCurrency(priceSummary.roomTotal)}
                  </span>
                </div>
                {priceSummary.gst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-bold text-gray-900">
                      ₹{formatCurrency(priceSummary.gst)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Payable</span>
                  <span className="text-xl font-extrabold text-blue-600">
                    ₹{formatCurrency(priceSummary.netPay)}
                  </span>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Tag
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  Apply
                </button>
              </div>
              {/* Coupon Code */}

              {/* Guest Details */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={18} className="text-gray-600" /> Guest Details
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestDetails.name}
                    onChange={(e) =>
                      setGuestDetails({ ...guestDetails, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={guestDetails.phone}
                      onChange={(e) =>
                        setGuestDetails({
                          ...guestDetails,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={guestDetails.email}
                      onChange={(e) =>
                        setGuestDetails({
                          ...guestDetails,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  {!guestFormValid && (
                    <p className="text-xs text-rose-600">
                      Please enter valid name and mobile number.
                    </p>
                  )}
                </div>
              </div>

              {/* Book Now Button */}
              <button
                disabled={!guestFormValid || offlineBookingLoading}
                onClick={triggerOfflineBooking}
                className={`w-full py-4 bg-linear-to-r ${
                  roomsCount > 3
                    ? "from-orange-500 to-orange-600"
                    : "from-blue-600 to-blue-700"
                } text-white font-bold text-lg rounded-xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-3`}
              >
                {offlineBookingLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span>
                      {roomsCount > 3
                        ? "Request Group Booking"
                        : "Book Now & Pay at Hotel"}
                    </span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {/* Booking Status */}
              {bookingStatus?.type === "offline" && (
                <div
                  className={`${
                    bookingStatus.status === "Pending"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-emerald-50 border-emerald-200"
                  } border rounded-xl p-4 flex items-start gap-3`}
                >
                  <CheckCircle2
                    size={24}
                    className={
                      bookingStatus.status === "Pending"
                        ? "text-orange-600"
                        : "text-emerald-600"
                    }
                  />
                  <div>
                    <h4 className="font-bold">
                      {bookingStatus.status === "Pending"
                        ? "Request Received"
                        : "Booking Confirmed!"}
                    </h4>
                    <p className="text-sm mt-1">
                      Reference: {bookingStatus.reference}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/bookings");
        }}
        bookingData={bookingResponseData}
      />
    </div>
  );
}
