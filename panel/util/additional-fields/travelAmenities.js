import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useTravelAmenities = () => {
  const [travelAmenities, setTravelAmenities] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get/travel-amenities`)
      .then((data) => setTravelAmenities(data))
      .catch(() => setTravelAmenities([]))
  }, [])

  return travelAmenities
}
