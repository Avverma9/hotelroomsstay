import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getEntryId = (entry) => entry?._id || entry?.id || entry?.gstId || ''

const normalizeEntries = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.entries)) {
    return payload.entries
  }

  if (Array.isArray(payload?.gstEntries)) {
    return payload.gstEntries
  }

  return []
}

const normalizeSingleEntry = (payload) => payload?.data || payload?.gst || payload || null

export const createGST = createAsyncThunk(
  'admin/createGST',
  async (gstData, { rejectWithValue }) => {
    try {
      const response = await api.post('/gst/create', gstData)
      return normalizeSingleEntry(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create GST entry.',
      )
    }
  },
)

export const updateGST = createAsyncThunk(
  'admin/updateGST',
  async (gstData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/gst/update', gstData)
      return normalizeSingleEntry(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update GST entry.',
      )
    }
  },
)

export const getGST = createAsyncThunk(
  'admin/getGST',
  async (params = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams()

      if (params.type) {
        searchParams.set('type', params.type)
      }

      if (params.gstThreshold !== undefined && params.gstThreshold !== null && params.gstThreshold !== '') {
        searchParams.set('gstThreshold', String(params.gstThreshold))
      }

      const queryString = searchParams.toString()
      const response = await api.get(`/gst/get-single-gst${queryString ? `?${queryString}` : ''}`)
      return normalizeSingleEntry(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch GST entry.',
      )
    }
  },
)

export const getAllGST = createAsyncThunk(
  'admin/getAllGST',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/gst/get-all-gst')
      return normalizeEntries(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch GST entries.',
      )
    }
  },
)

export const deleteGST = createAsyncThunk(
  'admin/deleteGST',
  async (gstId, { rejectWithValue }) => {
    try {
      await api.delete(`/gst/delete-gst/${gstId}`)
      return { id: gstId }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete GST entry.',
      )
    }
  },
)

const gstSlice = createSlice({
  name: 'gst',
  initialState: {
    gstEntries: [],
    selectedGST: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createGST.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createGST.fulfilled, (state, action) => {
        state.loading = false
        state.gstEntries.unshift(action.payload)
        state.selectedGST = action.payload
      })
      .addCase(createGST.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateGST.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateGST.fulfilled, (state, action) => {
        state.loading = false
        const updatedId = getEntryId(action.payload)
        const index = state.gstEntries.findIndex((entry) => getEntryId(entry) === updatedId)

        if (index !== -1) {
          state.gstEntries[index] = action.payload
        } else {
          state.gstEntries.unshift(action.payload)
        }

        state.selectedGST = action.payload
      })
      .addCase(updateGST.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getGST.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getGST.fulfilled, (state, action) => {
        state.loading = false
        state.selectedGST = action.payload
      })
      .addCase(getGST.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getAllGST.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllGST.fulfilled, (state, action) => {
        state.loading = false
        state.gstEntries = action.payload
      })
      .addCase(getAllGST.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteGST.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteGST.fulfilled, (state, action) => {
        state.loading = false
        state.gstEntries = state.gstEntries.filter((entry) => getEntryId(entry) !== action.payload.id)
        if (getEntryId(state.selectedGST) === action.payload.id) {
          state.selectedGST = null
        }
      })
      .addCase(deleteGST.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default gstSlice.reducer
