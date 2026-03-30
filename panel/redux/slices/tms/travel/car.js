import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../../src/api";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const addCar = createAsyncThunk(
  "car/addCar",
  async (carData, { rejectWithValue }) => {
    try {
      const response = await api.post("/travel/add-a-car", carData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add car.");
    }
  }
);

export const getCarById = createAsyncThunk(
  "car/getCarById",
  async (carId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-a-car/${carId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch car details.");
    }
  }
);

export const getCarByOwnerId = createAsyncThunk(
  "car/getCarByOwnerId",
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-a-car/by-owner/${ownerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch cars for owner.");
    }
  }
);

export const getAllCars = createAsyncThunk(
  "car/getAllCars",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/travel/get-all-car");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch cars.");
    }
  }
);

export const updateCar = createAsyncThunk(
  "car/updateCar",
  async ({ carId, carData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/travel/update-a-car/${carId}`, carData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update car.");
    }
  }
);

export const deleteCarById = createAsyncThunk(
  "car/deleteCarById",
  async (carId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/travel/delete-a-car/${carId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete car.");
    }
  }
);

export const filterCar = createAsyncThunk(
  "car/filterCar",
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get("/travel/filter-car/by-query", { params: queryParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to filter cars.");
    }
  }
);

export const getSeatsData = createAsyncThunk(
  "car/getSeatsData",
  async (carId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-seat-data/by-id/${carId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch seat data.");
    }
  }
);
// router.post("/create-travel/booking", bookCar);
// router.patch("/change-booking-status/:id",changeBookingStatus)
// router.get('/get-travels-bookings', getTravelBookings)
// router.patch('/update-travel/booking',updateBooking)
// router.get("/get-bookings-by/owner/:ownerId",getBookingsOfOwner)
// router.post("/get-bookings-by/bookedBy",getBookingBookedBy);
// router.get("/get-bookings-by/user/:userId", getCarBookingByUserId);

export const bookCar = createAsyncThunk(
  "car/bookCar",
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post("/travel/create-travel/booking", bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to book car.");
    }
  }
);

export const changeBookingStatus = createAsyncThunk(
  "car/changeBookingStatus",
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/travel/change-booking-status/${bookingId}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to change booking status.");
    }
  }
);

export const getTravelBookings = createAsyncThunk(
  "car/getTravelBookings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/travel/get-travels-bookings");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch travel bookings.");
    }
  }
);

export const updateBooking = createAsyncThunk(
  "car/updateBooking",
  async ({ bookingId, bookingData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/travel/update-travel/booking`, { bookingId, ...bookingData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update booking.");
    }
  }
);

export const getBookingsOfOwner = createAsyncThunk(
  "car/getBookingsOfOwner",
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-bookings-by/owner/${ownerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bookings for owner.");
    }
  }
);

export const getBookingBookedBy = createAsyncThunk(
  "car/getBookingBookedBy",
  async (bookedByData, { rejectWithValue }) => {
    try {
      const response = await api.post("/travel/get-bookings-by/bookedBy", bookedByData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bookings booked by.");
    }
  }
);

export const getCarBookingByUserId = createAsyncThunk(
  "car/getCarBookingByUserId",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-bookings-by/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bookings for user.");
    }
  }
);

export const getAllOwners = createAsyncThunk(
  "car/getAllOwners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/travel/get-all-owner");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch car owners.");
    }
  }
);

export const getOwnerById = createAsyncThunk(
  "car/getOwnerById",
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/travel/get-an-owner/${ownerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch owner details.");
    }
  }
);

export const filterOwners = createAsyncThunk(
  "car/filterOwners",
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get("/travel/owners/filter", { params: queryParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to filter owners.");
    }
  }
);

export const deleteOwnerById = createAsyncThunk(
  "car/deleteOwnerById",
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/travel/delete-an-owner/${ownerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete owner.");
    }
  }
);

export const updateOwner = createAsyncThunk(
  "car/updateOwner",
  async ({ ownerId, ownerData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/travel/update-an-owner/${ownerId}`, ownerData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update owner.");
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  // Car data
  cars: [],
  selectedCar: null,
  ownerCars: [],
  filteredCars: [],
  seatsData: null,

  // Booking data
  bookings: [],
  selectedBooking: null,
  ownerBookings: [],
  userBookings: [],
  bookedByBookings: [],

  // Owner data
  owners: [],
  selectedOwner: null,
  filteredOwners: [],

  // UI state
  loading: false,
  error: null,
  success: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pending = (state) => {
  state.loading = true;
  state.error = null;
  state.success = null;
};

const rejected = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    clearCarError: (state) => {
      state.error = null;
    },
    clearCarSuccess: (state) => {
      state.success = null;
    },
    clearSelectedCar: (state) => {
      state.selectedCar = null;
    },
    clearSelectedBooking: (state) => {
      state.selectedBooking = null;
    },
    clearSelectedOwner: (state) => {
      state.selectedOwner = null;
    },
    clearFilteredCars: (state) => {
      state.filteredCars = [];
    },
    clearFilteredOwners: (state) => {
      state.filteredOwners = [];
    },
  },
  extraReducers: (builder) => {
    builder

      // ── addCar ─────────────────────────────────────────────────────────────
      .addCase(addCar.pending, pending)
      .addCase(addCar.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Car added successfully.";
        const newCar = action.payload?.data || action.payload;
        if (newCar) state.cars.push(newCar);
      })
      .addCase(addCar.rejected, rejected)

      // ── getCarById ─────────────────────────────────────────────────────────
      .addCase(getCarById.pending, pending)
      .addCase(getCarById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCar = action.payload?.data || action.payload;
      })
      .addCase(getCarById.rejected, rejected)

      // ── getCarByOwnerId ────────────────────────────────────────────────────
      .addCase(getCarByOwnerId.pending, pending)
      .addCase(getCarByOwnerId.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerCars = action.payload?.data || action.payload || [];
      })
      .addCase(getCarByOwnerId.rejected, rejected)

      // ── getAllCars ─────────────────────────────────────────────────────────
      .addCase(getAllCars.pending, pending)
      .addCase(getAllCars.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload?.data || action.payload || [];
      })
      .addCase(getAllCars.rejected, rejected)

      // ── updateCar ─────────────────────────────────────────────────────────
      .addCase(updateCar.pending, pending)
      .addCase(updateCar.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Car updated successfully.";
        const updated = action.payload?.data || action.payload;
        const index = state.cars.findIndex((c) => c._id === updated?._id);
        if (index !== -1) state.cars[index] = updated;
        if (state.selectedCar?._id === updated?._id) state.selectedCar = updated;
      })
      .addCase(updateCar.rejected, rejected)

      // ── deleteCarById ──────────────────────────────────────────────────────
      .addCase(deleteCarById.pending, pending)
      .addCase(deleteCarById.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Car deleted successfully.";
        const deletedId = action.payload?.data?._id || action.meta?.arg;
        state.cars = state.cars.filter((c) => c._id !== deletedId);
        if (state.selectedCar?._id === deletedId) state.selectedCar = null;
      })
      .addCase(deleteCarById.rejected, rejected)

      // ── filterCar ─────────────────────────────────────────────────────────
      .addCase(filterCar.pending, pending)
      .addCase(filterCar.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredCars = action.payload?.data || action.payload || [];
      })
      .addCase(filterCar.rejected, rejected)

      // ── getSeatsData ───────────────────────────────────────────────────────
      .addCase(getSeatsData.pending, pending)
      .addCase(getSeatsData.fulfilled, (state, action) => {
        state.loading = false;
        state.seatsData = action.payload?.data || action.payload;
      })
      .addCase(getSeatsData.rejected, rejected)

      // ── bookCar ────────────────────────────────────────────────────────────
      .addCase(bookCar.pending, pending)
      .addCase(bookCar.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Car booked successfully.";
        const newBooking = action.payload?.data || action.payload;
        if (newBooking) state.bookings.push(newBooking);
      })
      .addCase(bookCar.rejected, rejected)

      // ── changeBookingStatus ────────────────────────────────────────────────
      .addCase(changeBookingStatus.pending, pending)
      .addCase(changeBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Booking status updated.";
        const updated = action.payload?.data || action.payload;
        const index = state.bookings.findIndex((b) => b._id === updated?._id);
        if (index !== -1) state.bookings[index] = updated;
        if (state.selectedBooking?._id === updated?._id) state.selectedBooking = updated;
      })
      .addCase(changeBookingStatus.rejected, rejected)

      // ── getTravelBookings ──────────────────────────────────────────────────
      .addCase(getTravelBookings.pending, pending)
      .addCase(getTravelBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload?.data || action.payload || [];
      })
      .addCase(getTravelBookings.rejected, rejected)

      // ── updateBooking ──────────────────────────────────────────────────────
      .addCase(updateBooking.pending, pending)
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Booking updated successfully.";
        const updated = action.payload?.data || action.payload;
        const index = state.bookings.findIndex((b) => b._id === updated?._id);
        if (index !== -1) state.bookings[index] = updated;
        if (state.selectedBooking?._id === updated?._id) state.selectedBooking = updated;
      })
      .addCase(updateBooking.rejected, rejected)

      // ── getBookingsOfOwner ─────────────────────────────────────────────────
      .addCase(getBookingsOfOwner.pending, pending)
      .addCase(getBookingsOfOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerBookings = action.payload?.data || action.payload || [];
      })
      .addCase(getBookingsOfOwner.rejected, rejected)

      // ── getBookingBookedBy ─────────────────────────────────────────────────
      .addCase(getBookingBookedBy.pending, pending)
      .addCase(getBookingBookedBy.fulfilled, (state, action) => {
        state.loading = false;
        state.bookedByBookings = action.payload?.data || action.payload || [];
      })
      .addCase(getBookingBookedBy.rejected, rejected)

      // ── getCarBookingByUserId ──────────────────────────────────────────────
      .addCase(getCarBookingByUserId.pending, pending)
      .addCase(getCarBookingByUserId.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload?.data || action.payload || [];
      })
      .addCase(getCarBookingByUserId.rejected, rejected)

      // ── getAllOwners ───────────────────────────────────────────────────────
      .addCase(getAllOwners.pending, pending)
      .addCase(getAllOwners.fulfilled, (state, action) => {
        state.loading = false;
        state.owners = action.payload?.data || action.payload || [];
      })
      .addCase(getAllOwners.rejected, rejected)

      // ── getOwnerById ───────────────────────────────────────────────────────
      .addCase(getOwnerById.pending, pending)
      .addCase(getOwnerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOwner = action.payload?.data || action.payload;
      })
      .addCase(getOwnerById.rejected, rejected)

      // ── filterOwners ───────────────────────────────────────────────────────
      .addCase(filterOwners.pending, pending)
      .addCase(filterOwners.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredOwners = action.payload?.data || action.payload || [];
      })
      .addCase(filterOwners.rejected, rejected)

      // ── deleteOwnerById ────────────────────────────────────────────────────
      .addCase(deleteOwnerById.pending, pending)
      .addCase(deleteOwnerById.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Owner deleted successfully.";
        const deletedId = action.payload?.data?._id || action.meta?.arg;
        state.owners = state.owners.filter((o) => o._id !== deletedId);
        if (state.selectedOwner?._id === deletedId) state.selectedOwner = null;
      })
      .addCase(deleteOwnerById.rejected, rejected)

      // ── updateOwner ────────────────────────────────────────────────────────
      .addCase(updateOwner.pending, pending)
      .addCase(updateOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || "Owner updated successfully.";
        const updated = action.payload?.data || action.payload;
        const index = state.owners.findIndex((o) => o._id === updated?._id);
        if (index !== -1) state.owners[index] = updated;
        if (state.selectedOwner?._id === updated?._id) state.selectedOwner = updated;
      })
      .addCase(updateOwner.rejected, rejected);
  },
});

export const {
  clearCarError,
  clearCarSuccess,
  clearSelectedCar,
  clearSelectedBooking,
  clearSelectedOwner,
  clearFilteredCars,
  clearFilteredOwners,
} = carSlice.actions;

export default carSlice.reducer;
