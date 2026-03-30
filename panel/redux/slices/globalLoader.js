import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  pendingRequests: 0,
}

const globalLoaderSlice = createSlice({
  name: 'globalLoader',
  initialState,
  reducers: {
    requestStarted: (state) => {
      state.pendingRequests += 1
    },
    requestFinished: (state) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1)
    },
    resetLoader: (state) => {
      state.pendingRequests = 0
    },
  },
})

export const { requestStarted, requestFinished, resetLoader } = globalLoaderSlice.actions

export const selectIsGlobalLoading = (state) => state.globalLoader.pendingRequests > 0

export default globalLoaderSlice.reducer
