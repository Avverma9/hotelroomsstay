import { combineReducers } from '@reduxjs/toolkit'
import adminAdditionalReducer from './slices/admin/additional'
import adminCouponReducer from './slices/admin/coupon'
import adminGstReducer from './slices/admin/gst'
import adminRouteReducer from './slices/admin/route'
import adminSidebarReducer from './slices/admin/sidebar'
import authReducer from './slices/authSlice'
import dashboardReducer from './slices/dashboard'
import globalLoaderReducer from './slices/globalLoader'
import messengerReducer from './slices/messenger'
import partnerReducer from './slices/partner'
import pmsReducer from './slices/pms/bookings'
import userReducer from './slices/user'
import hotelReducer from './slices/admin/hotel'
import carReducer from './slices/tms/travel/car'
import tourReducer from './slices/tms/travel/tour/tour'
import complaintReducer from './slices/complaintSlice'
import availabilityReducer from './slices/availability'
import monthlyReducer from './slices/admin/monthly'
import bulkReducer from './slices/admin/bulk'
import locationsReducer from './slices/admin/locations'
import notificationReducer from './slices/admin/notification'

const rootReducer = combineReducers({
  adminAdditional: adminAdditionalReducer,
  adminCoupon: adminCouponReducer,
  adminGst: adminGstReducer,
  adminRoute: adminRouteReducer,
  adminSidebar: adminSidebarReducer,
  auth: authReducer,
  dashboard: dashboardReducer,
  globalLoader: globalLoaderReducer,
  messenger: messengerReducer,
  partner: partnerReducer,
  pms: pmsReducer,
  user: userReducer,
  hotel: hotelReducer,
  car: carReducer,
  tour: tourReducer,
  complaints: complaintReducer,
  availability: availabilityReducer,
  monthly: monthlyReducer,
  bulk: bulkReducer,
  locations: locationsReducer,
  notification: notificationReducer,
})

export default rootReducer
