import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useHotelCategories = () => {
  const [hotelCategories, setHotelCategories] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-hotel-categories`)
      .then((data) => setHotelCategories(data))
      .catch(() => setHotelCategories([]))
  }, [])

  return hotelCategories
}
