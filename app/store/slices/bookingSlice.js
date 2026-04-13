import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/api";
import { getUserId } from "../../utils/credentials";

const parseNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeResponse = (response) => {
  const payload = response?.data;
  if (!payload) return null;

  if (payload?.data && typeof payload.data === "object") {
    return { ...payload.data, message: payload.message || payload.data?.message };
  }
  return payload;
};

const stripHtmlField = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const { html, ...rest } = payload;
  return rest;
};

export const fetchMonthlyData = createAsyncThunk(
  "booking/fetchMonthlyData",
  async (hotelId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/monthly-set-room-price/get/by/${hotelId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed");
    }
  }
);

export const applyCouponCode = createAsyncThunk(
  "booking/applyCouponCode",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.patch("/coupons/coupon/apply", payload);
      return res?.data ?? null;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to apply coupon";
      return rejectWithValue(message);
    }
  }
);

export const getGstForHotelData = createAsyncThunk(
  "booking/getGstForHotelData",
  async ({ type = "Hotel", gstThreshold }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);

      if (gstThreshold !== undefined && gstThreshold !== null) {
        params.append(
          "gstThreshold",
          Array.isArray(gstThreshold) ? gstThreshold.join(",") : String(gstThreshold)
        );
      }

      const res = await api.get(`/gst/get-single-gst?${params.toString()}`);
      return res.data;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to fetch GST data";
      return rejectWithValue(message);
    }
  }
);

export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (bookingPayload, { rejectWithValue }) => {
    try {
      // Use /booking/:userId/:hotelId endpoint
      const { userId, hotelId, ...restPayload } = bookingPayload;
      const res = await api.post(`/booking/${userId}/${hotelId}`, restPayload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed");
    }
  }
);

export const fetchFilteredBooking = createAsyncThunk(
  "booking/fetchFilteredBooking",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const resolvedUserId = filters?.userId || (await getUserId());

      const params = new URLSearchParams();
      Object.entries({ ...filters, userId: resolvedUserId }).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
      });

      const relativeUrl = `/get/all/users-filtered/booking/by?${params.toString()}`;

    

      const res = await api.get(relativeUrl);

    

      const raw = res?.data ?? null;

   

      const { html, ...sanitized } = raw || {};
   

      return sanitized;
    } catch (err) {
     

      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch bookings"
      );
    }
  }
);

export const sendCancellationOTP = createAsyncThunk(
  "booking/sendCancellationOTP",
  async (bookingId, { rejectWithValue }) => {
    try {
      if (!bookingId) {
        return rejectWithValue({ message: "Booking ID is required." });
      }
      const response = await api.post(`/booking/${bookingId}/cancel/send-otp`);
      return response?.data || null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to send OTP" }
      );
    }
  }
);

export const verifyCancellationOTP = createAsyncThunk(
  "booking/verifyCancellationOTP",
  async ({ bookingId, otp, cancellationReason }, { rejectWithValue }) => {
    try {
      if (!bookingId || !otp) {
        return rejectWithValue({ message: "Booking ID and OTP are required." });
      }
      const payload = {
        otp: String(otp).trim(),
        cancellationReason: String(cancellationReason || "Customer requested cancellation").trim(),
      };
      const response = await api.post(`/booking/${bookingId}/cancel/verify`, payload);
      return response?.data || null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to verify OTP" }
      );
    }
  }
);


const initialState = {
  monthlyData: [],
  monthlyLoading: false,
  monthlyError: null,

  gstStatus: "idle",
  gstError: null,
  gstAmount: 0,
  gstData: null,

  bookingStatus: "idle",
  bookingError: null,
  bookingReference: null,
  createdBookingStatus: null,
  createdBookingPendingReason: null,

  couponStatus: "idle",
  couponError: null,
  discountAmount: 0,
  appliedCoupon: null,
  couponResult: null,

  filteredBookingsStatus: "idle",
  filteredBookingsError: null,
  filteredBookings: null,

  sendOtpStatus: "idle",
  sendOtpError: null,
  sendOtpData: null,

  verifyOtpStatus: "idle",
  verifyOtpError: null,
  verifyOtpData: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    resetBookingState(state) {
      state.bookingStatus = "idle";
      state.bookingError = null;
      state.bookingReference = null;
      state.createdBookingStatus = null;
      state.createdBookingPendingReason = null;
    },
    resetCoupon(state) {
      state.couponStatus = "idle";
      state.couponError = null;
      state.discountAmount = 0;
      state.appliedCoupon = null;
      state.couponResult = null;
    },
    resetFilteredBookings(state) {
      state.filteredBookingsStatus = "idle";
      state.filteredBookingsError = null;
      state.filteredBookings = null;
    },
    resetCancellationOtpState(state) {
      state.sendOtpStatus = "idle";
      state.sendOtpError = null;
      state.sendOtpData = null;
      state.verifyOtpStatus = "idle";
      state.verifyOtpError = null;
      state.verifyOtpData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyData.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
      })
      .addCase(fetchMonthlyData.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        const payloadData = action.payload?.data || action.payload;
        state.monthlyData = Array.isArray(payloadData) ? payloadData : [];
      })
      .addCase(fetchMonthlyData.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlyError = action.payload || "Failed";
      })

      .addCase(createBooking.pending, (state) => {
        state.bookingStatus = "loading";
        state.bookingError = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.bookingStatus = "succeeded";
        const payload = action.payload?.data || action.payload;
        state.bookingReference = payload?.bookingId || null;
        state.createdBookingStatus = payload?.bookingStatus || null;
        state.createdBookingPendingReason = payload?.pendingReason || null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.bookingStatus = "failed";
        state.bookingError = action.payload || "Failed";
      })

      .addCase(applyCouponCode.pending, (state) => {
        state.couponStatus = "loading";
        state.couponError = null;
      })
      .addCase(applyCouponCode.fulfilled, (state, action) => {
        state.couponStatus = "succeeded";

        const originalPrice = parseNumber(action.payload?.originalPrice);
        const finalPrice = parseNumber(action.payload?.finalPrice);

        // User coupon: { coupon: { discountPrice } } | Partner coupon: { data: [{ discountPrice }] } | top-level discountPrice
        const explicitDiscount =
          parseNumber(action.payload?.discountPrice) ||
          parseNumber(action.payload?.discountAmount) ||
          parseNumber(action.payload?.coupon?.discountPrice) ||
          parseNumber(action.payload?.coupon?.discountAmount) ||
          parseNumber(action.payload?.data?.[0]?.discountPrice);

        const derivedDiscount =
          originalPrice > 0 && finalPrice >= 0 && originalPrice >= finalPrice
            ? originalPrice - finalPrice
            : 0;

        state.discountAmount = explicitDiscount || derivedDiscount || 0;
        state.appliedCoupon = action.meta.arg?.couponCode || action.meta.arg?.code || null;
        state.couponResult = action.payload || null;
      })
      .addCase(applyCouponCode.rejected, (state, action) => {
        state.couponStatus = "failed";
        state.couponError = action.payload || "Failed";
        state.discountAmount = 0;
        state.appliedCoupon = null;
        state.couponResult = null;
      })

      .addCase(getGstForHotelData.pending, (state) => {
        state.gstStatus = "loading";
        state.gstError = null;
      })
      .addCase(getGstForHotelData.fulfilled, (state, action) => {
        state.gstStatus = "succeeded";
        state.gstData = action.payload?.data || action.payload || null;
        state.gstAmount = action.payload?.gstAmount || action.payload?.data?.gstAmount || 0;
      })
      .addCase(getGstForHotelData.rejected, (state, action) => {
        state.gstStatus = "failed";
        state.gstError = action.payload || "Failed";
        state.gstAmount = 0;
      })

      .addCase(fetchFilteredBooking.pending, (state) => {
        state.filteredBookingsStatus = "loading";
        state.filteredBookingsError = null;
      })
      .addCase(fetchFilteredBooking.fulfilled, (state, action) => {
        state.filteredBookingsStatus = "succeeded";
        state.filteredBookings = action.payload || null;
      })
      .addCase(fetchFilteredBooking.rejected, (state, action) => {
        state.filteredBookingsStatus = "failed";
        state.filteredBookingsError = action.payload || "Failed to fetch bookings";
      })

      .addCase(sendCancellationOTP.pending, (state) => {
        state.sendOtpStatus = "loading";
        state.sendOtpError = null;
      })
      .addCase(sendCancellationOTP.fulfilled, (state, action) => {
        state.sendOtpStatus = "succeeded";
        state.sendOtpData = action.payload || null;
      })
      .addCase(sendCancellationOTP.rejected, (state, action) => {
        state.sendOtpStatus = "failed";
        state.sendOtpError = action.payload || { message: "Failed to send OTP" };
      })

      .addCase(verifyCancellationOTP.pending, (state) => {
        state.verifyOtpStatus = "loading";
        state.verifyOtpError = null;
      })
      .addCase(verifyCancellationOTP.fulfilled, (state, action) => {
        state.verifyOtpStatus = "succeeded";
        state.verifyOtpData = action.payload || null;
      })
      .addCase(verifyCancellationOTP.rejected, (state, action) => {
        state.verifyOtpStatus = "failed";
        state.verifyOtpError = action.payload || { message: "Failed to verify OTP" };
      });
  },
});

export const { resetBookingState, resetCoupon, resetFilteredBookings, resetCancellationOtpState } = bookingSlice.actions;
export default bookingSlice.reducer;
