import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiInterceptor';

// Async thunk to fetch offered hotels
export const fetchOfferedHotels = createAsyncThunk(
  'hotel/fetchOfferedHotels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/get/offers/main/hotels');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch offered hotels');
    }
  }
);

const hotelSlice = createSlice({
  name: 'hotel',
  initialState: {
    offeredHotels: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearHotelError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Offered Hotels
      .addCase(fetchOfferedHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOfferedHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.offeredHotels = Array.isArray(action.payload) ? action.payload.slice(0, 12) : [];
      })
      .addCase(fetchOfferedHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.offeredHotels = [];
      });
  },
});

export const { clearHotelError } = hotelSlice.actions;
export default hotelSlice.reducer;
