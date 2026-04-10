import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/api";
import { getUserId } from "../../utils/credentials";

const normalizeTourResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const fetchTourList = createAsyncThunk(
  "tour/fetchTourList",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = {};
      if (params?.page) query.page = params.page;
      if (params?.limit) query.limit = params.limit;
      if (params?.sortBy) query.sortBy = params.sortBy;
      if (params?.sortOrder) query.sortOrder = params.sortOrder;
      const response = await api.get("/get-all-tours", { params: query });
      return {
        items: normalizeTourResponse(response?.data),
        pagination: response?.data?.pagination || null,
        message: response?.data?.message || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch tour list" }
      );
    }
  }
);

export const filterToursByQuery = createAsyncThunk(
  "tour/filterToursByQuery",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/filter-tour/by-query", { params });
      const items = normalizeTourResponse(response?.data);
      return {
        items,
        pagination: response?.data?.pagination || null,
        message: response?.data?.message || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to filter tours" }
      );
    }
  }
);

export const fetchTourById = createAsyncThunk(
  "tour/fetchTourById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/get-tour/${id}`);
      return response?.data?.data || response?.data || null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch tour details" }
      );
    }
  }
);

export const tourBooking = createAsyncThunk(
  "tour/tourBooking",
  async (payload = {}, { rejectWithValue }) => {
    try {
      const resolvedUserId = payload?.userId || (await getUserId());
      const tourId = payload?.tourId || payload?.id;
      const vehicleId = payload?.vehicleId;

      if (!resolvedUserId) {
        return rejectWithValue({ message: "Please login to continue booking." });
      }
      if (!tourId) {
        return rejectWithValue({ message: "Tour ID is required for booking." });
      }
      if (!vehicleId) {
        return rejectWithValue({ message: "Vehicle ID is required for booking." });
      }

      const {
        userId,
        id,
        tourId: removedTourId,
        seats = [],
        numberOfAdults = 0,
        numberOfChildren = 0,
        passengers = [],
        from,
        to,
        tourStartDate,
        payment,
        tax = 0,
        discount = 0,
        bookingSource = "app",
      } = payload;

      const bookingPayload = {
        userId: resolvedUserId,
        tourId,
        vehicleId,
        bookingSource,
        seats,
        numberOfAdults,
        numberOfChildren,
        passengers,
        from,
        to,
        tourStartDate,
        payment,
        tax,
        discount,
      };

      const response = await api.post("/tour-booking/create-tour-booking", bookingPayload);
      return {
        data: response?.data?.data || response?.data || null,
        message: response?.data?.message || "Booking created successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to create tour booking" }
      );
    }
  }
);

export const fetchUserTourBookings = createAsyncThunk(
  "tour/fetchUserTourBookings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const resolvedUserId = params?.userId || (await getUserId());
      if (!resolvedUserId) {
        return rejectWithValue({ message: "Please login to view tour bookings." });
      }

      const { userId, ...rest } = params;
      const response = await api.get("/tour-booking/get-users-booking", {
        params: {
          userId: resolvedUserId,
          ...rest,
        },
      });

      const payload = response?.data?.data || response?.data || [];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch tour bookings" }
      );
    }
  }
);

export const fetchVehicleSeats = createAsyncThunk(
  "tour/fetchVehicleSeats",
  async ({ tourId, vehicleId } = {}, { rejectWithValue }) => {
    try {
      const tid = String(tourId || "").trim();
      const vid = String(vehicleId || "").trim();
      if (!tid || !vid) return rejectWithValue({ message: "Tour ID and Vehicle ID are required." });
      const response = await api.get(`/tours/${tid}/vehicles/${vid}/seats`);
      return {
        tourId: tid,
        vehicleId: vid,
        vehicle: response?.data?.vehicle || response?.data || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch vehicle seats" }
      );
    }
  }
);

const tourSlice = createSlice({
  name: "tour",
  initialState: {
    items: [],
    pagination: null,
    status: "idle",
    error: null,
    message: null,
    selectedTour: null,
    selectedTourStatus: "idle",
    selectedTourError: null,
    tourBookingStatus: "idle",
    tourBookingError: null,
    tourBookingReference: null,
    tourBookingResponse: null,
    userTourBookings: [],
    userTourBookingsStatus: "idle",
    userTourBookingsError: null,
    vehicleSeats: null,
    vehicleSeatsStatus: "idle",
    vehicleSeatsError: null,
  },
  reducers: {
    resetTourState: (state) => {
      state.items = [];
      state.pagination = null;
      state.status = "idle";
      state.error = null;
      state.message = null;
      state.selectedTour = null;
      state.selectedTourStatus = "idle";
      state.selectedTourError = null;
      state.tourBookingStatus = "idle";
      state.tourBookingError = null;
      state.tourBookingReference = null;
      state.tourBookingResponse = null;
      state.userTourBookings = [];
      state.userTourBookingsStatus = "idle";
      state.userTourBookingsError = null;
      state.vehicleSeats = null;
      state.vehicleSeatsStatus = "idle";
      state.vehicleSeatsError = null;
    },
    resetVehicleSeats: (state) => {
      state.vehicleSeats = null;
      state.vehicleSeatsStatus = "idle";
      state.vehicleSeatsError = null;
    },
    resetSelectedTour: (state) => {
      state.selectedTour = null;
      state.selectedTourStatus = "idle";
      state.selectedTourError = null;
    },
    resetTourBookingState: (state) => {
      state.tourBookingStatus = "idle";
      state.tourBookingError = null;
      state.tourBookingReference = null;
      state.tourBookingResponse = null;
    },
    resetUserTourBookings: (state) => {
      state.userTourBookings = [];
      state.userTourBookingsStatus = "idle";
      state.userTourBookingsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTourList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTourList.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
        state.pagination = action.payload?.pagination || null;
        state.message = action.payload?.message || null;
      })
      .addCase(fetchTourList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || { message: "Failed to fetch tours" };
        state.items = [];
      })
      .addCase(filterToursByQuery.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(filterToursByQuery.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
        state.pagination = action.payload?.pagination || null;
        state.message = action.payload?.message || null;
      })
      .addCase(filterToursByQuery.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || { message: "Failed to filter tours" };
        state.items = [];
      })
      .addCase(fetchTourById.pending, (state) => {
        state.selectedTourStatus = "loading";
        state.selectedTourError = null;
      })
      .addCase(fetchTourById.fulfilled, (state, action) => {
        state.selectedTourStatus = "succeeded";
        state.selectedTour = action.payload || null;
      })
      .addCase(fetchTourById.rejected, (state, action) => {
        state.selectedTourStatus = "failed";
        state.selectedTourError = action.payload || { message: "Failed to load tour details" };
        state.selectedTour = null;
      })
      .addCase(tourBooking.pending, (state) => {
        state.tourBookingStatus = "loading";
        state.tourBookingError = null;
      })
      .addCase(tourBooking.fulfilled, (state, action) => {
        state.tourBookingStatus = "succeeded";
        state.tourBookingResponse = action.payload || null;
        state.tourBookingReference =
          action.payload?.data?.bookingCode ||
          action.payload?.data?.bookingId ||
          action.payload?.data?._id ||
          null;
      })
      .addCase(tourBooking.rejected, (state, action) => {
        state.tourBookingStatus = "failed";
        state.tourBookingError = action.payload || { message: "Failed to create tour booking" };
      })
      .addCase(fetchUserTourBookings.pending, (state) => {
        state.userTourBookingsStatus = "loading";
        state.userTourBookingsError = null;
      })
      .addCase(fetchUserTourBookings.fulfilled, (state, action) => {
        state.userTourBookingsStatus = "succeeded";
        state.userTourBookings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserTourBookings.rejected, (state, action) => {
        state.userTourBookingsStatus = "failed";
        state.userTourBookingsError =
          action.payload || { message: "Failed to fetch user tour bookings" };
      })
      .addCase(fetchVehicleSeats.pending, (state) => {
        state.vehicleSeatsStatus = "loading";
        state.vehicleSeatsError = null;
      })
      .addCase(fetchVehicleSeats.fulfilled, (state, action) => {
        state.vehicleSeatsStatus = "succeeded";
        state.vehicleSeats = action.payload?.vehicle || null;
      })
      .addCase(fetchVehicleSeats.rejected, (state, action) => {
        state.vehicleSeatsStatus = "failed";
        state.vehicleSeatsError = action.payload || { message: "Failed to fetch vehicle seats" };
        state.vehicleSeats = null;
      });
  },
});

export const {
  resetTourState,
  resetSelectedTour,
  resetTourBookingState,
  resetUserTourBookings,
  resetVehicleSeats,
} = tourSlice.actions;
export default tourSlice.reducer;
