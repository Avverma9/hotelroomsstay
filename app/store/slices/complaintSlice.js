import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../utils/api";
import { getUserId } from "../../utils/credentials";

const sanitizeUserId = (value) => String(value || "").trim().replace(/[<>\s]/g, "");
const COMPLAINT_CREATE_PATHS = [
  "/create-a-complaint/on/hotel",
];
const ALLOWED_REGARDING_VALUES = new Set(["booking", "hotel", "website", "service", "staff", "cleanliness", "food", "billing", "room", "other"]);

const normalizeComplaintResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.complaints)) return payload.complaints;
  return [];
};

const normalizeSingleComplaintResponse = (payload) => {
  if (!payload || Array.isArray(payload)) return null;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  if (payload?.complaint && !Array.isArray(payload.complaint)) return payload.complaint;
  return payload;
};

const shouldRetryWithAltPath = (error) => {
  const statusCode = Number(error?.response?.status || 0);
  const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();
  return statusCode === 404 || message.includes("cannot post") || message.includes("cannot get");
};

const postHotelComplaint = async (payload, config = {}) => {
  let lastError = null;

  for (let index = 0; index < COMPLAINT_CREATE_PATHS.length; index += 1) {
    const path = COMPLAINT_CREATE_PATHS[index];
    try {
      return await api.post(path, payload, config);
    } catch (error) {
      lastError = error;
      const hasNextPath = index < COMPLAINT_CREATE_PATHS.length - 1;
      if (!hasNextPath || !shouldRetryWithAltPath(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Unable to create complaint");
};

const toUploadFile = (image, index) => {
  if (!image) return null;

  if (typeof image === "string") {
    const uri = image.trim();
    if (!uri) return null;
    return {
      uri,
      name: `complaint-image-${Date.now()}-${index + 1}.jpg`,
      type: "image/jpeg",
    };
  }

  const uri = String(image?.uri || "").trim();
  if (!uri) return null;
  return {
    uri,
    name: image?.name || `complaint-image-${Date.now()}-${index + 1}.jpg`,
    type: image?.type || "image/jpeg",
  };
};

export const fetchUserComplaints = createAsyncThunk(
  "complaints/fetchUserComplaints",
  async (input = {}, { rejectWithValue }) => {
    try {
      const resolvedUserId = input?.userId || (await getUserId());

      if (!resolvedUserId) {
        return rejectWithValue({ message: "Missing userId for complaints." });
      }

      const response = await api.get(`/complaints/${resolvedUserId}`);
      return normalizeComplaintResponse(response?.data);
    } catch (error) {
      const msg = String(error?.response?.data?.message || error?.message || "").toLowerCase();
      if (msg.includes("no complaints found")) {
        return [];
      }
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch complaints" }
      );
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchComplaintById",
  async (id, { rejectWithValue }) => {
    try {
      const complaintId = String(id || "").trim();
      if (!complaintId) {
        return rejectWithValue({ message: "Missing complaint id." });
      }
      const response = await api.get(`/complaint/by-id/${complaintId}`);
      return normalizeSingleComplaintResponse(response?.data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to fetch complaint detail" }
      );
    }
  }
);

export const deleteComplaintById = createAsyncThunk(
  "complaints/deleteComplaintById",
  async (id, { rejectWithValue }) => {
    try {
      const complaintId = String(id || "").trim();
      if (!complaintId) {
        return rejectWithValue({ message: "Missing complaint id." });
      }
      const response = await api.delete(`/delete-a-particular/complaints/delete/by/id/${complaintId}`);
      return { id: complaintId, payload: response?.data || null };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to delete complaint" }
      );
    }
  }
);

export const sendComplaintChat = createAsyncThunk(
  "complaints/sendComplaintChat",
  async ({ complaintId, message, sender, receiver = "Admin" }, { rejectWithValue }) => {
    try {
      if (!complaintId) {
        return rejectWithValue({ message: "Missing complaintId." });
      }
      const text = String(message || "").trim();
      if (!text) {
        return rejectWithValue({ message: "Message is required." });
      }

      const payload = {
        sender: sender || "User",
        receiver,
        content: text,
      };

      const response = await api.post(`/do/chat-support/${complaintId}`, payload);
      return response?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to send message" }
      );
    }
  }
);

export const createHotelComplaint = createAsyncThunk(
  "complaints/createHotelComplaint",
  async (input = {}, { rejectWithValue }) => {
    console.log("here is input",input)
    try {
      const resolvedUserId = sanitizeUserId(input?.userId || (await getUserId()));
      const hotelId = String(input?.hotelId || "").trim();
      const regarding = String(input?.regarding || "").trim();
      const hotelName = String(input?.hotelName || "").trim();
      const hotelEmail = String(input?.hotelEmail || "").trim();
      const bookingId = String(input?.bookingId || "").trim();
      const issue = String(input?.issue || "").trim();
      const status = String(input?.status || "").trim();
      const regardingKey = regarding.toLowerCase();

      if (
        !resolvedUserId ||
        !hotelId ||
        !regarding ||
        !issue
      ) {
        return rejectWithValue({
          message: "Required fields: userId, hotelId, regarding, issue.",
        });
      }

      if (!ALLOWED_REGARDING_VALUES.has(regardingKey)) {
        return rejectWithValue({
          message: "regarding must be one of: Booking, Hotel, Website, Service, Staff, Cleanliness, Food, Billing, Room, Other.",
        });
      }

      const images = Array.isArray(input?.images) ? input.images : [];
      const uploadFiles = images
        .map((image, index) => toUploadFile(image, index))
        .filter(Boolean);

      const formData = new FormData();
      formData.append("userId", resolvedUserId);
      formData.append("hotelId", hotelId);
      formData.append("regarding", regarding);
      formData.append("issue", issue);
      if (status) formData.append("status", status);
      if (hotelName) formData.append("hotelName", hotelName);
      if (hotelEmail) formData.append("hotelEmail", hotelEmail);
      if (bookingId) formData.append("bookingId", bookingId);
      uploadFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await postHotelComplaint(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response?.data || null;
    } catch (error) {
      console.error("[createHotelComplaint] failed", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      return rejectWithValue(
        error?.response?.data || { message: error?.message || "Unable to create complaint" }
      );
    }
  }
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    detailStatus: "idle",
    detailError: null,
    selectedComplaint: null,
    chatStatus: "idle",
    chatError: null,
    createStatus: "idle",
    createError: null,
    createData: null,
    deleteStatus: "idle",
    deleteError: null,
    deleteData: null,
  },
  reducers: {
    resetComplaintsState: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.detailStatus = "idle";
      state.detailError = null;
      state.selectedComplaint = null;
      state.chatStatus = "idle";
      state.chatError = null;
      state.createStatus = "idle";
      state.createError = null;
      state.createData = null;
      state.deleteStatus = "idle";
      state.deleteError = null;
      state.deleteData = null;
    },
    resetComplaintDetailState: (state) => {
      state.detailStatus = "idle";
      state.detailError = null;
      state.selectedComplaint = null;
    },
    resetComplaintChatState: (state) => {
      state.chatStatus = "idle";
      state.chatError = null;
    },
    resetCreateComplaintState: (state) => {
      state.createStatus = "idle";
      state.createError = null;
      state.createData = null;
    },
    resetDeleteComplaintState: (state) => {
      state.deleteStatus = "idle";
      state.deleteError = null;
      state.deleteData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserComplaints.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserComplaints.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserComplaints.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || { message: "Failed to load complaints" };
        state.items = [];
      })
      .addCase(fetchComplaintById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selectedComplaint = action.payload || null;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload || { message: "Failed to fetch complaint detail" };
      })
      .addCase(sendComplaintChat.pending, (state) => {
        state.chatStatus = "loading";
        state.chatError = null;
      })
      .addCase(sendComplaintChat.fulfilled, (state) => {
        state.chatStatus = "succeeded";
      })
      .addCase(sendComplaintChat.rejected, (state, action) => {
        state.chatStatus = "failed";
        state.chatError = action.payload || { message: "Failed to send message" };
      })
      .addCase(createHotelComplaint.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createHotelComplaint.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.createData = action.payload || null;
      })
      .addCase(createHotelComplaint.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload || { message: "Failed to create complaint" };
      })
      .addCase(deleteComplaintById.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteComplaintById.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.deleteData = action.payload?.payload || null;
        const deletedId = String(action.payload?.id || "");
        state.items = state.items.filter((item) => String(item?._id || item?.id || "") !== deletedId);
      })
      .addCase(deleteComplaintById.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload || { message: "Failed to delete complaint" };
      });
  },
});

export const {
  resetComplaintsState,
  resetComplaintDetailState,
  resetComplaintChatState,
  resetCreateComplaintState,
  resetDeleteComplaintState,
} = complaintSlice.actions;
export default complaintSlice.reducer;
