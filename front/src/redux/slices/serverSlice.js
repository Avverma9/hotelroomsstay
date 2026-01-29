import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: true,
  errorMessage: null,
  lastChecked: null,
  retryCount: 0,
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setServerStatus: (state, action) => {
      state.isConnected = action.payload.isConnected;
      state.errorMessage = action.payload.errorMessage;
      state.lastChecked = new Date().toISOString();
      
      // Reset retry count if connected
      if (action.payload.isConnected) {
        state.retryCount = 0;
      }
    },
    incrementRetryCount: (state) => {
      state.retryCount += 1;
    },
    resetRetryCount: (state) => {
      state.retryCount = 0;
    },
    resetServerError: (state) => {
      state.errorMessage = null;
      state.isConnected = true;
    },
  },
});

export const { 
  setServerStatus, 
  incrementRetryCount, 
  resetRetryCount,
  resetServerError 
} = serverSlice.actions;

export default serverSlice.reducer;
