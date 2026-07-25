import { createSlice } from '@reduxjs/toolkit';

// Check if user is already logged in from localStorage
const token = localStorage.getItem('authToken') || localStorage.getItem('rsToken');
const isSignedIn = localStorage.getItem('isSignedIn') === 'true' || !!token;

const initialState = {
  user: isSignedIn ? {
    id: localStorage.getItem('rsUserId'),
    email: localStorage.getItem('roomsstayUserEmail'),
    name: localStorage.getItem('rsUserName'),
    mobile: localStorage.getItem('rsUserMobile'),
  } : null,
  token: token,
  refreshToken: localStorage.getItem('rsRefreshToken') || null,
  isAuthenticated: isSignedIn && !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.error = null;

      // Save session data to localStorage in both legacy and current keys.
      if (action.payload.token) {
        localStorage.setItem('authToken', action.payload.token);
        localStorage.setItem('rsToken', action.payload.token);
      }
      if (action.payload.user?.id) {
        localStorage.setItem('rsUserId', action.payload.user.id);
      }
      localStorage.setItem('isSignedIn', action.payload.token ? 'true' : 'false');
      if (action.payload.user?.email) {
        localStorage.setItem('roomsstayUserEmail', action.payload.user.email);
      }
      if (action.payload.user?.mobile) {
        localStorage.setItem('rsUserMobile', action.payload.user.mobile);
      }
      if (action.payload.user?.name) {
        localStorage.setItem('rsUserName', action.payload.user.name);
      }
      if (action.payload.refreshToken) {
        localStorage.setItem('rsRefreshToken', action.payload.refreshToken);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
      state.user = null;
      state.token = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Clear all auth data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('isSignedIn');
      localStorage.removeItem('rsUserId');
      localStorage.removeItem('rsToken');
      localStorage.removeItem('rsRefreshToken');
      localStorage.removeItem('roomsstayUserEmail');
      localStorage.removeItem('rsUserMobile');
      localStorage.removeItem('rsUserName');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
