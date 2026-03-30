import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const getObject = (payload) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload || {}
}

// GET /additional/route-permissions/:userId
// Response: { message, data: { userId, name, email, role, routePermissions: { mode, allowedRoutes, blockedRoutes } } }
export const getRoutePermissions = createAsyncThunk(
  'adminRoute/getRoutePermissions',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/additional/route-permissions/${userId}`)
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch route permissions.')
    }
  },
)

// PUT /additional/route-permissions/:userId
// Body: { mode, allowedRoutes, blockedRoutes }
// Response: { message, data: { userId, role, routePermissions: { mode, allowedRoutes, blockedRoutes } } }
export const updateRoutePermissions = createAsyncThunk(
  'adminRoute/updateRoutePermissions',
  async ({ userId, mode, allowedRoutes, blockedRoutes }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/additional/route-permissions/${userId}`, {
        mode,
        allowedRoutes,
        blockedRoutes,
      })
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update route permissions.')
    }
  },
)

// POST /additional/route-permissions/:userId/check
// Body: { routePath }
// Response: { message, data: { userId, role, routePath, hasAccess, matchedRuleType, matchedPattern, routePermissions? } }
export const checkRouteAccess = createAsyncThunk(
  'adminRoute/checkRouteAccess',
  async ({ userId, routePath }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/additional/route-permissions/${userId}/check`, { routePath })
      return getObject(response.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check route access.')
    }
  },
)

const initialState = {
  routePermissions: null, // { mode, allowedRoutes, blockedRoutes }
  userInfo: null,         // { userId, name, email, role }
  checkResult: null,      // { userId, role, routePath, hasAccess, matchedRuleType, matchedPattern, ... }
  loading: false,
  saving: false,
  checking: false,
  error: null,
  successMessage: '',
}

const adminRouteSlice = createSlice({
  name: 'adminRoute',
  initialState,
  reducers: {
    clearRouteAdminFeedback: (state) => {
      state.error = null
      state.successMessage = ''
    },
    clearCheckResult: (state) => {
      state.checkResult = null
    },
    clearRoutePermissions: (state) => {
      state.routePermissions = null
      state.userInfo = null
      state.checkResult = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRoutePermissions.pending, (state) => {
        state.loading = true
        state.error = null
        state.routePermissions = null  // clear stale data from previous user
        state.userInfo = null
      })
      .addCase(getRoutePermissions.fulfilled, (state, action) => {
        state.loading = false
        const data = action.payload
        state.routePermissions = data.routePermissions || null
        state.userInfo = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
        }
      })
      .addCase(getRoutePermissions.rejected, (state) => {
        state.loading = false
        state.routePermissions = null
        // not critical — user may have no config yet, do not surface error
      })

      .addCase(updateRoutePermissions.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateRoutePermissions.fulfilled, (state, action) => {
        state.saving = false
        const data = action.payload
        // backend may return routePermissions nested or at top level
        state.routePermissions = data.routePermissions || {
          mode: data.mode,
          allowedRoutes: data.allowedRoutes,
          blockedRoutes: data.blockedRoutes,
        }
        state.successMessage = 'Route permissions updated successfully.'
      })
      .addCase(updateRoutePermissions.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })

      .addCase(checkRouteAccess.pending, (state) => {
        state.checking = true
        state.checkResult = null
        state.error = null
      })
      .addCase(checkRouteAccess.fulfilled, (state, action) => {
        state.checking = false
        state.checkResult = action.payload
      })
      .addCase(checkRouteAccess.rejected, (state, action) => {
        state.checking = false
        state.error = action.payload
      })
  },
})

export const { clearRouteAdminFeedback, clearCheckResult, clearRoutePermissions } =
  adminRouteSlice.actions

export const selectAdminRoute = (state) => state.adminRoute

export default adminRouteSlice.reducer
