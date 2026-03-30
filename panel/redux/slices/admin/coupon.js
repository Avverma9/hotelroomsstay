import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.message || fallbackMessage

const normalizeCreatedCoupon = (payload) =>
  payload?.coupon || payload?.data?.coupon || payload?.data || payload || null

const normalizeAppliedCoupon = (payload) => {
  const couponType = payload?.couponType || (Array.isArray(payload?.data) ? 'partner' : 'user')

  if (couponType === 'partner') {
    const appliedItem = payload?.data?.[0] || null

    return {
      type: 'partner',
      couponCode: payload?.couponCode || '',
      hotelId: appliedItem?.hotelId || '',
      roomId: appliedItem?.roomId || '',
      originalPrice: Number(appliedItem?.originalPrice || 0),
      discountPrice: Number(appliedItem?.discountPrice || 0),
      finalPrice: Number(appliedItem?.finalPrice || 0),
      usage: payload?.usage || null,
      raw: payload,
    }
  }

  return {
    type: 'user',
    couponCode: payload?.couponCode || '',
    hotelId: payload?.hotelId || '',
    roomId: payload?.roomId || '',
    userId: payload?.userId || '',
    originalPrice: Number(payload?.originalPrice || 0),
    discountPrice: Number(payload?.discountPrice || 0),
    finalPrice: Number(payload?.finalPrice || 0),
    usage: payload?.usage || null,
    raw: payload,
  }
}

export const createCoupon = createAsyncThunk(
  'adminCoupon/createCoupon',
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await api.post('/coupons/coupon', couponData, {
        useRawAuthorization: true,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create coupon.'))
    }
  },
)

export const applyCoupon = createAsyncThunk(
  'adminCoupon/applyCoupon',
  async ({ couponType, couponCode, hotelId, hotelIds = [], roomId, userId }, { rejectWithValue }) => {
    try {
      const trimmedCouponCode = String(couponCode || '').trim()

      const payload =
        couponType === 'partner'
          ? {
              couponCode: trimmedCouponCode,
              hotelIds: hotelIds.length > 0 ? hotelIds : [hotelId].filter(Boolean),
            }
          : {
              couponCode: trimmedCouponCode,
              hotelId,
              roomId,
              userId,
            }

      const response = await api.patch('/coupons/coupon/apply', payload, {
        useRawAuthorization: true,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to apply coupon.'))
    }
  },
)

const initialState = {
  creating: false,
  applying: false,
  createError: '',
  applyError: '',
  createMessage: '',
  applyMessage: '',
  lastCreatedCoupon: null,
  appliedCoupon: null,
  createdCoupons: [],
}

const adminCouponSlice = createSlice({
  name: 'adminCoupon',
  initialState,
  reducers: {
    clearCouponFeedback(state) {
      state.createError = ''
      state.applyError = ''
      state.createMessage = ''
      state.applyMessage = ''
    },
    clearAppliedCouponState(state) {
      state.applyError = ''
      state.applyMessage = ''
      state.appliedCoupon = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCoupon.pending, (state) => {
        state.creating = true
        state.createError = ''
        state.createMessage = ''
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        const createdCoupon = normalizeCreatedCoupon(action.payload)

        state.creating = false
        state.lastCreatedCoupon = createdCoupon
        state.createMessage = action.payload?.message || 'Coupon created successfully.'
        if (createdCoupon) {
          state.createdCoupons = [createdCoupon, ...state.createdCoupons].slice(0, 10)
        }
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.creating = false
        state.createError = action.payload || 'Failed to create coupon.'
      })
      .addCase(applyCoupon.pending, (state) => {
        state.applying = true
        state.applyError = ''
        state.applyMessage = ''
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.applying = false
        state.appliedCoupon = normalizeAppliedCoupon(action.payload)
        state.applyMessage =
          action.payload?.message || 'Coupon applied successfully.'
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.applying = false
        state.applyError = action.payload || 'Failed to apply coupon.'
        state.appliedCoupon = null
      })
  },
})

export const { clearCouponFeedback, clearAppliedCouponState } = adminCouponSlice.actions

export const selectAdminCoupon = (state) => state.adminCoupon

export default adminCouponSlice.reducer
