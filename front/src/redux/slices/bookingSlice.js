import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiInterceptor';

const normalizeResponse = (response) => response?.data?.data ?? response?.data ?? response;

export const fetchMonthlyData = createAsyncThunk(
  'booking/fetchMonthlyData',
  async (hotelId, { rejectWithValue }) => {
    if (!hotelId) {
      return rejectWithValue('Hotel id is required');
    }
    try {
      const response = await apiClient.get(`/monthly-set-room-price/get/by/${hotelId}`);
      return normalizeResponse(response);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch monthly price data';
      return rejectWithValue(message);
    }
  }
);

export const fetchBookingData = createAsyncThunk(
  'booking/fetchBookingData',
  async (hotelId, { rejectWithValue }) => {
    if (!hotelId) {
      return rejectWithValue('Hotel id is required');
    }
    try {
      const response = await apiClient.get(`/hotels/get-by-id/${hotelId}`);
      return normalizeResponse(response);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch booking data';
      return rejectWithValue(message);
    }
  }
);

export const applyCouponCode = createAsyncThunk(
  'booking/applyCouponCode',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('/user-coupon/apply/a/coupon-to-room/user', payload);
      const parsed = normalizeResponse(response);
      toast.success(parsed?.message || 'Coupon applied successfully');
      return parsed;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to apply coupon';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getGstForHotelData = createAsyncThunk(
  'booking/getGstForHotelData',
  async ({ type = 'Hotel', gstThreshold }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (gstThreshold !== undefined && gstThreshold !== null) {
        const thresholdValue = Array.isArray(gstThreshold)
          ? gstThreshold.join(',')
          : gstThreshold;
        params.append('gstThreshold', thresholdValue);
      }

      const response = await apiClient.get(`/gst/get-single-gst?${params.toString()}`);
      return normalizeResponse(response);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to fetch GST data';
      return rejectWithValue(message);
    }
  }
);

export const fetchFilteredBooking = createAsyncThunk(
  'booking/fetchFilteredBooking',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await apiClient.get(`/get/all/users-filtered/booking/by?${params.toString()}`);
      // The backend returns an envelope: { success, data, html, pagination }
      // For bookings we want the full envelope (so caller can use html + pagination),
      // don't normalize to only response.data.data here.
      return response?.data ?? response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch bookings';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  monthlyData: null,
  bookingData: null,
  filteredBookings: null,
  coupon: null,
  gstQuote: null,
  loading: false,
  couponLoading: false,
  gstLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    resetCouponState: (state) => {
      state.coupon = null;
      state.couponLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyData.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyData = action.payload;
      })
      .addCase(fetchMonthlyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBookingData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingData.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingData = action.payload;
      })
      .addCase(fetchBookingData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(applyCouponCode.pending, (state) => {
        state.couponLoading = true;
        state.error = null;
      })
      .addCase(applyCouponCode.fulfilled, (state, action) => {
        state.couponLoading = false;
        state.coupon = action.payload;
      })
      .addCase(applyCouponCode.rejected, (state, action) => {
        state.couponLoading = false;
        state.error = action.payload;
      })
      .addCase(getGstForHotelData.pending, (state) => {
        state.gstLoading = true;
        state.error = null;
      })
      .addCase(getGstForHotelData.fulfilled, (state, action) => {
        state.gstLoading = false;
        state.gstQuote = action.payload;
      })
      .addCase(getGstForHotelData.rejected, (state, action) => {
        state.gstLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchFilteredBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredBookings = action.payload;
      })
      .addCase(fetchFilteredBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingError, resetCouponState } = bookingSlice.actions;
export default bookingSlice.reducer;
