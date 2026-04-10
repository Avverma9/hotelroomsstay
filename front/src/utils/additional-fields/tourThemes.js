import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useTourThemes = () => {
    const [tourThemes, setTourThemes] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-tour-themes`)
            .then((data) => setTourThemes(data))
            .catch(() => setTourThemes([]))
    }, [])

    return tourThemes
}
