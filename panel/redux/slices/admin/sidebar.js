import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.partners)) return payload.partners
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.allUsers)) return payload.allUsers
  return []
}

const getObject = (payload) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }

  return payload || {}
}

const normalizeLink = (link) => ({
  ...link,
  _id: link?._id || link?.id || '',
  id: link?.id || link?._id || '',
  route: link?.route || link?.childLink || '',
})

const normalizeUser = (user) => ({
  ...user,
  _id: user?._id || user?.id || user?.userId || '',
  id: user?.id || user?._id || user?.userId || '',
})

const updateLinkInList = (links, updatedLink) =>
  links.map((link) =>
    (link._id || link.id) === (updatedLink._id || updatedLink.id)
      ? normalizeLink({ ...link, ...updatedLink })
      : link,
  )

export const getSidebarLinks = createAsyncThunk(
  'adminSidebar/getSidebarLinks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/sidebar-links', { params })
      return getList(response.data).map(normalizeLink)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch sidebar links.',
      )
    }
  },
)

export const getGroupedSidebarLinks = createAsyncThunk(
  'adminSidebar/getGroupedSidebarLinks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/additional/sidebar-links/grouped', { params })
      return response.data?.data || {}
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch grouped sidebar links.',
      )
    }
  },
)

export const createSidebarLink = createAsyncThunk(
  'adminSidebar/createSidebarLink',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/sidebar-links', payload)
      return normalizeLink(getObject(response.data))
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create sidebar link.',
      )
    }
  },
)

export const createBulkSidebarLinks = createAsyncThunk(
  'adminSidebar/createBulkSidebarLinks',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/additional/sidebar-links/bulk', payload)
      return getList(response.data).map(normalizeLink)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create bulk sidebar links.',
      )
    }
  },
)

export const updateSidebarLink = createAsyncThunk(
  'adminSidebar/updateSidebarLink',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/additional/sidebar-links/${id}`, data)
      return normalizeLink(getObject(response.data))
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update sidebar link.',
      )
    }
  },
)

export const changeSidebarLinkStatus = createAsyncThunk(
  'adminSidebar/changeSidebarLinkStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/additional/sidebar-links/${id}/status`, { status })
      return normalizeLink(getObject(response.data))
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update sidebar link status.',
      )
    }
  },
)

export const deleteSidebarLink = createAsyncThunk(
  'adminSidebar/deleteSidebarLink',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/additional/sidebar-links/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete sidebar link.',
      )
    }
  },
)

export const getSidebarPermissions = createAsyncThunk(
  'adminSidebar/getSidebarPermissions',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/additional/sidebar-permissions/${userId}`)
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user sidebar permissions.',
      )
    }
  },
)

export const updateSidebarPermissions = createAsyncThunk(
  'adminSidebar/updateSidebarPermissions',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/additional/sidebar-permissions/${userId}`, data)
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update user sidebar permissions.',
      )
    }
  },
)

export const getUserSidebarPreview = createAsyncThunk(
  'adminSidebar/getUserSidebarPreview',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/additional/sidebar-links/for-user/${userId}`, {
        params: { grouped: true },
      })

      return {
        data: response.data?.data || {},
        user: response.data?.user || {},
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch final sidebar preview.',
      )
    }
  },
)

export const getDashboardUsers = createAsyncThunk(
  'adminSidebar/getDashboardUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/login/dashboard/get/all/user')
      return getList(response.data).map(normalizeUser)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard users.',
      )
    }
  },
)

export const getRoutePermissions = createAsyncThunk(
  'adminSidebar/getRoutePermissions',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/additional/route-permissions/${userId}`)
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch route permissions.',
      )
    }
  },
)

export const updateRoutePermissions = createAsyncThunk(
  'adminSidebar/updateRoutePermissions',
  async ({ userId, allowedRoutes, blockedRoutes }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/additional/route-permissions/${userId}`, {
        allowedRoutes,
        blockedRoutes,
      })
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update route permissions.',
      )
    }
  },
)

const initialState = {
  links: [],
  groupedLinks: {},
  users: [],
  permissionConfig: null,
  routePermissions: null,
  preview: {},
  previewUser: null,
  loadingLinks: false,
  loadingUsers: false,
  loadingPermissions: false,
  loadingRoutePermissions: false,
  loadingPreview: false,
  savingLink: false,
  savingPermissions: false,
  savingRoutePermissions: false,
  error: null,
  successMessage: '',
}

const adminSidebarSlice = createSlice({
  name: 'adminSidebar',
  initialState,
  reducers: {
    clearSidebarAdminError: (state) => {
      state.error = null
    },
    clearSidebarAdminFeedback: (state) => {
      state.error = null
      state.successMessage = ''
    },
    clearSidebarPermissionState: (state) => {
      state.permissionConfig = null
      state.preview = {}
      state.previewUser = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSidebarLinks.pending, (state) => {
        state.loadingLinks = true
        state.error = null
      })
      .addCase(getSidebarLinks.fulfilled, (state, action) => {
        state.loadingLinks = false
        state.links = action.payload
      })
      .addCase(getSidebarLinks.rejected, (state, action) => {
        state.loadingLinks = false
        state.error = action.payload
      })
      .addCase(getGroupedSidebarLinks.fulfilled, (state, action) => {
        state.groupedLinks = action.payload
      })
      .addCase(createSidebarLink.pending, (state) => {
        state.savingLink = true
        state.error = null
      })
      .addCase(createSidebarLink.fulfilled, (state, action) => {
        state.savingLink = false
        state.links.unshift(action.payload)
        state.successMessage = 'Sidebar link created successfully.'
      })
      .addCase(createSidebarLink.rejected, (state, action) => {
        state.savingLink = false
        state.error = action.payload
      })
      .addCase(createBulkSidebarLinks.pending, (state) => {
        state.savingLink = true
        state.error = null
      })
      .addCase(createBulkSidebarLinks.fulfilled, (state, action) => {
        state.savingLink = false
        state.links = [...action.payload, ...state.links]
        state.successMessage = 'Sidebar links created successfully.'
      })
      .addCase(createBulkSidebarLinks.rejected, (state, action) => {
        state.savingLink = false
        state.error = action.payload
      })
      .addCase(updateSidebarLink.pending, (state) => {
        state.savingLink = true
        state.error = null
      })
      .addCase(updateSidebarLink.fulfilled, (state, action) => {
        state.savingLink = false
        state.links = updateLinkInList(state.links, action.payload)
        state.successMessage = 'Sidebar link updated successfully.'
      })
      .addCase(updateSidebarLink.rejected, (state, action) => {
        state.savingLink = false
        state.error = action.payload
      })
      .addCase(changeSidebarLinkStatus.pending, (state) => {
        state.savingLink = true
        state.error = null
      })
      .addCase(changeSidebarLinkStatus.fulfilled, (state, action) => {
        state.savingLink = false
        state.links = updateLinkInList(state.links, action.payload)
        state.successMessage = 'Sidebar link status updated successfully.'
      })
      .addCase(changeSidebarLinkStatus.rejected, (state, action) => {
        state.savingLink = false
        state.error = action.payload
      })
      .addCase(deleteSidebarLink.pending, (state) => {
        state.savingLink = true
        state.error = null
      })
      .addCase(deleteSidebarLink.fulfilled, (state, action) => {
        state.savingLink = false
        state.links = state.links.filter((link) => (link._id || link.id) !== action.payload)
        state.successMessage = 'Sidebar link deleted successfully.'
      })
      .addCase(deleteSidebarLink.rejected, (state, action) => {
        state.savingLink = false
        state.error = action.payload
      })
      .addCase(getDashboardUsers.pending, (state) => {
        state.loadingUsers = true
      })
      .addCase(getDashboardUsers.fulfilled, (state, action) => {
        state.loadingUsers = false
        state.users = action.payload
      })
      .addCase(getDashboardUsers.rejected, (state, action) => {
        state.loadingUsers = false
        state.error = action.payload
      })
      .addCase(getSidebarPermissions.pending, (state) => {
        state.loadingPermissions = true
        state.error = null
      })
      .addCase(getSidebarPermissions.fulfilled, (state, action) => {
        state.loadingPermissions = false
        state.permissionConfig = action.payload
      })
      .addCase(getSidebarPermissions.rejected, (state, action) => {
        state.loadingPermissions = false
        state.error = action.payload
      })
      .addCase(updateSidebarPermissions.pending, (state) => {
        state.savingPermissions = true
        state.error = null
      })
      .addCase(updateSidebarPermissions.fulfilled, (state, action) => {
        state.savingPermissions = false
        state.permissionConfig = action.payload
        state.successMessage = 'User sidebar permissions updated successfully.'
      })
      .addCase(updateSidebarPermissions.rejected, (state, action) => {
        state.savingPermissions = false
        state.error = action.payload
      })
      .addCase(getUserSidebarPreview.pending, (state) => {
        state.loadingPreview = true
        state.error = null
      })
      .addCase(getUserSidebarPreview.fulfilled, (state, action) => {
        state.loadingPreview = false
        state.preview = action.payload.data
        state.previewUser = action.payload.user
      })
      .addCase(getUserSidebarPreview.rejected, (state, action) => {
        state.loadingPreview = false
        state.error = action.payload
      })
      .addCase(getRoutePermissions.pending, (state) => {
        state.loadingRoutePermissions = true
        state.error = null
      })
      .addCase(getRoutePermissions.fulfilled, (state, action) => {
        state.loadingRoutePermissions = false
        state.routePermissions = action.payload
      })
      .addCase(getRoutePermissions.rejected, (state, action) => {
        state.loadingRoutePermissions = false
        state.routePermissions = null
        state.error = null // not critical — user may have no config yet
      })
      .addCase(updateRoutePermissions.pending, (state) => {
        state.savingRoutePermissions = true
        state.error = null
      })
      .addCase(updateRoutePermissions.fulfilled, (state, action) => {
        state.savingRoutePermissions = false
        state.routePermissions = action.payload
        state.successMessage = 'Route permissions updated successfully.'
      })
      .addCase(updateRoutePermissions.rejected, (state, action) => {
        state.savingRoutePermissions = false
        state.error = action.payload
      })
  },
})

export const {
  clearSidebarAdminError,
  clearSidebarAdminFeedback,
  clearSidebarPermissionState,
} = adminSidebarSlice.actions

export const selectAdminSidebar = (state) => state.adminSidebar

export default adminSidebarSlice.reducer
