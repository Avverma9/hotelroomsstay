import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@src/api"; // Ensure your axios instance path is correct

/* =========================================================
   HELPERS & ERROR HANDLING
========================================================= */
// Robust error extractor that won't crash if response is malformed
const extractError = (err) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "An unexpected error occurred"
  );
};

// Reusable extraReducers builder for async thunks to keep code DRY and safe
const asyncHandlers = (builder, thunk, onFulfilled) => {
  builder
    .addCase(thunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      onFulfilled(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Request failed";
    });
};

/* =========================================================
   TOUR THUNKS
========================================================= */

// POST /create-tour (multipart — has image upload)
export const addTour = createAsyncThunk(
  "tour/addTour",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/create-tour`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /filter-tour/by-query (Advanced Search & Filter)
export const fetchFilteredTours = createAsyncThunk(
  "tour/fetchFilteredTours",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/filter-tour/by-query`, { params });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /get-tour/:id
export const getTourById = createAsyncThunk(
  "tour/getTourById",
  async (tourId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/get-tour/${tourId}`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// PATCH /update-tour/data/:id
export const updateTour = createAsyncThunk(
  "tour/updateTour",
  async ({ tourId, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/update-tour/data/${tourId}`, updatedData);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// PATCH /update-tour-image/:id (multipart)
export const changeTourImage = createAsyncThunk(
  "tour/changeTourImage",
  async ({ tourId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/update-tour-image/${tourId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// DELETE /delete-tour-image/:id
export const deleteTourImage = createAsyncThunk(
  "tour/deleteTourImage",
  async ({ tourId, index }, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/delete-tour-image/${tourId}`, {
        data: { index }, // axios: body in DELETE goes here
      });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /get-all-tours (Admin — all tours list)
export const getAllTours = createAsyncThunk(
  "tour/getAllTours",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/get-all-tours`, { params });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /get-requests (admin — pending approval)
export const getRequestedTours = createAsyncThunk(
  "tour/getRequestedTours",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/get-requests`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /get-tour/by-owner/query?email=xxx
export const getTourByOwner = createAsyncThunk(
  "tour/getTourByOwner",
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/get-tour/by-owner/query`, {
        params: { email },
      });
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /tours/:tourId/vehicles/:vehicleId/seats
export const getVehicleSeats = createAsyncThunk(
  "tour/getVehicleSeats",
  async ({ tourId, vehicleId }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tours/${tourId}/vehicles/${vehicleId}/seats`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

// GET /tours/visiting-places
export const getAllVisitingPlaces = createAsyncThunk(
  "tour/getAllVisitingPlaces",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tours/visiting-places`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

/* =========================================================
   BOOKING THUNKS
========================================================= */

export const createBooking = createAsyncThunk(
  "tour/createBooking",
  async (bookingData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/tour-booking/create-tour-booking`, bookingData);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const getBookings = createAsyncThunk(
  "tour/getBookings",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tour-booking/get-bookings`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const getBookingsByAgencyEmail = createAsyncThunk(
  "tour/getBookingsByAgencyEmail",
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tour-booking/get-bookings/by-agency-email/${email}`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const getBookingByUser = createAsyncThunk(
  "tour/getBookingByUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tour-booking/get-users-booking`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const getBookingsByBookingId = createAsyncThunk(
  "tour/getBookingsByBookingId",
  async (bookingId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tour-booking/get-users-booking/by/${bookingId}`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const getTotalSell = createAsyncThunk(
  "tour/getTotalSell",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tour-booking/get-total-sell`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateBooking = createAsyncThunk(
  "tour/updateBooking",
  async ({ bookingId, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/tour-booking/update-tour-booking/${bookingId}`, updatedData);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteBooking = createAsyncThunk(
  "tour/deleteBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/tour-booking/delete-tour-booking/${bookingId}`);
      return data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

/* =========================================================
   SLICE & REDUCERS
========================================================= */

const initialState = {
  // ── tour state ──
  tours: [],
  allTours: [],
  tourDetails: null,
  requestedTours: [],
  ownerTours: [],
  visitingPlaces: [],
  vehicleSeats: null,
  filterMeta: null, 

  // ── booking state ──
  bookings: [],
  userBookings: [],
  bookingDetails: null,
  agencyBookings: [],
  totalSell: null,

  // ── ui state ──
  loading: false,
  error: null,
};

const tourSlice = createSlice({
  name: "tour",
  initialState,
  reducers: {
    clearTourDetails: (state) => { state.tourDetails = null; },
    clearError:       (state) => { state.error = null; },
  },

  extraReducers: (builder) => {
    
    // addTour
    asyncHandlers(builder, addTour, (state, action) => {
      const newTour = action.payload?.data || action.payload;
      if (newTour) state.tours.unshift(newTour);
    });

    // fetchFilteredTours (Bulletproofed)
    asyncHandlers(builder, fetchFilteredTours, (state, action) => {
      state.tours = action.payload?.data || action.payload?.tours || [];
      state.filterMeta = action.payload?.pagination || action.payload?.meta || null;
    });

    // getTourById
    asyncHandlers(builder, getTourById, (state, action) => {
      state.tourDetails = action.payload?.data || action.payload || null;
    });

    // updateTour
    asyncHandlers(builder, updateTour, (state, action) => {
      const updated = action.payload?.data || action.payload;
      if (!updated || !updated._id) return;
      
      const idx = state.tours.findIndex((t) => t._id === updated._id);
      if (idx !== -1) state.tours[idx] = updated;
      if (state.tourDetails?._id === updated._id) state.tourDetails = updated;
    });

    // changeTourImage
    asyncHandlers(builder, changeTourImage, (state, action) => {
      const updated = action.payload?.data || action.payload;
      if (!updated || !updated._id) return;

      const idx = state.tours.findIndex((t) => t._id === updated._id);
      if (idx !== -1) state.tours[idx] = updated;
      if (state.tourDetails?._id === updated._id) state.tourDetails = updated;
    });

    // deleteTourImage
    asyncHandlers(builder, deleteTourImage, (state, action) => {
      if (state.tourDetails && action.payload?.remaining) {
        state.tourDetails.images = action.payload.remaining;
      }
    });

    // getAllTours
    asyncHandlers(builder, getAllTours, (state, action) => {
      state.allTours = action.payload?.data || action.payload?.tours || action.payload || [];
      state.filterMeta = action.payload?.pagination || action.payload?.meta || null;
    });

    // getRequestedTours
    asyncHandlers(builder, getRequestedTours, (state, action) => {
      state.requestedTours = action.payload?.data || action.payload || [];
    });

    // getTourByOwner
    asyncHandlers(builder, getTourByOwner, (state, action) => {
      state.ownerTours = action.payload?.data || action.payload || [];
    });

    // getVehicleSeats
    asyncHandlers(builder, getVehicleSeats, (state, action) => {
      state.vehicleSeats = action.payload?.data || action.payload || null;
    });

    // getAllVisitingPlaces
    asyncHandlers(builder, getAllVisitingPlaces, (state, action) => {
      state.visitingPlaces = action.payload?.data || action.payload || [];
    });

    // createBooking
    asyncHandlers(builder, createBooking, (state, action) => {
      const newBooking = action.payload?.data || action.payload;
      if (newBooking) state.bookings.unshift(newBooking);
    });

    // getBookings
    asyncHandlers(builder, getBookings, (state, action) => {
      state.bookings = action.payload?.data || action.payload || [];
    });

    // getBookingsByAgencyEmail
    asyncHandlers(builder, getBookingsByAgencyEmail, (state, action) => {
      state.agencyBookings = action.payload?.data || action.payload || [];
    });

    // getBookingByUser
    asyncHandlers(builder, getBookingByUser, (state, action) => {
      state.userBookings = action.payload?.data || action.payload || [];
    });

    // getBookingsByBookingId
    asyncHandlers(builder, getBookingsByBookingId, (state, action) => {
      state.bookingDetails = action.payload?.data || action.payload || null;
    });

    // getTotalSell
    asyncHandlers(builder, getTotalSell, (state, action) => {
      state.totalSell = action.payload?.data || action.payload || null;
    });

    // updateBooking & deleteBooking (soft delete)
    const updateBookingState = (state, action) => {
      const updated = action.payload?.data || action.payload;
      if (!updated || !updated._id) return;
      const idx = state.bookings.findIndex((b) => b._id === updated._id);
      if (idx !== -1) state.bookings[idx] = updated;
    };

    asyncHandlers(builder, updateBooking, updateBookingState);
    asyncHandlers(builder, deleteBooking, updateBookingState);
  },
});

export const { clearTourDetails, clearError } = tourSlice.actions;
export default tourSlice.reducer;