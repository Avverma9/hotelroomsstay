import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../src/api'
import { SESSION_STORAGE_KEY } from '../../util/util'

const getSavedAuthData = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const savedData = window.sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!savedData) {
    return null
  }

  try {
    return JSON.parse(savedData)
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

const saveAuthData = (authData) => {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData))
}

const removeAuthData = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

const makeAuthData = (apiData) => {
  const sessionData = apiData?.sessionData || {}
  const user = sessionData.user || {
    id: apiData?.loggedUserId || '',
    role: apiData?.loggedUserRole || apiData?.role || '',
    status: apiData?.loggedUserStatus || false,
    name: apiData?.loggedUserName || '',
    email: apiData?.loggedUserEmail || '',
    image: apiData?.loggedUserImage || [],
  }

  const sidebarLinks = sessionData.sidebarLinks || apiData?.sidebarLinks || {}
  const token = sessionData.token || apiData?.rsToken || ''

  return {
    user,
    role: user.role || apiData?.loggedUserRole || '',
    token,
    sidebarLinks,
    message: apiData?.message || '',
    sessionData: {
      ...sessionData,
      token,
      user,
      sidebarLinks,
    },
  }
}

const updateSavedSidebarLinks = (state, sidebarLinks) => {
  state.sidebarLinks = sidebarLinks
  state.sessionData = {
    ...(state.sessionData || {}),
    sidebarLinks,
    user: state.user,
    token: state.token,
  }

  saveAuthData({
    user: state.user,
    role: state.role,
    token: state.token,
    sidebarLinks,
    message: state.message,
    sessionData: state.sessionData,
  })
}

const savedAuthData = getSavedAuthData()

const getInitialState = () => ({
  user: savedAuthData?.user || null,
  role: savedAuthData?.role || '',
  token: savedAuthData?.token || '',
  sidebarLinks: savedAuthData?.sidebarLinks || {},
  sessionData: savedAuthData?.sessionData || null,
  isAuthenticated: Boolean(savedAuthData?.token),
  loading: false,
  message: '',
  error: '',
})

export const loginWithPassword = createAsyncThunk(
  'auth/loginWithPassword',
  async (loginData, thunkAPI) => {
    try {
      const response = await api.post('/login/dashboard/user', loginData)
      const authData = makeAuthData(response.data)

      saveAuthData(authData)
      return authData
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Invalid email or password.',
      )
    }
  },
)

export const sendOtp = createAsyncThunk('auth/sendOtp', async (email, thunkAPI) => {
  try {
    const response = await api.post('/mail/send-otp', {
      email,
      loginType: 'dashboard',
    })

    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || 'Failed to send OTP. Try again.',
    )
  }
})

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, thunkAPI) => {
    try {
      const response = await api.post('/mail/verify-otp', {
        email,
        otp,
        loginType: 'dashboard',
      })
      const authData = makeAuthData(response.data)

      saveAuthData(authData)
      return authData
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          'Invalid OTP. Please check and try again.',
      )
    }
  },
)

export const refreshSidebarLinks = createAsyncThunk(
  'auth/refreshSidebarLinks',
  async (userId, thunkAPI) => {
    try {
      const response = await api.get(`/additional/sidebar-links/for-user/${userId}`, {
        params: { grouped: true },
        skipGlobalLoader: true,
      })

      return response.data?.data || {}
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to refresh sidebar links.',
      )
    }
  },
)

export const refreshRoutePermissions = createAsyncThunk(
  'auth/refreshRoutePermissions',
  async (userId, thunkAPI) => {
    try {
      const response = await api.get(`/additional/route-permissions/${userId}`, {
        skipGlobalLoader: true,
      })
      return response.data?.data?.routePermissions || null
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to refresh route permissions.',
      )
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  removeAuthData()
  return true
})

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearAuthMessage(state) {
      state.message = ''
      state.error = ''
    },
    clearCredentials(state) {
      removeAuthData()
      state.user = null
      state.role = ''
      state.token = ''
      state.sidebarLinks = {}
      state.sessionData = null
      state.isAuthenticated = false
      state.loading = false
      state.message = ''
      state.error = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithPassword.pending, (state) => {
        state.loading = true
        state.message = ''
        state.error = ''
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.role = action.payload.role
        state.token = action.payload.token
        state.sidebarLinks = action.payload.sidebarLinks
        state.sessionData = action.payload.sessionData
        state.isAuthenticated = true
        state.message = action.payload.message || 'Logged in successfully!'
        state.error = ''
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
      })
      .addCase(sendOtp.pending, (state) => {
        state.loading = true
        state.message = ''
        state.error = ''
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false
        state.message = action.payload?.message || 'OTP has been sent to your email.'
        state.error = ''
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to send OTP.'
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true
        state.message = ''
        state.error = ''
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.role = action.payload.role
        state.token = action.payload.token
        state.sidebarLinks = action.payload.sidebarLinks
        state.sessionData = action.payload.sessionData
        state.isAuthenticated = true
        state.message =
          action.payload.message || 'OTP verified successfully! Logging in...'
        state.error = ''
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'OTP verification failed'
      })
      .addCase(refreshSidebarLinks.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(refreshSidebarLinks.fulfilled, (state, action) => {
        state.loading = false
        updateSavedSidebarLinks(state, action.payload)
      })
      .addCase(refreshSidebarLinks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to refresh sidebar links'
      })
      .addCase(refreshRoutePermissions.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, routePermissions: action.payload }
          const updatedSessionData = {
            ...(state.sessionData || {}),
            user: state.user,
            token: state.token,
            sidebarLinks: state.sidebarLinks,
          }
          state.sessionData = updatedSessionData
          saveAuthData({
            user: state.user,
            role: state.role,
            token: state.token,
            sidebarLinks: state.sidebarLinks,
            message: state.message,
            sessionData: updatedSessionData,
          })
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.role = ''
        state.token = ''
        state.sidebarLinks = {}
        state.sessionData = null
        state.isAuthenticated = false
        state.loading = false
        state.message = ''
        state.error = ''
      })
  },
})

export const { clearAuthMessage, clearCredentials } = authSlice.actions

export const selectAuth = (state) => state.auth

export default authSlice.reducer
