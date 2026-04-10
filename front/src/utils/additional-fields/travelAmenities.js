import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useTravelAmenities = () => {
    const [travelAmenities, setTravelAmenities] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get/travel-amenities`)
            .then((data) => setTravelAmenities(data))
            .catch(() => setTravelAmenities([]))
    }, [])

    return travelAmenities
}
