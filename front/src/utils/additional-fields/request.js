const getFrontAuthToken = () =>
  localStorage.getItem('authToken') || localStorage.getItem('rsToken') || ''

export const fetchWithLoggedInUserToken = async (url) => {
  const token = getFrontAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Failed to fetch additional fields: ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}
