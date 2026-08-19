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
  FileText,
  Info,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

import useBookingOperations from "./hooks/useBookingOperations";
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
import {
  PLACEHOLDER_IMAGE,
  DEFAULT_AMENITIES,
  formatCurrency,
  parseNumber,
  ensureIsoDate,
  normalizeHotelId,
  deriveHotelId,
  normalizeAmenities,
  normalizeFoods,
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

export default function BookNowPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const bookingState = useSelector((store) => store.booking) || {};
  const user = useSelector((store) => store.auth?.user) || null;
  const isLoggedIn = Boolean(user?.id);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roomsPopupRef.current && !roomsPopupRef.current.contains(e.target)) {
        setShowRoomsPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const hotelName = hotel?.hotelName || hotel?.name || "Selected Property";
  const hotelAddress =
    hotel?.address ||
    [hotel?.landmark, hotel?.city, hotel?.state].filter(Boolean).join(", ") ||
    "Address available after confirmation";
  const hotelRating = Number.isFinite(Number(hotel?.rating))
    ? Number(hotel.rating)
    : null;
  const hotelDescription =
    hotel?.description ||
    hotel?.about ||
    "Experience pure comfort with refined hospitality and prime architectural amenities designed for your journey.";
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
          name: hotel?.defaultRoomName || "Standard Deluxe Room",
          area: hotel?.defaultRoomArea || "Approx. 200 sq.ft",
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

      const monthlyOverride = pickMonthlyOverride(
        bookingState.monthlyData,
        baseRoomId,
        checkInDate,
        checkOutDate
      );
      const effectivePrice = monthlyOverride?.monthPrice
        ? parseNumber(monthlyOverride.monthPrice, originalPrice)
        : originalPrice;

      return {
        id: baseRoomId,
        roomId: baseRoomId,
        name: room.name || room.type || `Room ${index + 1}`,
        area: room.size || room.area || "Approx. 200 sq.ft",
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

  const availableFoods = useMemo(
    () => normalizeFoods(hotel?.foods, []),
    [hotel?.foods]
  );
  const [selectedFood, setSelectedFood] = useState(() => {
    const initial = state?.selectedFood;
    return normalizeFoods(Array.isArray(initial) ? initial : [], []);
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
    if (result?.success) {
      const actualData = result.data?.data || result.data;
      setBookingResponseData(actualData);
      setShowBookingSheet(false);
      setShowSuccessModal(true);
    }
    setOfflineBookingLoading(false);
  }, [handleOfflineBooking, offlineBookingLoading]);

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

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-800 font-['Roboto',sans-serif]">
        <Loader2 className="animate-spin text-neutral-600 mb-3" size={28} />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
          Loading Booking Details...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-['Roboto',sans-serif] antialiased selection:bg-neutral-200 selection:text-neutral-900 pb-28 lg:pb-16">
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

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                {hotelName}
              </h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1 truncate">
                <MapPin size={12} className="shrink-0" />
                {hotelAddress}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs bg-neutral-100 text-neutral-700 font-medium px-3 py-1 rounded-md border border-neutral-200">
              {nights} Night{nights > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
              <div className="relative rounded-lg overflow-hidden bg-neutral-100 aspect-[16/10] border border-neutral-200">
                <button
                  onClick={() => {
                    setGalleryIndex(0);
                    setShowGallery(true);
                  }}
                  className="w-full h-full block cursor-pointer group"
                >
                  <img
                    src={galleryImages[0]}
                    alt={hotelName}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  <div className="absolute bottom-3 right-3 bg-neutral-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded">
                    View Photos ({galleryImages.length})
                  </div>
                </button>
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setGalleryIndex(i);
                        setShowGallery(true);
                      }}
                      className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 hover:opacity-80 transition"
                    >
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {galleryImages.length > 6 && (
                    <button
                      onClick={() => setShowGallery(true)}
                      className="shrink-0 w-16 h-16 rounded-md border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center transition"
                    >
                      +{galleryImages.length - 6}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-neutral-500 text-xs font-bold tracking-wider uppercase">
                <FileText size={15} />
                <span>Overview</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
                About the Property
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {hotelDescription}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold tracking-wider uppercase">
                  <Sparkles size={15} />
                  <span>Highlights</span>
                </div>
                {amenitiesRemaining > 0 && (
                  <button
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="text-neutral-900 text-xs font-bold underline hover:text-neutral-600"
                  >
                    {showAllAmenities
                      ? "Show less"
                      : `+${amenitiesRemaining} more`}
                  </button>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
                Amenities & Services
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {amenitiesToRender.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-700"
                  >
                    <div className="w-7 h-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span className="text-xs font-medium truncate">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-neutral-500 text-xs font-bold tracking-wider uppercase">
                <Users size={15} />
                <span>Available Units</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
                Select Room Type
              </h2>
              <div className="space-y-3">
                {rooms.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  const canSelect = Boolean(room.isAvailable);
                  return (
                    <button
                      key={room.id}
                      onClick={() => canSelect && setSelectedRoomId(room.id)}
                      disabled={!canSelect}
                      className={`w-full text-left rounded-lg border transition p-4 relative ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      } ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100">
                          <img
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                              {room.name}
                            </h3>
                            {isSelected && (
                              <span className="text-[11px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {room.area} • Max 3 Guests
                          </p>
                          <div className="mt-2 flex items-baseline justify-between">
                            <div>
                              <span className="text-base font-bold text-neutral-900">
                                ₹{formatCurrency(room.finalPrice)}
                              </span>
                              <span className="text-xs text-neutral-500 ml-1">
                                + ₹{formatCurrency(room.taxes)} tax/night
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                room.isAvailable
                                  ? "border-neutral-200 text-neutral-700 bg-white"
                                  : "border-neutral-200 text-neutral-400 bg-neutral-100"
                              }`}
                            >
                              {room.isAvailable ? "Available" : "Sold Out"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {availableFoods.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-neutral-500 text-xs font-bold tracking-wider uppercase">
                  <UtensilsCrossed size={15} />
                  <span>Dining</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
                  Add Meals
                </h2>
                <div className="space-y-2.5">
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
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50"
                      >
                        <div>
                          <div className="text-sm font-bold text-neutral-900">
                            {food?.name || "Meal Option"}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            ₹{formatCurrency(food?.price)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-md p-1">
                          <button
                            onClick={() => upsertFood(food, qty - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 transition"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-neutral-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => upsertFood(food, qty + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 transition"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold tracking-wider uppercase">
                  <Info size={15} />
                  <span>Important Rules</span>
                </div>
                <button
                  onClick={() => setShowPolicies(true)}
                  className="text-neutral-900 text-xs font-bold underline hover:text-neutral-600"
                >
                  View All
                </button>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-3">
                Property Policies
              </h2>
              {policyHighlights.length ? (
                <div className="flex flex-wrap gap-2">
                  {policyHighlights.map((p, idx) => {
                    const badge = badgeForPolicy(p.val);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-100 bg-neutral-50"
                      >
                        <span className="text-xs text-neutral-500">
                          {p.label}:
                        </span>
                        <span className="text-xs font-bold text-neutral-800">
                          {badge.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  Standard hotel policies apply during check-in.
                </p>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <ReviewSection
                reviewsArray={reviewsArray}
                reviewCount={reviewCount}
                hotelRating={hotelRating}
              />
            </div>
          </div>

          <aside className="hidden lg:block lg:col-span-5 sticky top-20">
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Booking Summary
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {nights} Night{nights > 1 ? "s" : ""} Stay
                  </p>
                </div>
                <Receipt size={20} className="text-neutral-400" />
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="text-left p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Dates
                    </span>
                    <span className="text-xs font-bold text-neutral-900 mt-1 block">
                      {formatDateShort(checkInDate)} –{" "}
                      {formatDateShort(checkOutDate)}
                    </span>
                  </button>

                  <div className="relative" ref={roomsPopupRef}>
                    <button
                      onClick={() => setShowRoomsPopup(!showRoomsPopup)}
                      className="w-full text-left p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Rooms & Guests
                      </span>
                      <span className="text-xs font-bold text-neutral-900 mt-1 block">
                        {roomsCount} Room{roomsCount > 1 ? "s" : ""},{" "}
                        {guestsCount} Guest{guestsCount > 1 ? "s" : ""}
                      </span>
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

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 space-y-2.5">
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>
                      Room Price ({nights}N × {roomsCount}R)
                    </span>
                    <span className="text-neutral-900 font-bold">
                      ₹{formatCurrency(priceSummary.roomSubtotal)}
                    </span>
                  </div>
                  {priceSummary.addonsTotal > 0 && (
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>Meals & Add-ons</span>
                      <span className="text-neutral-900 font-bold">
                        ₹{formatCurrency(priceSummary.addonsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Taxes & Fees</span>
                    <span className="text-neutral-900 font-bold">
                      ₹{formatCurrency(priceSummary.taxes)}
                    </span>
                  </div>
                  {priceSummary.discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>Discount</span>
                      <span className="font-bold">
                        - ₹{formatCurrency(priceSummary.discount)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-neutral-900">
                      Total Payable
                    </span>
                    <span className="text-xl font-black text-neutral-900">
                      ₹{formatCurrency(priceSummary.netPay)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium uppercase tracking-wider text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                  <button
                    onClick={() => handleApplyCoupon?.(couponCode)}
                    disabled={!couponCode}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-black disabled:opacity-40 transition"
                  >
                    Apply
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Guest Details
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestDetails.name}
                    onChange={(e) =>
                      setGuestDetails({ ...guestDetails, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
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
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  {!guestFormValid && (
                    <p className="text-[11px] text-red-600 font-medium">
                      * Please provide valid name and mobile number.
                    </p>
                  )}
                </div>

                <button
                  disabled={
                    !guestFormValid ||
                    offlineBookingLoading ||
                    priceSummary.netPay <= 0
                  }
                  onClick={triggerOfflineBooking}
                  className="w-full py-3 bg-neutral-900 hover:bg-black text-white text-sm font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {offlineBookingLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <span>
                      {roomsCount > 3
                        ? "Request Group Booking"
                        : "Book & Pay at Hotel"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
              Total Amount
            </span>
            <span className="text-lg font-bold text-neutral-900">
              ₹{formatCurrency(priceSummary.netPay)}
            </span>
          </div>
          <button
            onClick={() => setShowBookingSheet(true)}
            className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-black transition"
          >
            Review & Pay
          </button>
        </div>
      </div>

      {showBookingSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end flex-col lg:hidden">
          <div className="bg-white border-t border-neutral-200 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Complete Booking
                </h3>
                <span className="text-xs text-neutral-500">
                  {nights} Night{nights > 1 ? "s" : ""} at {hotelName}
                </span>
              </div>
              <button
                onClick={() => setShowBookingSheet(false)}
                className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 space-y-2">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Room Charges</span>
                <span className="font-bold text-neutral-900">
                  ₹{formatCurrency(priceSummary.roomSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Taxes & Fees</span>
                <span className="font-bold text-neutral-900">
                  ₹{formatCurrency(priceSummary.taxes)}
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-900">
                  Total Payable
                </span>
                <span className="text-base font-bold text-neutral-900">
                  ₹{formatCurrency(priceSummary.netPay)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Full Name"
                value={guestDetails.name}
                onChange={(e) =>
                  setGuestDetails({ ...guestDetails, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium"
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={guestDetails.phone}
                onChange={(e) =>
                  setGuestDetails({ ...guestDetails, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium"
              />
            </div>

            <button
              disabled={!guestFormValid || offlineBookingLoading}
              onClick={triggerOfflineBooking}
              className="w-full py-3 bg-neutral-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {offlineBookingLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Confirm & Reserve"
              )}
            </button>
          </div>
        </div>
      )}

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