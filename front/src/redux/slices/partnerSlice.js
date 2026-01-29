import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import apiClient from "../../utils/apiInterceptor";

const hotelId = localStorage.getItem("hotelId");
// Define the async thunk for posting rooms
export const postRooms = createAsyncThunk(
  "partner/postRooms",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/create-a-room-to-your-hotel',
        formData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Define the async thunk for sending notifications
export const sendNotification = createAsyncThunk(
  "partner/sendNotification",
  async (_, { rejectWithValue }) => {
    try {
      const userName = localStorage.getItem("roomsstayUserName");
      await apiClient.post(
        '/push-a-new-notification-to-the-panel/dashboard/user',
        {
          name: "New partner request",
          message: `A new hotel is uploaded by ${userName} please checkout`,
          path: `/view-hotel-details/${hotelId}`,
          userIds: ["66b5f475d19a3dcaaad081eb", "66751804def0b0b1d2f0d672"],
        }
      );
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Create the slice
const partnerSlice = createSlice({
  name: "partner",
  initialState: {
    data: [],
    loading: false,
    error: null,
    notificationStatus: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(postRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postRooms.fulfilled, (state, action) => {
        state.loading = false;
        toast.success("Room posted successfully!");
      })
      .addCase(postRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(
          `Failed to post room: ${action.payload || "Unknown error"}`
        );
      })
      .addCase(sendNotification.pending, (state) => {
        state.notificationStatus = "Sending...";
      })
      .addCase(sendNotification.fulfilled, (state) => {
        state.notificationStatus = "Notification sent successfully!";
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.notificationStatus = "Failed to send notification";
        toast.error(
          `Failed to send notification: ${action.payload || "Unknown error"}`
        );
      });
  },
});

// Export the reducer to be used in the store configuration
export default partnerSlice.reducer;
