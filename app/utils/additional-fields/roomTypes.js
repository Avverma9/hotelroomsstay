import { useEffect, useState } from "react"
import api from "../api"
export const useRoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([])
    useEffect(() => {
        api.get("/additional/get-room")
            .then((res) => setRoomTypes(res.data))
            .catch(() => setRoomTypes([]))
    }, [])

    return roomTypes
}