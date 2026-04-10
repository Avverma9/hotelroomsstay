import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useHotelCategories = () => {
    const [hotelCategories, setHotelCategories] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-hotel-categories`)
            .then((data) => setHotelCategories(data))
            .catch(() => setHotelCategories([]))
    }, [])

    return hotelCategories
}
