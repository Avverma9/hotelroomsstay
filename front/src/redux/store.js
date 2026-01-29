import { configureStore } from '@reduxjs/toolkit';
import serverReducer from './slices/serverSlice';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import hotelReducer from './slices/hotelSlice';
import gstReducer from './slices/gstSlice';
import hotelSearchReducer from './slices/hotelSearchSlice';
import bookingReducer from './slices/bookingSlice';
import profileReducer from './slices/profileSlice';
import reviewReducer from './slices/reviewSlice';
import partnerReducer from './slices/partnerSlice';
import complaintReducer from './slices/complaintSlice';
import travelReducer from './slices/travelSlice';
import mailReducer from './slices/mailSlice';
import carReducer from './slices/car';

const store = configureStore({
  reducer: {
    server: serverReducer,
    auth: authReducer,
    location: locationReducer,
    hotel: hotelReducer,
    gst: gstReducer,
    hotelSearch: hotelSearchReducer,
    booking: bookingReducer,
    profile: profileReducer,
    review: reviewReducer,
    partner: partnerReducer,
    complaint: complaintReducer,
    travel: travelReducer,
    mail: mailReducer,
    car: carReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if needed
        ignoredActions: ['server/setServerStatus'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
