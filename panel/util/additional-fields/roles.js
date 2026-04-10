import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useRoles = () => {
  const [roles, setRoles] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/roles`)
      .then((data) => setRoles(data))
      .catch(() => setRoles([]))
  }, [])

  return roles
}
