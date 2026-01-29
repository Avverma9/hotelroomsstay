import { useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  applyCouponCode,
  getGstForHotelData,
} from "../../../redux/slices/bookingSlice";
import { useLoader } from "../../../utils/loader.jsx";
import {
  createBookingRequest,
  createPaymentOrder,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "../../../services/bookingService";
import { userId } from "@/utils/Unauthorized";

const formatForApi = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
};

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};

const totalFoodPrice = (items = []) =>
  items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Math.max(item.quantity || 1, 1),
    0
  );

const totalRoomPricePerNight = (rooms = []) =>
  rooms.reduce(
    (sum, room) => sum + Number(room.finalPrice || room.price || 0),
    0
  );

const roomTaxPerNight = (rooms = []) =>
  rooms.reduce((sum, room) => {
    // Prefer the pre-calculated GST amount from the API if available
    if (room?.gstAmount !== undefined && room?.gstAmount !== null) {
      return sum + Number(room.gstAmount);
    }
    const price = Number(room?.finalPrice ?? room?.price ?? 0);
    const percent = Number(room?.gstPercent ?? room?.gstPercentage ?? 0);
    if (!price || !percent) return sum;
    return sum + (price * percent) / 100;
  }, 0);

const foodTaxPerNight = (foods = []) =>
  foods.reduce((sum, item) => {
    // Food GST isn't provided in current payload; treat it as 0 unless API/fields are added later.
    const price = Number(item?.price ?? 0);
    const qty = Math.max(Number(item?.quantity ?? 1), 1);
    const percent = Number(item?.gstPercent ?? item?.gstPercentage ?? 0);
    if (!price || !percent) return sum;
    return sum + (price * qty * percent) / 100;
  }, 0);

const computeBookingStatus = ({ roomsCount, nights }) => {
  const rooms = Number(roomsCount || 0);
  const stayNights = Number(nights || 0);

  // Business rules:
  // 1) If customer books more than 3 rooms => Pending (regardless of nights)
  // 2) If single-room booking and more than 3 nights => Pending
  if (rooms > 3) return "Pending";
  if (rooms === 1 && stayNights > 3) return "Pending";
  return "Confirmed";
};

const useBookingOperations = ({
  hotelId,
  hotelData,
  user,
  guestDetails,
  selectedRooms,
  selectedFood,
  couponCode,
  roomsCount,
  guestsCount,
  checkInDate,
  checkOutDate,
  finalTotal,
  discountPrice,
  setDiscountPrice,
  setIsCouponApplied,
  setGstAmount,
  toBeCheckRoomNumber,
}) => {
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  // Prevent GST API from being called repeatedly for the exact same computed taxable amount.
  // This happens easily when components re-render or when callback dependencies change.
  const lastGstQueryRef = useRef({ taxableAmount: null, result: 0 });

  const nights = useMemo(
    () => calculateNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate]
  );

  const sanitizedGuestDetails = useMemo(
    () => ({
      name: guestDetails?.name?.trim() || "",
      email: guestDetails?.email?.trim() || "",
      phone: guestDetails?.phone?.replace?.(/\s+/g, "") || "",
    }),
    [guestDetails]
  );

  const resolvedContact = useMemo(
    () => ({
      name:
        sanitizedGuestDetails.name ||
        (user?.name || user?.displayName || "").trim(),
      email: sanitizedGuestDetails.email || (user?.email || "").trim(),
      phone:
        sanitizedGuestDetails.phone ||
        (user?.mobile ? String(user.mobile).trim() : ""),
    }),
    [
      sanitizedGuestDetails.email,
      sanitizedGuestDetails.name,
      sanitizedGuestDetails.phone,
      user?.displayName,
      user?.email,
      user?.mobile,
      user?.name,
    ]
  );

  const bookingUserId = useMemo(
    () => user?.id || sanitizedGuestDetails.phone || "guest",
    [sanitizedGuestDetails.phone, user?.id]
  );

  const ensureUserAndRoom = useCallback(() => {
    if (!selectedRooms || selectedRooms.length === 0) {
      toast.error("Please select a room before continuing.");
      return false;
    }
    if (Number(toBeCheckRoomNumber) <= 0) {
      toast.error("This room is already fully booked.");
      return false;
    }
    if (!user?.id) {
      if (
        !sanitizedGuestDetails.name ||
        !sanitizedGuestDetails.phone ||
        sanitizedGuestDetails.phone.length < 6
      ) {
        toast.error("Add your name and mobile number to continue.");
        return false;
      }
    }
    return true;
  }, [
    sanitizedGuestDetails.name,
    sanitizedGuestDetails.phone,
    selectedRooms,
    toBeCheckRoomNumber,
    user?.id,
  ]);

  const buildBookingPayload = useCallback(
    (overrides = {}) => ({
      hotelId,
      user: user?.id || undefined,
      checkInDate: formatForApi(checkInDate),
      checkOutDate: formatForApi(checkOutDate),
      guests: guestsCount,
      numRooms: roomsCount,
      roomDetails:
        selectedRooms?.map((room) => ({
          roomId: room.roomId || room._id || room.id,
          type: room.type || room.name,
          bedTypes: room.bedTypes,
          price: Number(room.finalPrice || room.price || 0),
        })) || [],
      foodDetails:
        selectedFood?.map((food) => ({
          foodId: food.foodId || food.id,
          name: food.name,
          price: Number(food.price || 0),
          quantity: food.quantity || 1,
        })) || [],
      price: finalTotal,
      pm: overrides.pm || "Online",
      couponCode: overrides.couponCode ?? couponCode,
      discountPrice,
      bookingStatus: computeBookingStatus({ roomsCount, nights }),
      bookingSource: "Site",
      destination: hotelData?.city,
      hotelName: hotelData?.hotelName,
      hotelOwnerName: hotelData?.hotelOwnerName,
      hotelEmail: hotelData?.hotelEmail,
      contactName: resolvedContact.name,
      contactEmail: resolvedContact.email,
      contactNumber: resolvedContact.phone,
      guestDetails: {
        fullName: resolvedContact.name,
        email: resolvedContact.email,
        mobile: resolvedContact.phone,
      },
      ...overrides,
    }),
    [
      checkInDate,
      checkOutDate,
      couponCode,
      discountPrice,
      finalTotal,
      guestsCount,
      hotelData?.city,
      hotelData?.hotelEmail,
      hotelData?.hotelName,
      hotelData?.hotelOwnerName,
      hotelId,
      resolvedContact.email,
      resolvedContact.name,
      resolvedContact.phone,
      roomsCount,
      selectedFood,
      selectedRooms,
      user?.id,
    ]
  );

  const recalculateGst = useCallback(async () => {
    // Prefer using the per-room GST percent if available (more accurate than the generic API call).
    // Fallback to the API only when no GST percent data exists on selected items.
    const roomsGstPercentExists = (selectedRooms || []).some(
      (r) => Number(r?.gstPercent ?? r?.gstPercentage ?? 0) > 0
    );
    const foodsGstPercentExists = (selectedFood || []).some(
      (f) => Number(f?.gstPercent ?? f?.gstPercentage ?? 0) > 0
    );

    if (roomsGstPercentExists || foodsGstPercentExists) {
      // selectedRooms already contains the *effective* price (BookNow overrides price/finalPrice
      // when monthly/special pricing is active), so GST stays accurate for selected dates.
      const roomTax = roomTaxPerNight(selectedRooms) * roomsCount * nights;

      // Food is NOT multiplied by nights in the UI currently (it’s treated as per-stay add-on).
      // So GST for food should follow the same rule: per-stay tax, not per-night tax.
      const foodTax = foodTaxPerNight(selectedFood);
      const gstValue = Math.max(Math.round(roomTax + foodTax), 0);
      lastGstQueryRef.current = { taxableAmount: null, result: gstValue };
      setGstAmount?.(gstValue);
      return gstValue;
    }

    const roomNightlyTotal = totalRoomPricePerNight(selectedRooms);
    const foodTotal = totalFoodPrice(selectedFood);
    const baseSubtotal = roomNightlyTotal * roomsCount * nights;
    const taxableAmount = Math.max(
      baseSubtotal + foodTotal - (discountPrice || 0),
      0
    );
    const roundedTaxable = Math.round(taxableAmount);

    if (!roundedTaxable) {
      lastGstQueryRef.current = { taxableAmount: 0, result: 0 };
      setGstAmount?.(0);
      return 0;
    }

    if (lastGstQueryRef.current.taxableAmount === roundedTaxable) {
      setGstAmount?.(lastGstQueryRef.current.result);
      return lastGstQueryRef.current.result;
    }

    try {
      const response = await dispatch(
        getGstForHotelData({
          hotelId,
          amount: roundedTaxable,
        })
      ).unwrap();

      const gstValue =
        Number(
          response?.gstAmount ?? response?.amount ?? response?.data ?? 0
        ) || 0;
      lastGstQueryRef.current = {
        taxableAmount: roundedTaxable,
        result: gstValue,
      };
      setGstAmount?.(gstValue);
      return gstValue;
    } catch (error) {
      console.error("GST calculation error:", error);
      lastGstQueryRef.current = { taxableAmount: roundedTaxable, result: 0 };
      setGstAmount?.(0);
      return 0;
    }
  }, [
    discountPrice,
    dispatch,
    hotelId,
    nights,
    roomsCount,
    selectedFood,
    selectedRooms,
    setGstAmount,
  ]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode) {
      toast.error("Please enter a coupon code first.");
      return;
    }
    if (!ensureUserAndRoom()) return;

    const payload = {
      hotelId,
      userId,
      roomId: selectedRooms?.[0]?.roomId,
      couponCode,
      checkInDate: formatForApi(checkInDate),
      checkOutDate: formatForApi(checkOutDate),
      numRooms: roomsCount,
      guests: guestsCount,
    };

    try {
      const result = await dispatch(applyCouponCode(payload)).unwrap();
      const discount =
        Number(
          result?.discountPrice ?? result?.discount ?? result?.amount ?? 0
        ) || 0;
      setDiscountPrice?.(discount);
      setIsCouponApplied?.(true);
      toast.success(result?.message || "Coupon applied!");
      // GST depends on the discount amount.
      await recalculateGst();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid coupon code.";
      toast.error(message);
      setIsCouponApplied?.(false);
    }
  }, [
    checkInDate,
    checkOutDate,
    couponCode,
    dispatch,
    ensureUserAndRoom,
    guestsCount,
    hotelId,
    recalculateGst,
    roomsCount,
    selectedRooms,
    setDiscountPrice,
    setIsCouponApplied,
  ]);

  const handleOfflineBooking = useCallback(async () => {
    if (!ensureUserAndRoom()) return { success: false };
    try {
      showLoader();
      const payload = buildBookingPayload({ pm: "Offline" });
      const response = await createBookingRequest(bookingUserId, hotelId, payload);
      toast.success("Booking confirmed! Pay at hotel on arrival.");
      localStorage.removeItem("discountPrice");
      return { success: true, data: response };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Booking failed, please try again.";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      hideLoader();
    }
  }, [
    bookingUserId,
    buildBookingPayload,
    ensureUserAndRoom,
    hideLoader,
    hotelId,
    showLoader,
  ]);

  const handleOnlinePayment = useCallback(
    async ({ partial = false } = {}) => {
      if (!ensureUserAndRoom()) return;
      try {
        showLoader();
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) {
          toast.error("Unable to load Razorpay SDK. Check your connection.");
          return;
        }

        const payableAmount = partial
          ? Math.round(finalTotal * 0.25)
          : finalTotal;
        if (!payableAmount) {
          toast.error("Payment amount must be greater than zero.");
          return;
        }

        const orderData = await createPaymentOrder(payableAmount);
        const orderId = orderData?.orderId || orderData?.id;
        if (!orderId) {
          toast.error("Failed to initiate payment. Please retry.");
          return;
        }

        const options = {
          key:
            import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_0UMxKeTqqehh1o",
          amount: Math.round(payableAmount * 100),
          currency: "INR",
          name: hotelData?.hotelName || "Hotel Booking",
          description: partial ? "25% advance payment" : "Room + Food Booking",
          order_id: orderId,
          handler: async (response) => {
            try {
              await createBookingRequest(
                bookingUserId,
                hotelId,
                buildBookingPayload({
                  pm: "Online",
                  paymentId: response.razorpay_payment_id,
                  isPartialBooking: partial,
                  bookingStatus: partial ? "Pending" : undefined,
                  partialAmount: partial ? payableAmount : undefined,
                })
              );
              toast.success("Booking confirmed!");
              localStorage.removeItem("discountPrice");
            } catch (bookingError) {
              console.error("Booking error after payment:", bookingError);
              toast.error(
                "Payment captured but booking failed. Please contact support."
              );
            }
          },
          prefill: {
            name: resolvedContact.name,
            email: resolvedContact.email,
            contact: resolvedContact.phone,
          },
          theme: {
            color: "#3399cc",
          },
        };

        openRazorpayCheckout(options);
      } catch (error) {
        console.error("Payment error:", error);
        toast.error(error?.message || "Something went wrong during payment.");
      } finally {
        hideLoader();
      }
    },
    [
      bookingUserId,
      buildBookingPayload,
      ensureUserAndRoom,
      finalTotal,
      hideLoader,
      hotelData?.hotelName,
      hotelId,
      resolvedContact.email,
      resolvedContact.name,
      resolvedContact.phone,
      showLoader,
    ]
  );

  const handlePartialPayment = useCallback(
    () => handleOnlinePayment({ partial: true }),
    [handleOnlinePayment]
  );

  return {
    handleApplyCoupon,
    handleOfflineBooking,
    handleOnlinePayment,
    handlePartialPayment,
    recalculateGst,
  };
};

export default useBookingOperations;
