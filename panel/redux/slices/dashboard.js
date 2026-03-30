import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../src/api'

const getCurrentYear = () => new Date().getFullYear()

const initialState = {
  bookingsCount: null,
  hotelsCount: null,
  userDetails: null,
  hotelData: null,
  partnerData: null,
  bookingData: null,
  selectedYear: getCurrentYear(),
  loading: false,
  error: '',
}

export const getAllBookingsCount = createAsyncThunk(
  'dashboard/getAllBookingsCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/get-all/bookings-count')
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings count.',
      )
    }
  },
)

export const getHotelsCount = createAsyncThunk(
  'dashboard/getHotelsCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/get-hotels/count')
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch hotels count.',
      )
    }
  },
)

export const getTotalUserDetails = createAsyncThunk(
  'dashboard/getTotalUserDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/get-total/user-details')
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user details.',
      )
    }
  },
)

export const hotelDataYearly = createAsyncThunk(
  'dashboard/hotelDataYearly',
  async (year, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statistics/hotel-data?year=${year}`)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch hotel data.',
      )
    }
  },
)

export const partnerDataYearly = createAsyncThunk(
  'dashboard/partnerDataYearly',
  async (year, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statistics/partners-data?year=${year}`)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner data.',
      )
    }
  },
)

export const bookingDataYearly = createAsyncThunk(
  'dashboard/bookingDataYearly',
  async (year, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statistics/bookings-data?year=${year}`)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch booking data.',
      )
    }
  },
)

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (year = getCurrentYear(), { dispatch }) => {
    await Promise.all([
      dispatch(getAllBookingsCount()),
      dispatch(getHotelsCount()),
      dispatch(getTotalUserDetails()),
      dispatch(hotelDataYearly(year)),
      dispatch(partnerDataYearly(year)),
      dispatch(bookingDataYearly(year)),
    ])

    return year
  },
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedYear(state, action) {
      state.selectedYear = action.payload
    },
    clearDashboardError(state) {
      state.error = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false
        state.selectedYear = action.payload
      })
      .addCase(fetchDashboardData.rejected, (state) => {
        state.loading = false
      })
      .addCase(getAllBookingsCount.pending, (state) => {
        state.error = ''
      })
      .addCase(getAllBookingsCount.fulfilled, (state, action) => {
        state.bookingsCount = action.payload
      })
      .addCase(getAllBookingsCount.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(getHotelsCount.pending, (state) => {
        state.error = ''
      })
      .addCase(getHotelsCount.fulfilled, (state, action) => {
        state.hotelsCount = action.payload
      })
      .addCase(getHotelsCount.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(getTotalUserDetails.pending, (state) => {
        state.error = ''
      })
      .addCase(getTotalUserDetails.fulfilled, (state, action) => {
        state.userDetails = action.payload
      })
      .addCase(getTotalUserDetails.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(hotelDataYearly.pending, (state) => {
        state.error = ''
      })
      .addCase(hotelDataYearly.fulfilled, (state, action) => {
        state.hotelData = action.payload
      })
      .addCase(hotelDataYearly.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(partnerDataYearly.pending, (state) => {
        state.error = ''
      })
      .addCase(partnerDataYearly.fulfilled, (state, action) => {
        state.partnerData = action.payload
      })
      .addCase(partnerDataYearly.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(bookingDataYearly.pending, (state) => {
        state.error = ''
      })
      .addCase(bookingDataYearly.fulfilled, (state, action) => {
        state.bookingData = action.payload
      })
      .addCase(bookingDataYearly.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { setSelectedYear, clearDashboardError } = dashboardSlice.actions

export const selectDashboard = (state) => state.dashboard

export default dashboardSlice.reducer
