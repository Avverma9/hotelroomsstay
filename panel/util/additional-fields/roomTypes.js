import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useRoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-room`)
      .then((data) => setRoomTypes(data))
      .catch(() => setRoomTypes([]))
  }, [])

  return roomTypes
}
