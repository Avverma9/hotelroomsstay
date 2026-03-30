import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../src/api";

// ─── 1. Set Monthly Price ─────────────────────────────────────────────────────
export const setMonthlyPrice = createAsyncThunk(
  "monthly/setMonthlyPrice",
  async ({ hotelId, roomId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/monthly-set-room-price/${hotelId}/${roomId}`,
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ─── 2. Get Monthly Prices by Hotel ──────────────────────────────────────────
export const getMonthlyPricesByHotel = createAsyncThunk(
  "monthly/getMonthlyPricesByHotel",
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/monthly-set-room-price/get/by/${hotelId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ─── 3. Update Monthly Price by Entry ID ─────────────────────────────────────
export const updateMonthlyPrice = createAsyncThunk(
  "monthly/updateMonthlyPrice",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/monthly-set-room-price/update/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ─── 4. Delete Single Monthly Price Entry ────────────────────────────────────
export const deleteMonthlyPrice = createAsyncThunk(
  "monthly/deleteMonthlyPrice",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/monthly-set-room-price/delete/by-id/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ─── 5. Delete All Monthly Prices for a Hotel ────────────────────────────────
export const deleteAllMonthlyPricesByHotel = createAsyncThunk(
  "monthly/deleteAllMonthlyPricesByHotel",
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/monthly-set-room-price/delete/price/by/${hotelId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const monthlySlice = createSlice({
  name: "monthly",
  initialState: {
    prices: [],          // list of price entries for current hotel
    loading: false,
    saving: false,       // separate loader for create/update
    error: null,
    success: null,
  },
  reducers: {
    clearMonthlyError: (state) => {
      state.error = null;
    },
    clearMonthlySuccess: (state) => {
      state.success = null;
    },
    clearMonthlyPrices: (state) => {
      state.prices = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ── setMonthlyPrice ──────────────────────────────
      .addCase(setMonthlyPrice.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(setMonthlyPrice.fulfilled, (state, action) => {
        state.saving = false;
        const entry = action.payload?.data ?? action.payload;
        state.prices.push(entry);
        state.success = "Monthly price set successfully.";
      })
      .addCase(setMonthlyPrice.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // ── getMonthlyPricesByHotel ──────────────────────
      .addCase(getMonthlyPricesByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMonthlyPricesByHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = action.payload?.data ?? action.payload ?? [];
      })
      .addCase(getMonthlyPricesByHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── updateMonthlyPrice ───────────────────────────
      .addCase(updateMonthlyPrice.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateMonthlyPrice.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload?.data ?? action.payload;
        const idx = state.prices.findIndex((p) => p._id === updated._id);
        if (idx !== -1) state.prices[idx] = updated;
        state.success = "Price updated successfully.";
      })
      .addCase(updateMonthlyPrice.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // ── deleteMonthlyPrice ───────────────────────────
      .addCase(deleteMonthlyPrice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMonthlyPrice.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = state.prices.filter((p) => p._id !== action.payload);
        state.success = "Entry deleted.";
      })
      .addCase(deleteMonthlyPrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── deleteAllMonthlyPricesByHotel ────────────────
      .addCase(deleteAllMonthlyPricesByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllMonthlyPricesByHotel.fulfilled, (state) => {
        state.loading = false;
        state.prices = [];
        state.success = "All price entries deleted.";
      })
      .addCase(deleteAllMonthlyPricesByHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMonthlyError, clearMonthlySuccess, clearMonthlyPrices } =
  monthlySlice.actions;
export default monthlySlice.reducer;
