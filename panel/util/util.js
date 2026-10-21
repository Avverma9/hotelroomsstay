// Local panel development uses the local backend; deployed builds use the live API.
// Override either environment with VITE_API_URL when needed.
export const baseURL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:5000' : 'https://hotelroomsstay.com/api'
)

export const SESSION_STORAGE_KEY = 'hrsadmin_session'
export const LOCAL_STORAGE_KEY = 'hrsadmin_session'
export const HEALTH_POLL_INTERVAL = 60000
