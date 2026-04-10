import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useHotelAmenities = () => {
    const [hotelAmenities, setHotelAmenities] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-amenities`)
            .then((data) => setHotelAmenities(data))
            .catch(() => setHotelAmenities([]))
    }, [])

    return hotelAmenities
}
