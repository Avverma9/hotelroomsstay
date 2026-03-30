import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../src/api";

export const checkSingleHotelAvailability = createAsyncThunk(
    "availability/checkSingleHotelAvailability",
    async ({ hotelId, fromDate, toDate }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/check/hotels/room-availability?hotelId=${hotelId}&fromDate=${fromDate}&toDate=${toDate}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);
export const checkMultipleHotelsAvailability = createAsyncThunk(
    "availability/checkMultipleHotelsAvailability",
    async ({ city, fromDate, toDate }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/check/all-hotels/room-availability?city=${city}&fromDate=${fromDate}&toDate=${toDate}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const availabilitySlice = createSlice({
    name: "availability",
    initialState: {
        singleHotel: {
            loading: false,
            error: null,    
            data: null,
        },
        multipleHotels: {
            loading: false,
            error: null,    
            data: [],   
        },
    },
    reducers: {
        clearSingleHotelAvailability: (state) => {
            state.singleHotel = { loading: false, error: null, data: null };
        },
        clearMultipleHotelsAvailability: (state) => {
            state.multipleHotels = { loading: false, error: null, data: [] };   
        },
    },
    extraReducers: (builder) => {
        builder
            // ── checkSingleHotelAvailability ──────────────────────────────
            .addCase(checkSingleHotelAvailability.pending, (state) => { 
                state.singleHotel.loading = true;
                state.singleHotel.error = null;
            })
            .addCase(checkSingleHotelAvailability.fulfilled, (state, action) => {
                state.singleHotel.loading = false;
                state.singleHotel.data = action.payload;
            })
            .addCase(checkSingleHotelAvailability.rejected, (state, action) => {
                state.singleHotel.loading = false;
                state.singleHotel.error = action.payload;
            })
            // ── checkMultipleHotelsAvailability ──────────────────────────────
            .addCase(checkMultipleHotelsAvailability.pending, (state) => {
                state.multipleHotels.loading = true;
                state.multipleHotels.error = null;
            })
            .addCase(checkMultipleHotelsAvailability.fulfilled, (state, action) => {
                state.multipleHotels.loading = false;
                state.multipleHotels.data = action.payload;
            })
            .addCase(checkMultipleHotelsAvailability.rejected, (state, action) => {
                state.multipleHotels.loading = false;
                state.multipleHotels.error = action.payload;
            })
        },
});

export const { clearSingleHotelAvailability, clearMultipleHotelsAvailability } = availabilitySlice.actions;
export default availabilitySlice.reducer;