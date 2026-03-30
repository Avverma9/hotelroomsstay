import axios from 'axios'
import store from '../redux/store'
import { requestFinished, requestStarted } from '../redux/slices/globalLoader'
import { baseURL, HEALTH_POLL_INTERVAL, SESSION_STORAGE_KEY } from '../util/util'

export const SERVER_STATUS_EVENT = 'hrsadmin:server-status'

const getSavedSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const savedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!savedSession) {
    return null
  }

  try {
    return JSON.parse(savedSession)
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

const getStoredToken = () => {
  const savedSession = getSavedSession()
  const state = store.getState()
  const authToken = state?.auth?.token
  const sessionToken =
    savedSession?.token ||
    savedSession?.sessionData?.token ||
    savedSession?.rsToken ||
    savedSession?.sessionData?.rsToken

  const rawToken = authToken || sessionToken || ''

  if (!rawToken) {
    return ''
  }

  return String(rawToken).replace(/^Bearer\s+/i, '').trim()
}

const emitServerStatus = (hasServerError) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(SERVER_STATUS_EVENT, {
      detail: { hasServerError },
    }),
  )
}

const api = axios.create({
  baseURL,
  timeout: 15000,
})

// Consecutive failure counter — server offline sirf tab dikhega jab
// lagaataar 2+ failures aayein, ek momentary error se nahi
let _consecutiveServerErrors = 0
const FAILURES_BEFORE_OFFLINE = 2

const shouldTrackRequest = (config) => config?.url !== '/health' && !config?.skipGlobalLoader

api.interceptors.request.use(
  (config) => {
    if (shouldTrackRequest(config)) {
      store.dispatch(requestStarted())
      config._trackedByGlobalLoader = true
    }

    const token = getStoredToken()

    if (token) {
      config.headers.Authorization = config?.useRawAuthorization ? token : `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => {
    if (response.config?._trackedByGlobalLoader) {
      store.dispatch(requestFinished())
    }

    // Successful response — server clearly online hai
    _consecutiveServerErrors = 0
    emitServerStatus(false)
    return response
  },
  (error) => {
    if (error.config?._trackedByGlobalLoader) {
      store.dispatch(requestFinished())
    }

    const isServerDown =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status >= 500

    if (isServerDown) {
      _consecutiveServerErrors += 1
      // Sirf tab offline dikhao jab LAGAATAAR failures aayein
      if (_consecutiveServerErrors >= FAILURES_BEFORE_OFFLINE) {
        emitServerStatus(true)
      }
    } else {
      // 4xx errors (auth, validation) — server chalu hai, reset karo
      _consecutiveServerErrors = 0
      emitServerStatus(false)
    }

    return Promise.reject(error)
  },
)

export const startHealthPolling = (onStatusChange) => {
  let _healthFailures = 0
  let _recoveryTimer = null
  const HEALTH_FAILURES_BEFORE_OFFLINE = 2
  const RECOVERY_CONFIRM_DELAY = 3000  // 3s baad confirm karo ki server wapas aaya

  const checkHealth = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      _healthFailures += 1
      if (_healthFailures >= HEALTH_FAILURES_BEFORE_OFFLINE) {
        onStatusChange(true)
      }
      return
    }

    try {
      await api.get('/health', { skipGlobalLoader: true, timeout: 8000 })

      _healthFailures = 0

      // Recovery: thoda wait karo confirm karne ke liye, jhat se online na karo
      if (_recoveryTimer) clearTimeout(_recoveryTimer)
      _recoveryTimer = setTimeout(() => {
        onStatusChange(false)
      }, RECOVERY_CONFIRM_DELAY)
    } catch {
      _healthFailures += 1
      if (_recoveryTimer) clearTimeout(_recoveryTimer)

      // Sirf lagaataar failures pe offline dikhao
      if (_healthFailures >= HEALTH_FAILURES_BEFORE_OFFLINE) {
        onStatusChange(true)
      }
    }
  }

  // Startup pe delay karo — server boot ho raha ho sakta hai
  const startTimer = setTimeout(checkHealth, 2000)
  const intervalId = window.setInterval(checkHealth, HEALTH_POLL_INTERVAL)

  return () => {
    clearTimeout(startTimer)
    clearTimeout(_recoveryTimer)
    window.clearInterval(intervalId)
  }
}

export default api
