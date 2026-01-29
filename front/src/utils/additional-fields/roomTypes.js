import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
export const useRoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([])
    useEffect(() => {
        fetch(`${baseUrl}/additional/get-room`)
            .then((res) => res.json())
            .then((data) => setRoomTypes(data))
    }, [])

    return roomTypes
}