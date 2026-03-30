import { useSelector } from 'react-redux'
import PmsBooking from '../pms/pms-booking'
import { selectAuth } from '../../../redux/slices/authSlice'

const ADMIN_BOOKING_FILTERS = [
  { key: 'bookingId', placeholder: 'Filter by Booking ID' },
  { key: 'userMobile', placeholder: 'Filter by User Mobile' },
  { key: 'hotelEmail', placeholder: 'Filter by Hotel Email' },
  { key: 'hotelCity', placeholder: 'Filter by Hotel City' },
  { key: 'couponCode', placeholder: 'Filter by Coupon Code' },
  { key: 'createdBy', placeholder: 'Filter by Created By' },
]

function AdminHotelBookings() {
  const { user } = useSelector(selectAuth)
  const normalizedRole = String(user?.role || '').toLowerCase()
  const isPrivilegedUser = normalizedRole === 'admin' || normalizedRole === 'developer'

  return (
    <PmsBooking
      title="Hotel Bookings"
      subtitle={
        isPrivilegedUser
          ? 'Admin view for all bookings across all hotels and sources.'
          : 'Showing bookings mapped to your hotel access only.'
      }
      fetchMode={isPrivilegedUser ? 'query' : 'partner'}
      extraFilterFields={isPrivilegedUser ? ADMIN_BOOKING_FILTERS : []}
      propertyFilterMode={isPrivilegedUser ? 'text' : 'select'}
      showPartnerIdentity={!isPrivilegedUser}
      hideGuestContactForNonPrivileged={false}
      allowAdvancedEditForPrivileged
    />
  )
}

export default AdminHotelBookings
