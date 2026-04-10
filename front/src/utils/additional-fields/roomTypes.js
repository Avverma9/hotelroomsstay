import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useRoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([])
    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-room`)
            .then((data) => setRoomTypes(data))
            .catch(() => setRoomTypes([]))
    }, [])

    return roomTypes
}
