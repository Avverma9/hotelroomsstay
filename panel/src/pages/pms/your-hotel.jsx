import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '../../../redux/slices/authSlice'
import AllHotels from '../admin/hotel/all-hotel'

function YourHotel() {
  const { user } = useSelector(selectAuth)

  const fixedFilters = useMemo(
    () => ({
      hotelOwnerEmail: user?.email || '',
    }),
    [user?.email],
  )

  return (
    <AllHotels
      title="Your Hotels"
      subtitle="Logged-in user ke owner email ke basis par mapped hotels."
      enableMasterFilter={false}
      fixedFilters={fixedFilters}
      detailBasePath="/your-hotels"
    />
  )
}

export default YourHotel
