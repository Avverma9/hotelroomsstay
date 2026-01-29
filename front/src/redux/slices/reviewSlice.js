import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiInterceptor';

export const fetchBookingReview = createAsyncThunk('booking/fetchBookingReview', async (hotelId, { rejectWithValue }) => {
    try {
        const response = await apiClient.get(`/getReviews/hotelId?hotelId=${hotelId}`);
        return response?.data;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const reviewSlice = createSlice({
    name: 'review',
    initialState: {
        data: [],
        loading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder

            // Fetch booking review
            .addCase(fetchBookingReview.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookingReview.fulfilled, (state, action) => {
                state.data = action.payload;
                state.loading = false;
            })
            .addCase(fetchBookingReview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                console.error(`Failed to fetch booking Review: ${action.payload || 'Unknown error'}`);
            });
    },
});

export default reviewSlice.reducer;
