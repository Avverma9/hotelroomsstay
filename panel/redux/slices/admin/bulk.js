import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getMessage = (payload, fallback) =>
  payload?.message || payload?.data?.message || payload?.error || fallback

export const bulkCreateHotels = createAsyncThunk(
  'bulk/bulkCreateHotels',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/hotels/bulk', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk create hotels.')
    }
  },
)

export const bulkUpdateHotels = createAsyncThunk(
  'bulk/bulkUpdateHotels',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.patch('/hotels/bulk/update', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update hotels.')
    }
  },
)

export const bulkApplyCouponToHotels = createAsyncThunk(
  'bulk/bulkApplyCouponToHotels',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.patch('/coupon/apply-to-hotel-rooms', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon in bulk.')
    }
  },
)

export const bulkRemoveCouponsFromHotels = createAsyncThunk(
  'bulk/bulkRemoveCouponsFromHotels',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.patch('/hotels/bulk/remove-coupons', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove coupons in bulk.')
    }
  },
)

export const bulkDeleteHotels = createAsyncThunk(
  'bulk/bulkDeleteHotels',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.delete('/hotels/bulk/delete', {
        data: payload,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk delete hotels.')
    }
  },
)

const bulkSlice = createSlice({
  name: 'bulk',
  initialState: {
    creating: false,
    updating: false,
    applyingCoupon: false,
    removingCoupons: false,
    deleting: false,
    error: null,
    createResult: null,
    updateResult: null,
    couponApplyResult: null,
    couponRemoveResult: null,
    deleteResult: null,
  },
  reducers: {
    clearBulkStatus: (state) => {
      state.error = null
      state.createResult = null
      state.updateResult = null
      state.couponApplyResult = null
      state.couponRemoveResult = null
      state.deleteResult = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bulkCreateHotels.pending, (state) => {
        state.creating = true
        state.error = null
        state.createResult = null
      })
      .addCase(bulkCreateHotels.fulfilled, (state, action) => {
        state.creating = false
        state.createResult = {
          message: getMessage(action.payload, 'Bulk hotels inserted.'),
          data: action.payload,
        }
      })
      .addCase(bulkCreateHotels.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
      })
      .addCase(bulkUpdateHotels.pending, (state) => {
        state.updating = true
        state.error = null
        state.updateResult = null
      })
      .addCase(bulkUpdateHotels.fulfilled, (state, action) => {
        state.updating = false
        state.updateResult = {
          message: getMessage(action.payload, 'Bulk hotel update successful.'),
          data: action.payload,
        }
      })
      .addCase(bulkUpdateHotels.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload
      })
      .addCase(bulkApplyCouponToHotels.pending, (state) => {
        state.applyingCoupon = true
        state.error = null
        state.couponApplyResult = null
      })
      .addCase(bulkApplyCouponToHotels.fulfilled, (state, action) => {
        state.applyingCoupon = false
        state.couponApplyResult = {
          message: getMessage(action.payload, 'Coupon applied successfully.'),
          data: action.payload,
        }
      })
      .addCase(bulkApplyCouponToHotels.rejected, (state, action) => {
        state.applyingCoupon = false
        state.error = action.payload
      })
      .addCase(bulkRemoveCouponsFromHotels.pending, (state) => {
        state.removingCoupons = true
        state.error = null
        state.couponRemoveResult = null
      })
      .addCase(bulkRemoveCouponsFromHotels.fulfilled, (state, action) => {
        state.removingCoupons = false
        state.couponRemoveResult = {
          message: getMessage(action.payload, 'Coupons removed successfully.'),
          data: action.payload,
        }
      })
      .addCase(bulkRemoveCouponsFromHotels.rejected, (state, action) => {
        state.removingCoupons = false
        state.error = action.payload
      })
      .addCase(bulkDeleteHotels.pending, (state) => {
        state.deleting = true
        state.error = null
        state.deleteResult = null
      })
      .addCase(bulkDeleteHotels.fulfilled, (state, action) => {
        state.deleting = false
        state.deleteResult = {
          message: getMessage(action.payload, 'Hotels deleted successfully.'),
          data: action.payload,
        }
      })
      .addCase(bulkDeleteHotels.rejected, (state, action) => {
        state.deleting = false
        state.error = action.payload
      })
  },
})

export const { clearBulkStatus } = bulkSlice.actions
export default bulkSlice.reducer
