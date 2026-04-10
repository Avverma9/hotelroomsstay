import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useBedTypes = () => {
  const [bedTypes, setBedTypes] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-bed`)
      .then((data) => setBedTypes(data))
      .catch(() => setBedTypes([]))
  }, [])

  return bedTypes
}
