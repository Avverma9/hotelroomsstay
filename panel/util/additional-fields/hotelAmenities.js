import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useHotelAmenities = () => {
  const [hotelAmenities, setHotelAmenities] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-amenities`)
      .then((data) => setHotelAmenities(data))
      .catch(() => setHotelAmenities([]))
  }, [])

  return hotelAmenities
}
