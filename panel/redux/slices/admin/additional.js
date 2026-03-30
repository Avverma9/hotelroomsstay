import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getListFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getEntityId = (item) =>
  item?._id ||
  item?.id ||
  item?.uuid ||
  item?.value ||
  item?.name ||
  item?.role ||
  ''

const getEntityName = (item) =>
  item?.name ||
  item?.role ||
  item?.title ||
  item?.label ||
  item?.value ||
  item?.type ||
  'Untitled'

const normalizeItem = (item) => ({
  ...item,
  _id: getEntityId(item),
  id: getEntityId(item),
  name: getEntityName(item),
})

const normalizeList = (payload) => getListFromPayload(payload).map(normalizeItem)

const getSingleItem = (payload) => {
  if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
    return normalizeItem(payload.data)
  }

  if (!Array.isArray(payload) && payload && typeof payload === 'object') {
    return normalizeItem(payload)
  }

  return null
}

const createCollectionState = () => ({
  items: [],
  loading: false,
  saving: false,
  deleting: false,
  error: null,
})

const initialState = {
  travelAmenities: createCollectionState(),
  bedTypes: createCollectionState(),
  roomTypes: createCollectionState(),
  amenities: createCollectionState(),
  roles: createCollectionState(),
  tourThemes: createCollectionState(),
  feedback: '',
  globalError: null,
}

const handleError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback

export const getTravelAmenities = createAsyncThunk(
  'additional/getTravelAmenities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/get/travel-amenities')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch travel amenities.'))
    }
  },
)

export const addTravelAmenity = createAsyncThunk(
  'additional/addTravelAmenity',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/add/travel-amenities', { name })
      return getSingleItem(response.data) || normalizeItem({ name })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add travel amenity.'))
    }
  },
)

export const deleteTravelAmenity = createAsyncThunk(
  'additional/deleteTravelAmenity',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/delete-travel/amenities/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete travel amenity.'))
    }
  },
)

export const getBedTypes = createAsyncThunk(
  'additional/getBedTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/get-bed')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch bed types.'))
    }
  },
)

export const addBedTypes = createAsyncThunk(
  'additional/addBedTypes',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/add-bed', { name })
      return getSingleItem(response.data) || normalizeItem({ name })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add bed type.'))
    }
  },
)

export const deleteBedTypes = createAsyncThunk(
  'additional/deleteBedTypes',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/delete-bed/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete bed type.'))
    }
  },
)

export const getRoomTypes = createAsyncThunk(
  'additional/getRoomTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/get-room')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch room types.'))
    }
  },
)

export const addRoomTypes = createAsyncThunk(
  'additional/addRoomTypes',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/add-room', { name })
      return getSingleItem(response.data) || normalizeItem({ name })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add room type.'))
    }
  },
)

export const deleteRoomTypes = createAsyncThunk(
  'additional/deleteRoomTypes',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/delete-room/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete room type.'))
    }
  },
)

export const getAmenities = createAsyncThunk(
  'additional/getAmenities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/get-amenities')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch amenities.'))
    }
  },
)

export const addAmenity = createAsyncThunk(
  'additional/addAmenity',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/add-amenities', { name })
      return getSingleItem(response.data) || normalizeItem({ name })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add amenity.'))
    }
  },
)

export const deleteAmenity = createAsyncThunk(
  'additional/deleteAmenity',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/delete-amenity/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete amenity.'))
    }
  },
)

export const getRole = createAsyncThunk(
  'additional/getRole',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/roles')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch roles.'))
    }
  },
)

export const addRole = createAsyncThunk(
  'additional/addRole',
  async (roleInput, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/roles', { role: roleInput })
      return getSingleItem(response.data) || normalizeItem({ role: roleInput })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add role.'))
    }
  },
)

export const deleteRole = createAsyncThunk(
  'additional/deleteRole',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/roles/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete role.'))
    }
  },
)

export const addTourTheme = createAsyncThunk(
  'additional/addTourTheme',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/add-tour-theme', { name })
      return getSingleItem(response.data) || normalizeItem({ name })
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to add tour theme.'))
    }
  },
)

export const getTourThemes = createAsyncThunk(
  'additional/getTourThemes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/get-tour-themes')
      return normalizeList(response.data)
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to fetch tour themes.'))
    }
  },
)

export const deleteTourThemes = createAsyncThunk(
  'additional/deleteTourThemes',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/delete-tour-theme/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(handleError(error, 'Failed to delete tour theme.'))
    }
  },
)

const setPending = (state, key, mode) => {
  state[key][mode] = true
  state[key].error = null
  state.globalError = null
}

const setRejected = (state, key, mode, action) => {
  state[key][mode] = false
  state[key].error = action.payload || 'Something went wrong.'
  state.globalError = action.payload || 'Something went wrong.'
}

const upsertItem = (items, item) => {
  const itemId = getEntityId(item)
  const index = items.findIndex((currentItem) => getEntityId(currentItem) === itemId)

  if (index === -1) {
    return [item, ...items]
  }

  return items.map((currentItem, currentIndex) => (
    currentIndex === index ? { ...currentItem, ...item } : currentItem
  ))
}

const removeItem = (items, id) =>
  items.filter((item) => {
    const itemId = getEntityId(item)
    return itemId !== id && String(itemId) !== String(id)
  })

const additionalSlice = createSlice({
  name: 'adminAdditional',
  initialState,
  reducers: {
    clearAdditionalFeedback(state) {
      state.feedback = ''
      state.globalError = null
    },
    clearAdditionalCollectionError(state, action) {
      const key = action.payload

      if (state[key]) {
        state[key].error = null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTravelAmenities.pending, (state) => {
        setPending(state, 'travelAmenities', 'loading')
      })
      .addCase(getTravelAmenities.fulfilled, (state, action) => {
        state.travelAmenities.loading = false
        state.travelAmenities.items = action.payload
      })
      .addCase(getTravelAmenities.rejected, (state, action) => {
        setRejected(state, 'travelAmenities', 'loading', action)
      })
      .addCase(addTravelAmenity.pending, (state) => {
        setPending(state, 'travelAmenities', 'saving')
        state.feedback = ''
      })
      .addCase(addTravelAmenity.fulfilled, (state, action) => {
        state.travelAmenities.saving = false
        state.travelAmenities.items = upsertItem(state.travelAmenities.items, action.payload)
        state.feedback = 'Travel amenity added successfully.'
      })
      .addCase(addTravelAmenity.rejected, (state, action) => {
        setRejected(state, 'travelAmenities', 'saving', action)
      })
      .addCase(deleteTravelAmenity.pending, (state) => {
        setPending(state, 'travelAmenities', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteTravelAmenity.fulfilled, (state, action) => {
        state.travelAmenities.deleting = false
        state.travelAmenities.items = removeItem(state.travelAmenities.items, action.payload)
        state.feedback = 'Travel amenity deleted successfully.'
      })
      .addCase(deleteTravelAmenity.rejected, (state, action) => {
        setRejected(state, 'travelAmenities', 'deleting', action)
      })
      .addCase(getBedTypes.pending, (state) => {
        setPending(state, 'bedTypes', 'loading')
      })
      .addCase(getBedTypes.fulfilled, (state, action) => {
        state.bedTypes.loading = false
        state.bedTypes.items = action.payload
      })
      .addCase(getBedTypes.rejected, (state, action) => {
        setRejected(state, 'bedTypes', 'loading', action)
      })
      .addCase(addBedTypes.pending, (state) => {
        setPending(state, 'bedTypes', 'saving')
        state.feedback = ''
      })
      .addCase(addBedTypes.fulfilled, (state, action) => {
        state.bedTypes.saving = false
        state.bedTypes.items = upsertItem(state.bedTypes.items, action.payload)
        state.feedback = 'Bed type added successfully.'
      })
      .addCase(addBedTypes.rejected, (state, action) => {
        setRejected(state, 'bedTypes', 'saving', action)
      })
      .addCase(deleteBedTypes.pending, (state) => {
        setPending(state, 'bedTypes', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteBedTypes.fulfilled, (state, action) => {
        state.bedTypes.deleting = false
        state.bedTypes.items = removeItem(state.bedTypes.items, action.payload)
        state.feedback = 'Bed type deleted successfully.'
      })
      .addCase(deleteBedTypes.rejected, (state, action) => {
        setRejected(state, 'bedTypes', 'deleting', action)
      })
      .addCase(getRoomTypes.pending, (state) => {
        setPending(state, 'roomTypes', 'loading')
      })
      .addCase(getRoomTypes.fulfilled, (state, action) => {
        state.roomTypes.loading = false
        state.roomTypes.items = action.payload
      })
      .addCase(getRoomTypes.rejected, (state, action) => {
        setRejected(state, 'roomTypes', 'loading', action)
      })
      .addCase(addRoomTypes.pending, (state) => {
        setPending(state, 'roomTypes', 'saving')
        state.feedback = ''
      })
      .addCase(addRoomTypes.fulfilled, (state, action) => {
        state.roomTypes.saving = false
        state.roomTypes.items = upsertItem(state.roomTypes.items, action.payload)
        state.feedback = 'Room type added successfully.'
      })
      .addCase(addRoomTypes.rejected, (state, action) => {
        setRejected(state, 'roomTypes', 'saving', action)
      })
      .addCase(deleteRoomTypes.pending, (state) => {
        setPending(state, 'roomTypes', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteRoomTypes.fulfilled, (state, action) => {
        state.roomTypes.deleting = false
        state.roomTypes.items = removeItem(state.roomTypes.items, action.payload)
        state.feedback = 'Room type deleted successfully.'
      })
      .addCase(deleteRoomTypes.rejected, (state, action) => {
        setRejected(state, 'roomTypes', 'deleting', action)
      })
      .addCase(getAmenities.pending, (state) => {
        setPending(state, 'amenities', 'loading')
      })
      .addCase(getAmenities.fulfilled, (state, action) => {
        state.amenities.loading = false
        state.amenities.items = action.payload
      })
      .addCase(getAmenities.rejected, (state, action) => {
        setRejected(state, 'amenities', 'loading', action)
      })
      .addCase(addAmenity.pending, (state) => {
        setPending(state, 'amenities', 'saving')
        state.feedback = ''
      })
      .addCase(addAmenity.fulfilled, (state, action) => {
        state.amenities.saving = false
        state.amenities.items = upsertItem(state.amenities.items, action.payload)
        state.feedback = 'Amenity added successfully.'
      })
      .addCase(addAmenity.rejected, (state, action) => {
        setRejected(state, 'amenities', 'saving', action)
      })
      .addCase(deleteAmenity.pending, (state) => {
        setPending(state, 'amenities', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteAmenity.fulfilled, (state, action) => {
        state.amenities.deleting = false
        state.amenities.items = removeItem(state.amenities.items, action.payload)
        state.feedback = 'Amenity deleted successfully.'
      })
      .addCase(deleteAmenity.rejected, (state, action) => {
        setRejected(state, 'amenities', 'deleting', action)
      })
      .addCase(getRole.pending, (state) => {
        setPending(state, 'roles', 'loading')
      })
      .addCase(getRole.fulfilled, (state, action) => {
        state.roles.loading = false
        state.roles.items = action.payload
      })
      .addCase(getRole.rejected, (state, action) => {
        setRejected(state, 'roles', 'loading', action)
      })
      .addCase(addRole.pending, (state) => {
        setPending(state, 'roles', 'saving')
        state.feedback = ''
      })
      .addCase(addRole.fulfilled, (state, action) => {
        state.roles.saving = false
        state.roles.items = upsertItem(state.roles.items, action.payload)
        state.feedback = 'Role added successfully.'
      })
      .addCase(addRole.rejected, (state, action) => {
        setRejected(state, 'roles', 'saving', action)
      })
      .addCase(deleteRole.pending, (state) => {
        setPending(state, 'roles', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles.deleting = false
        state.roles.items = removeItem(state.roles.items, action.payload)
        state.feedback = 'Role deleted successfully.'
      })
      .addCase(deleteRole.rejected, (state, action) => {
        setRejected(state, 'roles', 'deleting', action)
      })
      .addCase(getTourThemes.pending, (state) => {
        setPending(state, 'tourThemes', 'loading')
      })
      .addCase(getTourThemes.fulfilled, (state, action) => {
        state.tourThemes.loading = false
        state.tourThemes.items = action.payload
      })
      .addCase(getTourThemes.rejected, (state, action) => {
        setRejected(state, 'tourThemes', 'loading', action)
      })
      .addCase(addTourTheme.pending, (state) => {
        setPending(state, 'tourThemes', 'saving')
        state.feedback = ''
      })
      .addCase(addTourTheme.fulfilled, (state, action) => {
        state.tourThemes.saving = false
        state.tourThemes.items = upsertItem(state.tourThemes.items, action.payload)
        state.feedback = 'Tour theme added successfully.'
      })
      .addCase(addTourTheme.rejected, (state, action) => {
        setRejected(state, 'tourThemes', 'saving', action)
      })
      .addCase(deleteTourThemes.pending, (state) => {
        setPending(state, 'tourThemes', 'deleting')
        state.feedback = ''
      })
      .addCase(deleteTourThemes.fulfilled, (state, action) => {
        state.tourThemes.deleting = false
        state.tourThemes.items = removeItem(state.tourThemes.items, action.payload)
        state.feedback = 'Tour theme deleted successfully.'
      })
      .addCase(deleteTourThemes.rejected, (state, action) => {
        setRejected(state, 'tourThemes', 'deleting', action)
      })
  },
})

export const { clearAdditionalFeedback, clearAdditionalCollectionError } =
  additionalSlice.actions

export const selectAdminAdditional = (state) => state.adminAdditional

export default additionalSlice.reducer
