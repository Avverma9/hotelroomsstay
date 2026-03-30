import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../src/api'

const getListFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.partners)) return payload.partners
  return []
}

const getPartnerFromPayload = (payload) => {
  if (payload?.data && !Array.isArray(payload.data)) return payload.data
  if (payload?.partner) return payload.partner
  return payload
}

const updatePartnerInList = (partners, updatedPartner) =>
  partners.map((partner) =>
    partner._id === updatedPartner._id ? { ...partner, ...updatedPartner } : partner,
  )

const normalizeContact = (contact = {}) => ({
  _id: contact?._id || '',
  userId: contact?.userId || '',
  name: contact?.name || '',
  mobile: contact?.mobile || '',
  isOnline: Boolean(contact?.isOnline),
  role: contact?.role || '',
})

const updateContactsInPartnerList = (partners, partnerId, contacts) =>
  partners.map((partner) =>
    partner._id === partnerId ? { ...partner, contacts } : partner,
  )

export const getAllPartners = createAsyncThunk(
  'partner/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/login/dashboard/get/all/user')
      return getListFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner data.',
      )
    }
  },
)

export const getPartnerById = createAsyncThunk(
  'partner/getById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/login/dashboard/get/all/user/${userId}`)
      return getPartnerFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner data.',
      )
    }
  },
)

export const getContacts = createAsyncThunk(
  'partner/getContacts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chatApp/get-chat-contacts/${userId}`)
      return {
        userId,
        contacts: (response.data?.contacts || []).map(normalizeContact),
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner contacts.',
      )
    }
  },
)

export const addPartner = createAsyncThunk(
  'partner/add',
  async (partnerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/create/dashboard/user', partnerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return getPartnerFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add partner.',
      )
    }
  },
)

export const updatePartner = createAsyncThunk(
  'partner/update',
  async ({ userId, partnerData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/update/dashboard/updated/partner/${userId}`,
        partnerData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return getPartnerFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update partner.',
      )
    }
  },
)

export const updatePartnerStatus = createAsyncThunk(
  'partner/updateStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/update/dashboard/user-status/${userId}`, { status })
      return getPartnerFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update partner status.',
      )
    }
  },
)

export const deletePartner = createAsyncThunk(
  'partner/delete',
  async (userIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        userIds.map((userId) =>
          api.delete(`/delete/dashboard/delete/partner/${userId}`),
        ),
      )
      return userIds
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete partner(s).',
      )
    }
  },
)

export const findPartnerByQuery = createAsyncThunk(
  'partner/findByQuery',
  async (params = {}, { rejectWithValue }) => {
    try {
      let query = ''

      if (typeof params === 'string') {
        query = `?search=${encodeURIComponent(params)}`
      } else {
        const parts = []
        if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`)
        if (params.role && params.role !== 'All') parts.push(`role=${encodeURIComponent(params.role)}`)
        if (params.city) parts.push(`city=${encodeURIComponent(params.city)}`)
        if (params.status !== undefined && params.status !== null)
          parts.push(`status=${params.status}`)
        if (params.isOnline !== undefined && params.isOnline !== null)
          parts.push(`isOnline=${params.isOnline}`)

        query = parts.length ? `?${parts.join('&')}` : ''
      }

      const response = await api.get(`/api/users-get-user/by/query${query}`)
      return getListFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search partners.',
      )
    }
  },
)

export const updatePartnerImage = createAsyncThunk(
  'partner/updateImage',
  async ({ userId, imageFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await api.post(`/api/users/${userId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return getPartnerFromPayload(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update partner image.',
      )
    }
  },
)

export const addContacts = createAsyncThunk(
  'partner/addContacts',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/chatApp/contacts/${id}`, { userId })

      return {
        userId: id,
        contact: normalizeContact(response.data?.contact || { userId }),
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add contact.',
      )
    }
  },
)

export const deleteContact = createAsyncThunk(
  'partner/deleteContact',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      await api.delete(`/chatApp/contacts/${id}/${userId}`)

      return {
        userId: id,
        contactUserId: userId,
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete contact.',
      )
    }
  },
)

export const getAll = getAllPartners

const initialState = {
  partners: [],
  selectedPartner: null,
  contacts: [],
  loading: false,
  contactsLoading: false,
  error: null,
}

const partnerSlice = createSlice({
  name: 'partner',
  initialState,
  reducers: {
    clearPartnerError: (state) => {
      state.error = null
    },
    clearSelectedPartner: (state) => {
      state.selectedPartner = null
      state.contacts = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPartners.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllPartners.fulfilled, (state, action) => {
        state.loading = false
        state.partners = action.payload
      })
      .addCase(getAllPartners.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getPartnerById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPartnerById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedPartner = action.payload
        state.contacts = action.payload?.contacts || []
      })
      .addCase(getPartnerById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getContacts.pending, (state) => {
        state.contactsLoading = true
        state.error = null
      })
      .addCase(getContacts.fulfilled, (state, action) => {
        state.contactsLoading = false
        state.contacts = action.payload.contacts
        state.partners = updateContactsInPartnerList(
          state.partners,
          action.payload.userId,
          action.payload.contacts,
        )

        if (state.selectedPartner?._id === action.payload.userId) {
          state.selectedPartner = {
            ...state.selectedPartner,
            contacts: action.payload.contacts,
          }
        }
      })
      .addCase(getContacts.rejected, (state, action) => {
        state.contactsLoading = false
        state.error = action.payload
      })
      .addCase(addPartner.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addPartner.fulfilled, (state, action) => {
        state.loading = false
        state.partners.unshift(action.payload)
      })
      .addCase(addPartner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updatePartner.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePartner.fulfilled, (state, action) => {
        state.loading = false
        state.partners = updatePartnerInList(state.partners, action.payload)
        state.selectedPartner =
          state.selectedPartner?._id === action.payload._id
            ? { ...state.selectedPartner, ...action.payload }
            : state.selectedPartner
      })
      .addCase(updatePartner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updatePartnerStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePartnerStatus.fulfilled, (state, action) => {
        state.loading = false
        state.partners = updatePartnerInList(state.partners, action.payload)
        state.selectedPartner =
          state.selectedPartner?._id === action.payload._id
            ? { ...state.selectedPartner, ...action.payload }
            : state.selectedPartner
      })
      .addCase(updatePartnerStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deletePartner.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deletePartner.fulfilled, (state, action) => {
        state.loading = false
        state.partners = state.partners.filter(
          (partner) => !action.payload.includes(partner._id),
        )
      })
      .addCase(deletePartner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(findPartnerByQuery.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(findPartnerByQuery.fulfilled, (state, action) => {
        state.loading = false
        state.partners = action.payload
      })
      .addCase(findPartnerByQuery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updatePartnerImage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePartnerImage.fulfilled, (state, action) => {
        state.loading = false
        state.partners = updatePartnerInList(state.partners, action.payload)
        state.selectedPartner =
          state.selectedPartner?._id === action.payload._id
            ? { ...state.selectedPartner, ...action.payload }
            : state.selectedPartner
      })
      .addCase(updatePartnerImage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addContacts.pending, (state) => {
        state.contactsLoading = true
        state.error = null
      })
      .addCase(addContacts.fulfilled, (state, action) => {
        state.contactsLoading = false
        const contactExists = state.contacts.some(
          (contact) => contact.userId === action.payload.contact.userId,
        )

        state.contacts = contactExists
          ? state.contacts
          : [...state.contacts, action.payload.contact]
        state.partners = updateContactsInPartnerList(
          state.partners,
          action.payload.userId,
          state.contacts,
        )

        if (state.selectedPartner?._id === action.payload.userId) {
          state.selectedPartner = {
            ...state.selectedPartner,
            contacts: state.contacts,
          }
        }
      })
      .addCase(addContacts.rejected, (state, action) => {
        state.contactsLoading = false
        state.error = action.payload
      })
      .addCase(deleteContact.pending, (state) => {
        state.contactsLoading = true
        state.error = null
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contactsLoading = false
        state.contacts = state.contacts.filter(
          (contact) => contact.userId !== action.payload.contactUserId,
        )
        state.partners = updateContactsInPartnerList(
          state.partners,
          action.payload.userId,
          state.contacts,
        )

        if (state.selectedPartner?._id === action.payload.userId) {
          state.selectedPartner = {
            ...state.selectedPartner,
            contacts: state.contacts,
          }
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.contactsLoading = false
        state.error = action.payload
      })
  },
})

export const { clearPartnerError, clearSelectedPartner } = partnerSlice.actions

export const selectPartner = (state) => state.partner

export default partnerSlice.reducer
