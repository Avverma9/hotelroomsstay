import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { baseURL, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from '../../util/util'

const messengerApi = axios.create({
  baseURL,
  timeout: 10000,
})

const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession =
    window.localStorage.getItem(LOCAL_STORAGE_KEY) ||
    window.sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(rawSession)

    if (!window.localStorage.getItem(LOCAL_STORAGE_KEY)) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedSession))
    }

    return parsedSession
  } catch {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

messengerApi.interceptors.request.use((config) => {
  const session = getStoredSession()
  const token = session?.token || session?.sessionData?.token || ''

  if (token) {
    config.headers.Authorization = token
  }

  return config
})

const normalizeId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.$oid || value._id || value.id || ''
  }
  return ''
}

const normalizeTimestamp = (value) => {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.$date || value.timestamp || new Date().toISOString()
  }
  return new Date(value).toISOString()
}

const normalizeImageList = (images) => {
  if (Array.isArray(images)) return images
  if (!images) return []
  return [images]
}

const normalizeContact = (contact = {}) => ({
  _id: contact?._id || '',
  userId: normalizeId(contact?.userId),
  name: contact?.name || 'Unknown User',
  mobile: contact?.mobile || '',
  role: contact?.role || '',
  images: normalizeImageList(contact?.images),
  isOnline: Boolean(contact?.isOnline),
})

const normalizeChat = (chat = {}) => ({
  receiverId: normalizeId(chat?.receiverId || chat?.receiver),
  receiver: normalizeId(chat?.receiver),
  name: chat?.name || 'Unknown User',
  content: chat?.content || '',
  images: normalizeImageList(chat?.images),
  timestamp: normalizeTimestamp(chat?.timestamp),
  isOnline: Boolean(chat?.isOnline),
})

const normalizeMessage = (message = {}) => ({
  _id: message?._id || `${normalizeId(message?.sender)}-${normalizeTimestamp(message?.timestamp)}`,
  sender: normalizeId(message?.sender || message?.senderId),
  receiver: normalizeId(message?.receiver || message?.receiverId),
  content: message?.content || '',
  images: normalizeImageList(message?.images),
  timestamp: normalizeTimestamp(message?.timestamp),
  seen: Boolean(message?.seen),
})

const upsertRecentChat = (chats, message, receiverProfile) => {
  const targetReceiverId =
    message.sender === receiverProfile?._id ? message.sender : message.receiver

  const chatItem = {
    receiverId: targetReceiverId,
    receiver: targetReceiverId,
    name: receiverProfile?.name || chats.find((chat) => chat.receiverId === targetReceiverId)?.name || 'Unknown User',
    content: message.content || (message.images.length ? 'Attachment sent' : ''),
    images: message.images,
    timestamp: message.timestamp,
    isOnline: Boolean(receiverProfile?.isOnline),
  }

  const existingIndex = chats.findIndex((chat) => chat.receiverId === targetReceiverId)

  if (existingIndex === -1) {
    return [chatItem, ...chats]
  }

  const nextChats = [...chats]
  nextChats.splice(existingIndex, 1)
  return [chatItem, ...nextChats]
}

export const fetchMessengerContacts = createAsyncThunk(
  'messenger/fetchContacts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await messengerApi.get(`/chatApp/get-chat-contacts/${userId}`)
      return (response.data?.contacts || []).map(normalizeContact)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messenger contacts.',
      )
    }
  },
)

export const fetchRecentChats = createAsyncThunk(
  'messenger/fetchRecentChats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await messengerApi.get(`/chatApp/get-chats/${userId}`)
      return Array.isArray(response.data) ? response.data.map(normalizeChat) : []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recent chats.',
      )
    }
  },
)

export const fetchChatMessages = createAsyncThunk(
  'messenger/fetchChatMessages',
  async ({ receiverId, senderId }, { rejectWithValue }) => {
    try {
      const response = await messengerApi.get(
        `/chatApp/get-messages/of-chat/${receiverId}/${senderId}`,
      )

      return Array.isArray(response.data) ? response.data.map(normalizeMessage) : []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch chat messages.',
      )
    }
  },
)

export const fetchReceiverProfile = createAsyncThunk(
  'messenger/fetchReceiverProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await messengerApi.get(`/login/dashboard/get/all/user/${userId}`)
      const data = response.data?.data || response.data

      return {
        _id: data?._id || data?.id || userId,
        name: data?.name || 'Unknown User',
        email: data?.email || '',
        mobile: data?.mobile || '',
        role: data?.role || '',
        isOnline: Boolean(data?.isOnline),
        images: normalizeImageList(data?.images),
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch receiver profile.',
      )
    }
  },
)

export const sendChatMessage = createAsyncThunk(
  'messenger/sendChatMessage',
  async ({ senderId, receiverId, content, files = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('senderId', senderId)
      formData.append('receiverId', receiverId)
      formData.append('content', content || '')
      formData.append('timestamp', new Date().toISOString())
      formData.append('seen', 'false')

      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await messengerApi.post('/chatApp/send-messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return normalizeMessage(response.data?.data || response.data)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message.',
      )
    }
  },
)

export const addMessengerContact = createAsyncThunk(
  'messenger/addMessengerContact',
  async ({ userId, contactUserId }, { rejectWithValue }) => {
    try {
      await messengerApi.patch(`/chatApp/contacts/${userId}`, {
        userId: contactUserId,
      })

      return contactUserId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add messenger contact.',
      )
    }
  },
)

export const deleteMessengerContact = createAsyncThunk(
  'messenger/deleteMessengerContact',
  async ({ userId, contactUserId }, { rejectWithValue }) => {
    try {
      await messengerApi.delete(`/chatApp/contacts/${userId}/${contactUserId}`)
      return contactUserId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete messenger contact.',
      )
    }
  },
)

const initialState = {
  contacts: [],
  chats: [],
  messages: [],
  selectedReceiverId: '',
  selectedReceiver: null,
  activeTab: 'chat',
  loadingContacts: false,
  loadingChats: false,
  loadingMessages: false,
  loadingReceiver: false,
  sendingMessage: false,
  error: null,
}

const messengerSlice = createSlice({
  name: 'messenger',
  initialState,
  reducers: {
    clearMessengerError: (state) => {
      state.error = null
    },
    resetMessengerState: () => initialState,
    setActiveMessengerTab: (state, action) => {
      state.activeTab = action.payload
    },
    setSelectedMessengerReceiver: (state, action) => {
      state.selectedReceiverId = action.payload
    },
    appendIncomingMessage: (state, action) => {
      const incomingMessage = normalizeMessage(action.payload)
      const alreadyExists = state.messages.some((message) => message._id === incomingMessage._id)

      if (!alreadyExists) {
        state.messages.push(incomingMessage)
      }

      state.chats = upsertRecentChat(state.chats, incomingMessage, state.selectedReceiver)
    },
    updateMessengerUserStatus: (state, action) => {
      const { senderId, isOnline } = action.payload || {}

      state.contacts = state.contacts.map((contact) =>
        contact.userId === senderId ? { ...contact, isOnline } : contact,
      )
      state.chats = state.chats.map((chat) =>
        chat.receiverId === senderId ? { ...chat, isOnline } : chat,
      )

      if (state.selectedReceiver?._id === senderId) {
        state.selectedReceiver = {
          ...state.selectedReceiver,
          isOnline,
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessengerContacts.pending, (state) => {
        state.loadingContacts = true
        state.error = null
      })
      .addCase(fetchMessengerContacts.fulfilled, (state, action) => {
        state.loadingContacts = false
        state.contacts = action.payload
      })
      .addCase(fetchMessengerContacts.rejected, (state, action) => {
        state.loadingContacts = false
        state.error = action.payload
      })
      .addCase(fetchRecentChats.pending, (state) => {
        state.loadingChats = true
        state.error = null
      })
      .addCase(fetchRecentChats.fulfilled, (state, action) => {
        state.loadingChats = false
        state.chats = action.payload
      })
      .addCase(fetchRecentChats.rejected, (state, action) => {
        state.loadingChats = false
        state.error = action.payload
      })
      .addCase(fetchChatMessages.pending, (state) => {
        state.loadingMessages = true
        state.error = null
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loadingMessages = false
        state.messages = action.payload
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loadingMessages = false
        state.error = action.payload
      })
      .addCase(fetchReceiverProfile.pending, (state) => {
        state.loadingReceiver = true
        state.error = null
      })
      .addCase(fetchReceiverProfile.fulfilled, (state, action) => {
        state.loadingReceiver = false
        state.selectedReceiver = action.payload
      })
      .addCase(fetchReceiverProfile.rejected, (state, action) => {
        state.loadingReceiver = false
        state.error = action.payload
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sendingMessage = true
        state.error = null
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        state.messages.push(action.payload)
        state.chats = upsertRecentChat(state.chats, action.payload, state.selectedReceiver)
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload
      })
      .addCase(addMessengerContact.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteMessengerContact.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
  appendIncomingMessage,
  clearMessengerError,
  resetMessengerState,
  setActiveMessengerTab,
  setSelectedMessengerReceiver,
  updateMessengerUserStatus,
} = messengerSlice.actions

export const selectMessenger = (state) => state.messenger

export default messengerSlice.reducer
