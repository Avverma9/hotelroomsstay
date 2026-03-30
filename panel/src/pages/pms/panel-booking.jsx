import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '../../../redux/slices/authSlice'
import PmsBooking from './pms-booking'

const PANEL_EXTRA_FILTERS = [
  { key: 'email', placeholder: 'Filter by User Email', label: 'User Email' },
]

function PanelBooking() {
  const { user } = useSelector(selectAuth)

  const panelFixedFilters = useMemo(
    () => ({
      bookingSource: 'Panel',
      ...(user?.email ? { createdBy: user.email } : {}),
    }),
    [user?.email],
  )

  return (
    <PmsBooking
      title="Panel Bookings"
      fetchMode="query"
      fixedFilters={panelFixedFilters}
      extraFilterFields={PANEL_EXTRA_FILTERS}
      hideSourceFilter
      hideGuestContactForNonPrivileged
      showCreatedBy
    />
  )
}

export default PanelBooking
