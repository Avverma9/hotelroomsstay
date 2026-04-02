import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const normalizeHotelCollection = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.hotels)) return payload.hotels
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data?.hotels)) return payload.data.hotels
  return []
}

const sanitizeFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (value === undefined || value === null) return false
      return String(value).trim() !== ''
    }),
  )

const resolveUpdatedHotel = (payload) => payload?.data || payload?.hotel || payload || null

const getEntityId = (entity) => entity?.hotelId || entity?._id || entity?.id || entity?.roomId || ''

const replaceEntityInList = (items, updatedEntity) => {
  const updatedId = getEntityId(updatedEntity)
  return items.map((item) => (getEntityId(item) === updatedId ? { ...item, ...updatedEntity } : item))
}

const mergeSelectedHotel = (selectedHotel, updatedHotel) => {
  if (!selectedHotel || !updatedHotel) return updatedHotel || selectedHotel
  if (selectedHotel?.data) {
    return {
      ...selectedHotel,
      data: {
        ...selectedHotel.data,
        ...updatedHotel,
      },
    }
  }

  return {
    ...selectedHotel,
    ...updatedHotel,
  }
}

export const getHotelsByFilters = createAsyncThunk(
  'admin/getHotelsByFilters',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const sanitizedFilters = sanitizeFilters(filters)
      const response = await api.get('/hotels/filters', {
        params: sanitizedFilters,
      })

      return {
        hotels: normalizeHotelCollection(response.data),
        filters: sanitizedFilters,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to filter hotels.')
    }
  },
)
 

export const getAllHotelReviews = createAsyncThunk(
  'admin/getAllHotelReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/find-all-users-hotel-review')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel reviews.')
    }
  },
)

export const createHotel = createAsyncThunk(
  'admin/createHotel',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/data/hotels-new/post/upload/data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create hotel.')
    }
  },
)

export const getAllHotels = createAsyncThunk(
  'admin/getAllHotels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/get/all/hotels')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels.')
    }
  },
)

export const updateHotelInfo = createAsyncThunk(
  'admin/updateHotelInfo',
  async ({ hotelId, hotelData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hotels/master/${hotelId}`, hotelData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update hotel.')
    }
  },
)



export const deleteHotelReview = createAsyncThunk(
  'admin/deleteHotelReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/delete/${reviewId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review.')
    }
  },
)

export const updateHotelReview = createAsyncThunk(
  'admin/updateHotelReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/update-review/${reviewId}`, reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review.')
    }
  },
)

export const getHotelById = createAsyncThunk(
  'admin/getHotelById',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hotels/get-by-id/${hotelId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel details.')
    }
  },
)

const hotelSlice = createSlice({
  name: 'hotel',
  initialState: {
    hotels: [],
    allHotels: [],
    selectedHotel: null,
    hotelReviews: [],

    filters: {},
    loading: false,
    updating: false,
    error: null,
    updateSuccess: null,
  },
  reducers: {
    clearHotelUpdateStatus: (state) => {
      state.updateSuccess = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllHotels.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllHotels.fulfilled, (state, action) => {
        const normalizedHotels = normalizeHotelCollection(action.payload)
        state.loading = false
        state.hotels = normalizedHotels
        state.allHotels = normalizedHotels
        state.filters = {}
      })
      .addCase(getAllHotels.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getHotelsByFilters.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getHotelsByFilters.fulfilled, (state, action) => {
        state.loading = false
        state.hotels = action.payload.hotels
        state.filters = action.payload.filters || {}
      })
      .addCase(getHotelsByFilters.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getHotelById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getHotelById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedHotel = action.payload
      })
      .addCase(getHotelById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateHotelInfo.pending, (state) => {
        state.updating = true
        state.error = null
        state.updateSuccess = null
      })
      .addCase(getAllHotelReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllHotelReviews.fulfilled, (state, action) => {
        state.loading = false
        state.hotelReviews = action.payload
      })
      .addCase(getAllHotelReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateHotelInfo.fulfilled, (state, action) => {
        const updatedHotel = resolveUpdatedHotel(action.payload)
        state.updating = false
        state.updateSuccess = action.payload?.message || 'Hotel updated successfully.'
        if (updatedHotel) {
          state.selectedHotel = mergeSelectedHotel(state.selectedHotel, updatedHotel)
          state.hotels = replaceEntityInList(state.hotels, updatedHotel)
          state.allHotels = replaceEntityInList(state.allHotels, updatedHotel)
        }
      })
      .addCase(updateHotelInfo.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload
      })
      .addCase(createHotel.pending, (state) => {
        state.updating = true
        state.error = null
        state.updateSuccess = null
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.updating = false
        state.updateSuccess = action.payload?.message || 'Hotel created successfully.'
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload
      })
  },
})

export const { clearHotelUpdateStatus } = hotelSlice.actions
export default hotelSlice.reducer
