import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useBedTypes = () => {
    const [bedTypes, setBedTypes] = useState([])
    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-bed`)
            .then((data) => setBedTypes(data))
            .catch(() => setBedTypes([]))
    }, [])

    return bedTypes
}
