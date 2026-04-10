import { useEffect, useState } from 'react'
import { baseURL } from '../util'
import { fetchWithLoggedInUserToken } from './request'

export const useTourThemes = () => {
  const [tourThemes, setTourThemes] = useState([])

  useEffect(() => {
    fetchWithLoggedInUserToken(`${baseURL}/additional/get-tour-themes`)
      .then((data) => setTourThemes(data))
      .catch(() => setTourThemes([]))
  }, [])

  return tourThemes
}
