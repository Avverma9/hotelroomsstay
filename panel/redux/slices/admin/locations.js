import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const normalizeLocationCollection = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.locations)) return payload.locations
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.created)) return payload.created
  return []
}

const normalizeCreatedLocation = (payload) => payload?.created || payload?.data || payload || null

const getLocationId = (location) => location?._id || location?.id || ''

export const getAllTravelLocations = createAsyncThunk(
  'locations/getAllTravelLocations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/get-all/travel/location')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch travel locations.')
    }
  },
)

export const addTravelLocation = createAsyncThunk(
  'locations/addTravelLocation',
  async ({ location, images = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('location', location)
      images.forEach((file) => formData.append('images', file))

      const response = await api.post('/add-a/travel/location', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add travel location.')
    }
  },
)

export const deleteTravelLocation = createAsyncThunk(
  'locations/deleteTravelLocation',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/delete-by-id/travel/location/${id}`)
      return {
        id,
        payload: response.data,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete travel location.')
    }
  },
)

const locationsSlice = createSlice({
  name: 'locations',
  initialState: {
    locations: [],
    loading: false,
    creating: false,
    deleting: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearLocationsStatus: (state) => {
      state.error = null
      state.successMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTravelLocations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllTravelLocations.fulfilled, (state, action) => {
        state.loading = false
        state.locations = normalizeLocationCollection(action.payload)
      })
      .addCase(getAllTravelLocations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addTravelLocation.pending, (state) => {
        state.creating = true
        state.error = null
        state.successMessage = null
      })
      .addCase(addTravelLocation.fulfilled, (state, action) => {
        const createdLocation = normalizeCreatedLocation(action.payload)
        state.creating = false
        state.successMessage = action.payload?.message || 'Location added successfully.'
        if (createdLocation) {
          state.locations = [createdLocation, ...state.locations]
        }
      })
      .addCase(addTravelLocation.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
      })
      .addCase(deleteTravelLocation.pending, (state) => {
        state.deleting = true
        state.error = null
        state.successMessage = null
      })
      .addCase(deleteTravelLocation.fulfilled, (state, action) => {
        state.deleting = false
        state.successMessage = action.payload.payload?.message || 'Location deleted successfully.'
        state.locations = state.locations.filter((location) => getLocationId(location) !== action.payload.id)
      })
      .addCase(deleteTravelLocation.rejected, (state, action) => {
        state.deleting = false
        state.error = action.payload
      })
  },
})

export const { clearLocationsStatus } = locationsSlice.actions
export default locationsSlice.reducer
