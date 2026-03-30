import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../src/api'

const extractError = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || 'An error occurred'

/* ── Thunks ─────────────────────────────────────────── */

// POST /push-a-new-notification-to-the-panel/dashboard/user
export const pushUserNotification = createAsyncThunk(
  'notification/pushUser',
  async ({ name, message, userIds, userId, path, eventType, metadata }, { rejectWithValue }) => {
    try {
      const payload = { name, message, path, eventType, metadata }
      if (userId) payload.userId = userId
      else payload.userIds = userIds
      const { data } = await api.post('/push-a-new-notification-to-the-panel/dashboard/user', payload)
      return data
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// POST /push-a-new-notification-to-the-panel/dashboard
export const pushGlobalNotification = createAsyncThunk(
  'notification/pushGlobal',
  async ({ name, message, path }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/push-a-new-notification-to-the-panel/dashboard', {
        name,
        message,
        path,
      })
      return data
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// GET /app/notifications/user/:userId  (user-specific notifications)
export const fetchUserNotifications = createAsyncThunk(
  'notification/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/app/notifications/user/${userId}`)
      return Array.isArray(data) ? data : data?.data || []
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// GET /push-a-new-notification-to-the-panel/dashboard/get/:userId  (global notifications)
export const fetchGlobalNotifications = createAsyncThunk(
  'notification/fetchGlobal',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        `/push-a-new-notification-to-the-panel/dashboard/get/${userId}`,
      )
      return Array.isArray(data) ? data : data?.data || []
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// PATCH /app/notifications/:notificationId/seen/:userId
export const markUserNotificationSeen = createAsyncThunk(
  'notification/markUserSeen',
  async ({ notificationId, userId }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/app/notifications/${notificationId}/seen/${userId}`)
      return { notificationId, userId, data }
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// PATCH /fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard/:userId/:notificationId/seen
export const markGlobalNotificationSeen = createAsyncThunk(
  'notification/markGlobalSeen',
  async ({ notificationId, userId }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(
        `/fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard/${userId}/${notificationId}/seen`,
      )
      return { notificationId, userId, data }
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// DELETE /find/all/by/list/of/user/for/notification/and-delete/user/:notificationId
export const deleteUserNotification = createAsyncThunk(
  'notification/deleteUser',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(
        `/find/all/by/list/of/user/for/notification/and-delete/user/${notificationId}`,
      )
      return notificationId
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

// DELETE /find/all/by/list/of/user/for/notification/and-delete-global/:notificationId
export const deleteGlobalNotification = createAsyncThunk(
  'notification/deleteGlobal',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(
        `/find/all/by/list/of/user/for/notification/and-delete-global/${notificationId}`,
      )
      return notificationId
    } catch (err) {
      return rejectWithValue(extractError(err))
    }
  },
)

/* ── Slice ──────────────────────────────────────────── */
const initialState = {
  userNotifications: [],
  globalNotifications: [],
  fetching: false,
  pushing: false,
  fetchError: null,
  pushError: null,
  pushMessage: '',
}

const computeUnread = (notifs) => notifs.filter((n) => !n.seen).length

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearPushStatus(state) {
      state.pushError = null
      state.pushMessage = ''
    },
    // Optimistic mark-seen for instant UI response
    optimisticMarkSeen(state, action) {
      const { notificationId, type } = action.payload
      const list = type === 'global' ? state.globalNotifications : state.userNotifications
      const idx = list.findIndex((n) => n._id === notificationId)
      if (idx !== -1) list[idx].seen = true
    },
    // Optimistic delete
    optimisticDelete(state, action) {
      const { notificationId, type } = action.payload
      if (type === 'global') {
        state.globalNotifications = state.globalNotifications.filter(
          (n) => n._id !== notificationId,
        )
      } else {
        state.userNotifications = state.userNotifications.filter((n) => n._id !== notificationId)
      }
    },
  },
  extraReducers: (builder) => {
    // fetchUserNotifications
    builder
      .addCase(fetchUserNotifications.pending, (state) => {
        state.fetching = true
        state.fetchError = null
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.fetching = false
        state.userNotifications = action.payload
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.fetching = false
        state.fetchError = action.payload
      })

    // fetchGlobalNotifications
    builder
      .addCase(fetchGlobalNotifications.pending, (state) => {
        state.fetching = true
        state.fetchError = null
      })
      .addCase(fetchGlobalNotifications.fulfilled, (state, action) => {
        state.fetching = false
        state.globalNotifications = action.payload
      })
      .addCase(fetchGlobalNotifications.rejected, (state, action) => {
        state.fetching = false
        state.fetchError = action.payload
      })

    // pushUserNotification
    builder
      .addCase(pushUserNotification.pending, (state) => {
        state.pushing = true
        state.pushError = null
        state.pushMessage = ''
      })
      .addCase(pushUserNotification.fulfilled, (state, action) => {
        state.pushing = false
        state.pushMessage = action.payload?.message || 'Notification sent successfully.'
      })
      .addCase(pushUserNotification.rejected, (state, action) => {
        state.pushing = false
        state.pushError = action.payload
      })

    // pushGlobalNotification
    builder
      .addCase(pushGlobalNotification.pending, (state) => {
        state.pushing = true
        state.pushError = null
        state.pushMessage = ''
      })
      .addCase(pushGlobalNotification.fulfilled, (state, action) => {
        state.pushing = false
        state.pushMessage = action.payload?.message || 'Global notification sent successfully.'
      })
      .addCase(pushGlobalNotification.rejected, (state, action) => {
        state.pushing = false
        state.pushError = action.payload
      })

    // markUserNotificationSeen — also update state
    builder.addCase(markUserNotificationSeen.fulfilled, (state, action) => {
      const idx = state.userNotifications.findIndex(
        (n) => n._id === action.payload.notificationId,
      )
      if (idx !== -1) state.userNotifications[idx].seen = true
    })

    // markGlobalNotificationSeen
    builder.addCase(markGlobalNotificationSeen.fulfilled, (state, action) => {
      const idx = state.globalNotifications.findIndex(
        (n) => n._id === action.payload.notificationId,
      )
      if (idx !== -1) state.globalNotifications[idx].seen = true
    })

    // deleteUserNotification
    builder.addCase(deleteUserNotification.fulfilled, (state, action) => {
      state.userNotifications = state.userNotifications.filter((n) => n._id !== action.payload)
    })

    // deleteGlobalNotification
    builder.addCase(deleteGlobalNotification.fulfilled, (state, action) => {
      state.globalNotifications = state.globalNotifications.filter(
        (n) => n._id !== action.payload,
      )
    })
  },
})

export const { clearPushStatus, optimisticMarkSeen, optimisticDelete } =
  notificationSlice.actions

// Selectors
export const selectNotification = (state) => state.notification
export const selectUnreadCount = (state) => {
  const s = state.notification
  return (
    computeUnread(s.userNotifications) + computeUnread(s.globalNotifications)
  )
}
export const selectAllNotifications = (state) => {
  const user = state.notification.userNotifications.map((n) => ({ ...n, _type: 'user' }))
  const global = state.notification.globalNotifications.map((n) => ({ ...n, _type: 'global' }))
  return [...user, ...global].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

export default notificationSlice.reducer
