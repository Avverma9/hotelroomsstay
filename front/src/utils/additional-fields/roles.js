import { useEffect, useState } from "react"
import baseUrl from '../baseURL'
import { fetchWithLoggedInUserToken } from './request'

export const useRoles = () => {
    const [roles, setRoles] = useState([])

    useEffect(() => {
        fetchWithLoggedInUserToken(`${baseUrl}/additional/roles`)
            .then((data) => setRoles(data))
            .catch(() => setRoles([]))
    }, [])

    return roles
}
