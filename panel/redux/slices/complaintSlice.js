import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../src/api";

const normalizeComplaintList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.complaints)) return payload.complaints;
  if (Array.isArray(payload?.data?.complaints)) return payload.data.complaints;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

// ─── 1. Create Complaint ──────────────────────────────────────────────────────
export const createComplaint = createAsyncThunk(
  "complaints/createComplaint",
  async (complaintData, { rejectWithValue }) => {
    try {
      const response = await api.post("/create-a-complaint/on/hotel", complaintData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 2. Fetch All Complaints (Admin Panel) ────────────────────────────────────
export const fetchComplaints = createAsyncThunk(
  "complaints/fetchComplaints",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/get/all-complaint-on-admin/panel");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 3. Fetch Complaints by User ID ──────────────────────────────────────────
export const fetchComplaintsByUser = createAsyncThunk(
  "complaints/fetchComplaintsByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/complaints/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 4. Fetch Single Complaint by MongoDB _id ─────────────────────────────────
export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchComplaintById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/complaint/by-id/${id}`);
      // API returns { success, data: { ...complaint, chats: [] } }
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 5. Filter Complaints (Admin Panel) ──────────────────────────────────────
// filters: { status?, hotelName?, hotelEmail?, complaintId? }
export const filterComplaints = createAsyncThunk(
  "complaints/filterComplaints",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/get/all-complaint-on-admin/panel/by-filter",
        { params: filters }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 6. Update Complaint (Approve / Reject / Resolve / Working) ───────────────
// arg: { id: mongoId, updateData: { status, feedBack, updatedBy, messages? } }
export const updateComplaint = createAsyncThunk(
  "complaints/updateComplaint",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/approveComplaint-on-panel/by-id/${id}`,
        updateData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 7. Send Chat Support Message ────────────────────────────────────────────
// arg: { complaintId: "8-digit-id", messageData: { sender, receiver, content } }
export const sendChatMessage = createAsyncThunk(
  "complaints/sendChatMessage",
  async ({ complaintId, messageData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/do/chat-support/${complaintId}`,
        messageData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── 8. Delete Complaint (also deletes related chats) ────────────────────────
export const deleteComplaint = createAsyncThunk(
  "complaints/deleteComplaint",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(
        `/delete-a-particular/complaints/delete/by/id/${id}`
      );
      return id; // return id to remove from state
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    complaints: [],        // all complaints (admin list)
    userComplaints: [],    // complaints by a specific user
    filteredComplaints: [], // results from filter API
    selectedComplaint: null, // single complaint detail view
    loading: false,
    chatLoading: false,    // separate loader for chat
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null;
    },
    clearFilteredComplaints: (state) => {
      state.filteredComplaints = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ── createComplaint ──────────────────────────────
      .addCase(createComplaint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints.push(action.payload);
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchComplaints (Admin) ──────────────────────
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = normalizeComplaintList(action.payload);
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchComplaintsByUser ────────────────────────
      .addCase(fetchComplaintsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaintsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userComplaints = normalizeComplaintList(action.payload);
      })
      .addCase(fetchComplaintsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchComplaintById ───────────────────────────
      .addCase(fetchComplaintById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedComplaint = action.payload;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── filterComplaints ─────────────────────────────
      .addCase(filterComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredComplaints = normalizeComplaintList(action.payload);
      })
      .addCase(filterComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── updateComplaint ──────────────────────────────
      .addCase(updateComplaint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.loading = false;
        // sync updated complaint in the admin list
        const idx = state.complaints.findIndex(
          (c) => c._id === action.payload._id
        );
        if (idx !== -1) state.complaints[idx] = action.payload;
        // sync selected complaint if open
        if (state.selectedComplaint?._id === action.payload._id) {
          state.selectedComplaint = action.payload;
        }
      })
      .addCase(updateComplaint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── sendChatMessage ──────────────────────────────
      .addCase(sendChatMessage.pending, (state) => {
        state.chatLoading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        // action.payload is the new chat message object — append it to chats[]
        if (state.selectedComplaint) {
          if (!Array.isArray(state.selectedComplaint.chats)) {
            state.selectedComplaint.chats = [];
          }
          state.selectedComplaint.chats.push(action.payload);
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.error = action.payload;
      })

      // ── deleteComplaint ──────────────────────────────
      .addCase(deleteComplaint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = state.complaints.filter(
          (c) => c._id !== action.payload
        );
        if (state.selectedComplaint?._id === action.payload) {
          state.selectedComplaint = null;
        }
      })
      .addCase(deleteComplaint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedComplaint, clearFilteredComplaints } =
  complaintSlice.actions;

export default complaintSlice.reducer;
