import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const usePropertyTypes = () => {
  const [propertyTypes, setPropertyTypes] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-property-types`)
      .then((data) => setPropertyTypes(data))
      .catch(() => setPropertyTypes([]))
  }, [])

  return propertyTypes
}
