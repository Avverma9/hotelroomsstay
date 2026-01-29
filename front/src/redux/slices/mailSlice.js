import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiInterceptor';

// Define the async thunk
export const sendBookingMail = createAsyncThunk('mail/sendBookingMail', async (payload, { rejectWithValue }) => {
    try {
        const response = await apiClient.post('/mail/send-booking-mail', payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const sendMessage = createAsyncThunk('mail/sendMessage', async (payload, { rejectWithValue }) => {
    try {
        const response = await apiClient.post('/mail/send-message', payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// Create the slice
const mailSlice = createSlice({
    name: 'mail',
    initialState: {
        data: [],
        loading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
        // .addCase(fetchLocation.pending, (state) => {
        //     state.loading = true;
        //     state.error = null;
        // })

    },
});

export default mailSlice.reducer;
