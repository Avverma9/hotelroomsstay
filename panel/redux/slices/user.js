import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../src/api";

export const findUserByMobile = createAsyncThunk(
    'user/findUserByMobile',
    async (mobile, { rejectWithValue }) => {
        try {
          const response = await api.get(`/get/user/by/query?mobile=${mobile}`);
          if (response.data?.data?.length === 0) {
            return rejectWithValue('User not found');
          }
          return response?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to find user.',
            );
        }
    }
);

export const getAllUsers = createAsyncThunk(
    'user/getAllUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/get/all-users-data/all-data');
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch users.',
            );
        }
    }
);

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/Signup", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// params: { userId, email, mobile, bookingId, serviceType, bookingStatus, couponStatus, complaintStatus, page, limit }
export const filterUsers = createAsyncThunk(
  "user/filterUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const allowed = [
        'userId', 'email', 'mobile', 'bookingId',
        'serviceType', 'bookingStatus', 'couponStatus',
        'complaintStatus', 'page', 'limit',
      ];
      const queryParams = new URLSearchParams();
      allowed.forEach((key) => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.set(key, params[key]);
        }
      });
      const response = await api.get(`/admin/users/filter?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch one user's full detail (bookings + coupons + complaints) by userId
export const getUserDetails = createAsyncThunk(
  "user/getUserDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/filter?userId=${encodeURIComponent(userId)}&limit=1`);
      const data = response.data?.data;
      if (!data || data.length === 0) {
        return rejectWithValue('User details not found');
      }
      return data[0];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update user profile – sends JSON; multer .any() passes non-multipart through safely
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/update', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user: null,
        users: [],
        filteredData: {
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        },
        selectedUserDetail: null,
        loading: false,
        detailLoading: false,
        updating: false,
        error: null,
        updateError: null,
        updateSuccess: false,
    },
    reducers: {
        clearUser: (state) => {
            state.user = null;
            state.error = null;
        },
        clearUpdateStatus: (state) => {
            state.updateError = null;
            state.updateSuccess = false;
        },
        clearSelectedUserDetail: (state) => {
            state.selectedUserDetail = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(findUserByMobile.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.user = null;
            })
            .addCase(findUserByMobile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(findUserByMobile.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.error = action.payload;
            })
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(filterUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(filterUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.filteredData = {
                    data: action.payload.data || [],
                    total: action.payload.total || 0,
                    page: action.payload.page || 1,
                    totalPages: action.payload.totalPages || 0,
                };
            })
            .addCase(filterUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getUserDetails.pending, (state) => {
                state.detailLoading = true;
                state.selectedUserDetail = null;
            })
            .addCase(getUserDetails.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.selectedUserDetail = action.payload;
            })
            .addCase(getUserDetails.rejected, (state, action) => {
                state.detailLoading = false;
                state.error = action.payload;
            })
            .addCase(updateUser.pending, (state) => {
                state.updating = true;
                state.updateError = null;
                state.updateSuccess = false;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.updating = false;
                state.updateSuccess = true;
                // Reflect updated fields in selectedUserDetail
                if (
                    state.selectedUserDetail &&
                    state.selectedUserDetail.userId === action.payload.userId
                ) {
                    state.selectedUserDetail = {
                        ...state.selectedUserDetail,
                        name: action.payload.userName,
                        email: action.payload.email,
                        mobile: action.payload.mobile,
                        address: action.payload.address,
                    };
                }
                // Reflect in filteredData list
                const idx = state.filteredData.data.findIndex(
                    (u) => u.userId === action.payload.userId
                );
                if (idx !== -1) {
                    state.filteredData.data[idx] = {
                        ...state.filteredData.data[idx],
                        name: action.payload.userName,
                        email: action.payload.email,
                        mobile: action.payload.mobile,
                        address: action.payload.address,
                    };
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.updating = false;
                state.updateError = action.payload;
            });
    },
});

export const { clearUser, clearUpdateStatus, clearSelectedUserDetail } = userSlice.actions;

export default userSlice.reducer;
