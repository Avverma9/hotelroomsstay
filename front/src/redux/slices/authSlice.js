import { createSlice } from '@reduxjs/toolkit';

// Check if user is already logged in from localStorage
const token = localStorage.getItem('authToken');
const isSignedIn = localStorage.getItem('isSignedIn') === 'true';

const initialState = {
  user: isSignedIn ? {
    id: localStorage.getItem('rsUserId'),
    email: localStorage.getItem('roomsstayUserEmail'),
    name: localStorage.getItem('rsUserName'),
    mobile: localStorage.getItem('rsUserMobile'),
  } : null,
  token: token,
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
      state.error = null;
      
      // Save token to localStorage
      if (action.payload.token) {
        localStorage.setItem('authToken', action.payload.token);
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
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Clear all auth data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('isSignedIn');
      localStorage.removeItem('rsUserId');
      localStorage.removeItem('rsToken');
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
