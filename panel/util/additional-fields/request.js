import { LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from '../util'

const getPanelAuthToken = () => {
  const authTokenFromStorage = () => {
    const savedSession =
      window.localStorage.getItem(LOCAL_STORAGE_KEY) ||
      window.sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!savedSession) return ''

    try {
      const parsedSession = JSON.parse(savedSession)
      return (
        parsedSession?.token ||
        parsedSession?.sessionData?.token ||
        parsedSession?.rsToken ||
        parsedSession?.sessionData?.rsToken ||
        ''
      )
    } catch {
      return ''
    }
  }

  if (typeof window === 'undefined') return ''
  return authTokenFromStorage()
}

export const fetchWithLoggedInUserToken = async (url) => {
  const token = getPanelAuthToken()
  const headers = token ? { Authorization: `Bearer ${String(token).replace(/^Bearer\s+/i, '').trim()}` } : {}

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Failed to fetch additional fields: ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}
