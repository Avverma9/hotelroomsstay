import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiInterceptor';

const deriveHotelIdentifier = (hotel, index = 0) => {
  const candidates = [
    hotel?.hotelId,
    hotel?._id,
    hotel?.id,
    hotel?.hotelCode,
    hotel?.slug,
    hotel?.guid,
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    if (typeof candidate === 'string' && candidate.trim().length) {
      return candidate.trim();
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return `hotel-${index + 1}`;
};

const normalizeSearchResults = (payload) => {
  if (!Array.isArray(payload)) return [];
  const seen = new Set();
  return payload.reduce((acc, rawHotel, index) => {
    if (!rawHotel) return acc;
    const derivedId = deriveHotelIdentifier(rawHotel, index);
    if (seen.has(derivedId)) return acc;
    seen.add(derivedId);
    acc.push({
      ...rawHotel,
      hotelId: rawHotel.hotelId ?? derivedId,
      _id: rawHotel._id ?? rawHotel.hotelId ?? derivedId,
    });
    return acc;
  }, []);
};

// Async thunk to search hotels
export const searchHotels = createAsyncThunk(
  'hotelSearch/searchHotels',
  async (searchParams = {}, { rejectWithValue }) => {
    try {
      const { destination, checkIn, checkOut, rooms, guests, page = 1, limit = 10 } = searchParams;
      
      // Build query string - matching API format
      const params = new URLSearchParams();
      if (destination) params.append('search', destination); // API expects 'search' not 'destination'
      if (checkIn) params.append('checkInDate', checkIn); // API expects 'checkInDate'
      if (checkOut) params.append('checkOutDate', checkOut); // API expects 'checkOutDate'
      if (rooms) params.append('countRooms', rooms); // API expects 'countRooms'
      if (guests) params.append('guests', guests);
      params.append('page', page);
      params.append('limit', limit);
      
      const queryString = params.toString();
      const endpoint = `/hotels/filters?${queryString}`;
      
      const response = await apiClient.get(endpoint);
      return response.data.data || response.data; // Handle both {data: [...]} and direct array
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch hotels');
    }
  }
);

const hotelSearchSlice = createSlice({
  name: 'hotelSearch',
  initialState: {
    hotels: [],
    loading: false,
    error: null,
    filters: {
      minPrice: 400,
      maxPrice: 10000,
      starRating: '',
      amenities: [],
      type: [],
      bedTypes: [],
      propertyType: [],
    },
    sortBy: 'popularity', // popularity, priceLowToHigh, priceHighToLow, rating
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        minPrice: 400,
        maxPrice: 10000,
        starRating: '',
        amenities: [],
        type: [],
        bedTypes: [],
        propertyType: [],
      };
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearSearchError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = normalizeSearchResults(action.payload);
      })
      .addCase(searchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hotels = [];
      });
  },
});

export const { setFilters, resetFilters, setSortBy, clearSearchError } = hotelSearchSlice.actions;
export default hotelSearchSlice.reducer;
