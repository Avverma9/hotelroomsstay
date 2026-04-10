import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const usePropertyTypes = () => {
    const [propertyTypes, setPropertyTypes] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/get-property-types`)
            .then((data) => setPropertyTypes(data))
            .catch(() => setPropertyTypes([]))
    }, [])

    return propertyTypes
}
