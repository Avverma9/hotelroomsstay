import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const initialFilters = {
  hotelId: '',
  bookingStatus: '',
  bookingSource: '',
  date: '',
  email: '',
  userId: '',
  userMobile: '',
  bookingId: '',
  hotelEmail: '',
  hotelCity: '',
  couponCode: '',
  createdBy: '',
}

const initialState = {
  partner: null,
  summary: {
    totalHotels: 0,
    totalBookings: 0,
    sourceCounts: {},
    statusCounts: {},
  },
  hotels: [],
  bookings: [],
  selectedBooking: null,
  filters: initialFilters,
  loading: false,
  detailLoading: false,
  detailError: '',
  updatingBooking: false,
  sendingCancellationOtp: false,
  verifyingCancellationOtp: false,
  error: '',
}

const buildQueryParams = (filters = {}) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim())
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || fallbackMessage

const getBookingsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.bookings)) return payload.bookings
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings
  return []
}

const buildSummaryFromBookings = (bookings = []) => {
  const statusCounts = {}
  const sourceCounts = {}
  const hotelMap = new Map()

  bookings.forEach((booking) => {
    const statusKey = booking?.bookingStatus || 'Unknown'
    const sourceKey = booking?.normalizedSource || booking?.bookingSource || 'Unknown'
    const hotelId = booking?.hotelDetails?.hotelId || booking?._id

    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1
    sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0) + 1

    if (hotelId && !hotelMap.has(hotelId)) {
      hotelMap.set(hotelId, {
        hotelId: booking?.hotelDetails?.hotelId || '',
        hotelName: booking?.hotelDetails?.hotelName || 'Unnamed Hotel',
        hotelEmail: booking?.hotelDetails?.hotelEmail || '',
        city: booking?.hotelDetails?.hotelCity || booking?.destination || '',
        state: booking?.hotelDetails?.state || '',
      })
    }
  })

  return {
    summary: {
      totalHotels: hotelMap.size,
      totalBookings: bookings.length,
      sourceCounts,
      statusCounts,
    },
    hotels: Array.from(hotelMap.values()),
  }
}


export const createBooking = createAsyncThunk(
    'pms/createBooking',
    async ({ userId, hotelId, bookingData }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/booking/${userId}/${hotelId}`, bookingData);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create booking.',
            );
        }
    }
);

export const fetchPartnerHotelBookings = createAsyncThunk(
  'pms/fetchPartnerHotelBookings',
  async ({ partnerId, filters = {} }, { rejectWithValue }) => {
    try {
      const queryString = buildQueryParams(filters)
      const response = await api.get(`/partner/${partnerId}/hotel-bookings${queryString}`)

      return {
        partner: response.data?.partner || null,
        summary: response.data?.summary || initialState.summary,
        hotels: response.data?.hotels || [],
        bookings: response.data?.bookings || [],
        filters,
      }
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to fetch partner hotel bookings.'),
      )
    }
  },
)

export const fetchBookingsByQuery = createAsyncThunk(
  'pms/fetchBookingsByQuery',
  async ({ filters = {}, fixedFilters = {} }, { rejectWithValue }) => {
    try {
      const mergedFilters = {
        ...filters,
        ...fixedFilters,
      }
      const queryString = buildQueryParams(mergedFilters)
      const response = await api.get(`/get/all/filtered/booking/by/query${queryString}`)
      const bookings = getBookingsList(response.data)
      const { summary, hotels } = buildSummaryFromBookings(bookings)

      return {
        partner: null,
        summary,
        hotels,
        bookings,
        filters: mergedFilters,
      }
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to fetch filtered bookings.'),
      )
    }
  },
)
// /updatebooking/:bookingId

export const updateBookingData = createAsyncThunk(
  'pms/updateBookingData',
  async ({ bookingId, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/updatebooking/${bookingId}`, updateData, {
        useRawAuthorization: true,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update booking data.'),
      )
    }
  },
)

export const sendBookingCancellationOtp = createAsyncThunk(
  'pms/sendBookingCancellationOtp',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/booking/${encodeURIComponent(bookingId)}/cancel/send-otp`,
        {},
        { useRawAuthorization: true },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to send cancellation OTP.'),
      )
    }
  },
)

export const verifyBookingCancellationOtp = createAsyncThunk(
  'pms/verifyBookingCancellationOtp',
  async ({ bookingId, otp, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/booking/${encodeURIComponent(bookingId)}/cancel/verify`,
        { otp, cancellationReason },
        { useRawAuthorization: true },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to verify cancellation OTP.'),
      )
    }
  },
)

export const fetchBookingById = createAsyncThunk(
  'pms/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const normalizedBookingId = String(bookingId || '').trim()

      if (!normalizedBookingId) {
        return rejectWithValue('Booking ID is missing.')
      }

      const extractBooking = (payload) =>
        payload?.booking ||
        payload?.data?.booking ||
        payload?.data?.[0] ||
        payload?.bookings?.[0] ||
        payload?.data ||
        null

      let booking = null

      try {
        const response = await api.get(`/booking/${encodeURIComponent(normalizedBookingId)}`)
        booking = extractBooking(response.data)
      } catch {
        // Fall back to the query endpoint when direct lookup is unavailable/inconsistent.
        const fallbackResponse = await api.get(
          `/get/all/filtered/booking/by/query?bookingId=${encodeURIComponent(normalizedBookingId)}`,
        )
        booking = extractBooking(fallbackResponse.data)
      }

      if (!booking) {
        return rejectWithValue('Booking details not found.')
      }

      return booking
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to fetch booking details.'),
      )
    }
  },
)

const pmsSlice = createSlice({
  name: 'pms',
  initialState,
  reducers: {
    setPmsFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      }
    },
    resetPmsFilters(state) {
      state.filters = initialFilters
    },
    clearPmsError(state) {
      state.error = ''
    },
    clearSelectedBooking(state) {
      state.selectedBooking = null
      state.detailError = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartnerHotelBookings.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchPartnerHotelBookings.fulfilled, (state, action) => {
        state.loading = false
        state.partner = action.payload.partner
        state.summary = action.payload.summary
        state.hotels = action.payload.hotels
        state.bookings = action.payload.bookings
        state.filters = {
          ...state.filters,
          ...action.payload.filters,
        }
      })
      .addCase(fetchPartnerHotelBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch partner hotel bookings.'
      })
      .addCase(fetchBookingsByQuery.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchBookingsByQuery.fulfilled, (state, action) => {
        state.loading = false
        state.partner = action.payload.partner
        state.summary = action.payload.summary
        state.hotels = action.payload.hotels
        state.bookings = action.payload.bookings
        state.filters = {
          ...state.filters,
          ...action.payload.filters,
        }
      })
      .addCase(fetchBookingsByQuery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch filtered bookings.'
      })
      .addCase(fetchBookingById.pending, (state) => {
        state.detailLoading = true
        state.detailError = ''
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.detailLoading = false
        state.detailError = ''
        state.selectedBooking = action.payload
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || 'Failed to fetch booking details.'
      })
      .addCase(updateBookingData.pending, (state) => {
        state.updatingBooking = true
        state.error = ''
      })
      .addCase(updateBookingData.fulfilled, (state, action) => {
        state.updatingBooking = false

        const updatedBooking =
          action.payload?.booking ||
          action.payload?.data?.booking ||
          action.payload?.data ||
          action.payload

        if (!updatedBooking) {
          return
        }

        state.selectedBooking = {
          ...state.selectedBooking,
          ...updatedBooking,
        }

        state.bookings = state.bookings.map((booking) =>
          booking.bookingId === updatedBooking.bookingId ||
          booking._id === updatedBooking._id
            ? { ...booking, ...updatedBooking }
            : booking,
        )
      })
      .addCase(updateBookingData.rejected, (state, action) => {
        state.updatingBooking = false
        state.error = action.payload || 'Failed to update booking data.'
      })
      .addCase(sendBookingCancellationOtp.pending, (state) => {
        state.sendingCancellationOtp = true
        state.error = ''
      })
      .addCase(sendBookingCancellationOtp.fulfilled, (state) => {
        state.sendingCancellationOtp = false
      })
      .addCase(sendBookingCancellationOtp.rejected, (state, action) => {
        state.sendingCancellationOtp = false
        state.error = action.payload || 'Failed to send cancellation OTP.'
      })
      .addCase(verifyBookingCancellationOtp.pending, (state) => {
        state.verifyingCancellationOtp = true
        state.error = ''
      })
      .addCase(verifyBookingCancellationOtp.fulfilled, (state) => {
        state.verifyingCancellationOtp = false
      })
      .addCase(verifyBookingCancellationOtp.rejected, (state, action) => {
        state.verifyingCancellationOtp = false
        state.error = action.payload || 'Failed to verify cancellation OTP.'
      })
        .addCase(createBooking.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.booking = null;
        })
        .addCase(createBooking.fulfilled, (state, action) => {
            state.loading = false;
            state.booking = action.payload;
        })
        .addCase(createBooking.rejected, (state, action) => {
            state.loading = false;
            state.booking = null;
            state.error = action.payload;
        }); 
  },
})

export const { setPmsFilters, resetPmsFilters, clearPmsError, clearSelectedBooking } =
  pmsSlice.actions

export const selectPms = (state) => state.pms

export default pmsSlice.reducer
