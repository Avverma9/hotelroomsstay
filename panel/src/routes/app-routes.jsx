import AdditionalData from '../pages/admin/additional-data'
import GSTManagement from '../pages/admin/gst-management'
import AdminHotelBookings from '../pages/admin/hotel-bookings'
import ManageLinks from '../pages/admin/manage-links'
import ManageRouteAccess from '../pages/admin/manage-route-access'
import CouponsPage from '../pages/admin/coupons'
import AllCarBookings from '../pages/admin/cab-bookings'
import BookHotel from '../pages/booking-creation/book-hotel'
import CreateUser from '../pages/booking-creation/create-user'
import FindUser from '../pages/booking-creation/find-user'
import BookingCreationHotels from '../pages/booking-creation/hotel'
import Dashboard from '../pages/dashboard/dashboard'
import Messenger from '../pages/messenger/messenger'
import Partner from '../pages/partner/partner'
import PanelBooking from '../pages/pms/panel-booking'
import PmsBooking from '../pages/pms/pms-booking'
import YourHotel from '../pages/pms/your-hotel'
import YourHotelDetails from '../pages/pms/your-hotel-details'
import Car from '../pages/tms/car'
import ViewCar from '../pages/tms/view-car'
import YourCars from '../pages/tms/your-car'
import CarsOwner from '../pages/tms/cars-owner'
import CarBookingsList from '../pages/tms/car-bookings-list'
import AllCars from '../pages/tms/all-cars'
import Tour from '../pages/tms/tour'
import TourBookingPage from '../pages/tms/tour-booking'
import TourForm from '../pages/tms/add-tour'
import MyTour from '../pages/tms/my-tour'
import ViewTour from '../pages/tms/view-tour'
import EditTour from '../pages/tms/edit-tour'
import TourBookingList from '../pages/tms/tour-booking-list'
import AllTourBookings from '../pages/admin/all-tour-bookings'
import TourListPage from '../pages/admin/tour-list'
import TourRequestPage from '../pages/tour-request'
import Complaints from '../pages/admin/complaints'
import CreateComplaint from '../components/complaints/create-complaint'
import ComplaintChat from '../components/complaints/complaint-chat'
import MyComplaints from '../pages/complaints/my-complaints'
import UserComplaintsPage from '../pages/complaints/user-complaints'
import Availability from '../pages/admin/availability'
import MonthlyPrice from '../pages/admin/monthlyPrice'
import AllHotels from '../pages/admin/hotel/all-hotel'
import HotelDetails from '../pages/admin/hotel/hotel-details'
import HotelEditPage from '../pages/admin/hotel/hotel-edit'
import BulkManagement from '../pages/admin/hotel/bulk-management'
import BulkCouponManage from '../pages/admin/hotel/bulk-coupon-manage'
import AddLocations from '../pages/admin/locations/add-locations'
import ListLocations from '../pages/admin/locations/list-locations'
import { AllUsers } from '../pages/admin/alluser/AllUser'
import AllCabs from '../pages/admin/all-cabs'
import PushNotification from '../pages/admin/push-notification'
import PmsCoupon from '../pages/pms/pms-coupon'
import AllReviews from '../pages/admin/all-reviews'

const EditCarPage = () => <Car isEditMode />

export const APP_ROUTES = [
  { path: '/dashboard', Component: Dashboard },
  { path: '/user', Component: Partner },
  { path: '/manage-menu', Component: ManageLinks },
  { path: '/admin/coupon', Component: CouponsPage },
  { path: '/additional-fields', Component: AdditionalData },
  { path: '/gst-management', Component: GSTManagement },
  { path: '/gst-page', Component: GSTManagement },
  { path: '/hotel-bookings', Component: AdminHotelBookings },
  { path: '/manage-route-access', Component: ManageRouteAccess },
  { path: '/messenger', Component: Messenger },
  { path: '/your-bookings', Component: PmsBooking },
  { path: '/panel-booking', Component: PanelBooking },
  { path: '/your-hotels', Component: YourHotel },
  { path: '/your-hotels/:id', Component: YourHotelDetails },
  { path: '/your-hotels/:id/edit', Component: HotelEditPage },
  { path: '/booking-creation', Component: FindUser },
  { path: '/booking-creation/hotels', Component: BookingCreationHotels },
  { path: '/booking-creation/create-user', Component: CreateUser },
  { path: '/booking-creation/book-hotel', Component: BookHotel },
  { path: '/add-a-car', Component: Car },
  { path: '/your-cars', Component: YourCars },
  { path: '/your-cars/:id', Component: ViewCar },
  { path: '/your-cars/:id/edit', Component: EditCarPage },
  { path: '/cars-owner', Component: CarsOwner },
  { path: '/travel-bookings', Component: CarBookingsList },
  { path: '/car-booking', Component: AllCars },
  { path: '/admin-travel-bookings', Component: AllCarBookings },
  { path: "/tours-book", Component: Tour },
  { path: "/tour-booking/:id", Component: TourBookingPage },
  { path: "/add-tour-data", Component: TourForm },
  { path: "/my-tour", Component: MyTour },
  { path: "/my-tour/:id", Component: ViewTour },
  { path: "/my-tour/:id/edit", Component: EditTour },
  { path: "/tour-bookings", Component: TourBookingList },
  { path: "/admin-tour/bookings", Component: AllTourBookings },
  { path: "/tour-list", Component: TourListPage },
  { path: "/tour-request", Component: TourRequestPage },
  { path: "/complaints", Component: Complaints },
  { path: "/complaint/create", Component: CreateComplaint },
  { path: "/complaint/chat/:id", Component: ComplaintChat },
  { path: "/your-complaints", Component: MyComplaints },
  { path: "/user-complaint", Component: UserComplaintsPage },
  { path: "/hotels/availability", Component: Availability },
  { path: "/hotels/monthly-price", Component: MonthlyPrice },
  { path: "/hotels/bulk-management", Component: BulkManagement },
  { path: "/hotels/bulk-coupon-manage", Component: BulkCouponManage },
  { path: "/travel-locations", Component: ListLocations },
  { path: "/travel-locations/add", Component: AddLocations },
  { path: "/hotels/", Component: AllHotels },
  { path: "/hotels/:id", Component: HotelDetails },
  { path: "/hotels/:id/edit", Component: HotelEditPage },
  { path: "/all-users", Component: AllUsers },
  { path: "/admin-cabs", Component: AllCabs },
  { path: "/apply-pms-coupon", Component: PmsCoupon },
  { path: "/admin-notification", Component: PushNotification },
  { path: "/all-hotel-reviews", Component: AllReviews },






]

export const APP_ROUTE_PATHS = [...new Set([...APP_ROUTES.map((route) => route.path), '/your-cars'])]
