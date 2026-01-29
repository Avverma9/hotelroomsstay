import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiInterceptor';

// Async thunk to fetch GST data using query params (GET)
export const getGst = createAsyncThunk(
  'gst/getGst',
  async ({ type, gstThreshold }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (gstThreshold !== undefined && gstThreshold !== null) {
        params.append('gstThreshold', gstThreshold);
      }

      const endpoint = `/gst/get-single-gst?${params.toString()}`;
      const response = await apiClient.get(endpoint);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching GST:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch GST data');
    }
  }
);

const gstSlice = createSlice({
  name: 'gst',
  initialState: {
    gst: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearGstError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGst.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGst.fulfilled, (state, action) => {
        state.loading = false;
        state.gst = action.payload;
      })
      .addCase(getGst.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearGstError } = gstSlice.actions;
export default gstSlice.reducer;
