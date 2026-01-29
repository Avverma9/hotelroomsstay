import apiClient from '../utils/apiInterceptor';

// Auth API Services
export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiClient.post('/api/auth/refresh');
    return response.data;
  },
};

// Hotel/Rooms API Services
export const hotelAPI = {
  // Get all rooms
  getAllRooms: async (params = {}) => {
    const response = await apiClient.get('/api/rooms', { params });
    return response.data;
  },

  // Get room by ID
  getRoomById: async (roomId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}`);
    return response.data;
  },

  // Create room (admin only)
  createRoom: async (roomData) => {
    const response = await apiClient.post('/api/rooms', roomData);
    return response.data;
  },

  // Update room (admin only)
  updateRoom: async (roomId, roomData) => {
    const response = await apiClient.put(`/api/rooms/${roomId}`, roomData);
    return response.data;
  },

  // Delete room (admin only)
  deleteRoom: async (roomId) => {
    const response = await apiClient.delete(`/api/rooms/${roomId}`);
    return response.data;
  },

  // Search rooms
  searchRooms: async (searchParams) => {
    const response = await apiClient.get('/api/rooms/search', { params: searchParams });
    return response.data;
  },
};

// Booking API Services
export const bookingAPI = {
  // Create booking
  createBooking: async (bookingData) => {
    const response = await apiClient.post('/api/bookings', bookingData);
    return response.data;
  },

  // Get user bookings
  getUserBookings: async () => {
    const response = await apiClient.get('/api/bookings/user');
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await apiClient.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const response = await apiClient.delete(`/api/bookings/${bookingId}`);
    return response.data;
  },

  // Update booking
  updateBooking: async (bookingId, bookingData) => {
    const response = await apiClient.put(`/api/bookings/${bookingId}`, bookingData);
    return response.data;
  },
};

// User Profile API Services
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/api/users/profile', profileData);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (formData) => {
    const response = await apiClient.post('/api/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/api/users/password', passwordData);
    return response.data;
  },
};

// Generic API wrapper for custom endpoints
export const customAPI = {
  get: async (endpoint, config = {}) => {
    const response = await apiClient.get(endpoint, config);
    return response.data;
  },

  post: async (endpoint, data, config = {}) => {
    const response = await apiClient.post(endpoint, data, config);
    return response.data;
  },

  put: async (endpoint, data, config = {}) => {
    const response = await apiClient.put(endpoint, data, config);
    return response.data;
  },

  delete: async (endpoint, config = {}) => {
    const response = await apiClient.delete(endpoint, config);
    return response.data;
  },

  patch: async (endpoint, data, config = {}) => {
    const response = await apiClient.patch(endpoint, data, config);
    return response.data;
  },
};

export default apiClient;
