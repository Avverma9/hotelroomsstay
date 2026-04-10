import { useEffect, useState } from "react"
import api from "../api"
export const useBedTypes = () => {
    const [bedTypes, setBedTypes] = useState([])
    useEffect(() => {
        api.get("/additional/get-bed")
            .then((res) => setBedTypes(res.data))
            .catch(() => setBedTypes([]))
    }, [])

    return bedTypes
}