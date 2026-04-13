import axios from 'axios';
import baseURL from './baseURL';

const LOGIN_PATH = '/login';
const PUBLIC_PATH_PREFIXES = [
  '/health',
  '/auth/me',
  '/signIn',
  '/Signup',
  '/signIn/google',
  '/send-otp',
  '/verify-otp',
  '/mail/send-otp',
  '/mail/verify-otp',
  '/get/offers/main/hotels',
  '/get-all/travel/location',
  '/hotels/filters',
  '/monthly-set-room-price/get/by/',
  '/hotels/get-by-id/',
  '/gst/get-single-gst',
  '/get/all/users-filtered/booking/by',
  '/getReviews/hotelId',
  '/travel/get-all-car',
  '/travel/get-a-car/',
  '/travel/filter-car/by-query',
  '/travel/get-seat-data/by-id/',
  '/search-tours/from-to',
  '/tours/visiting-places',
  '/get-tour-list',
  '/sort-tour/by-price',
  '/sort-tour/by-duration',
  '/sort-tour/by-themes',
  '/sort-tour/by-order',
  '/get-tour/',
];

const clearAuthStorage = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isSignedIn');
  localStorage.removeItem('rsUserId');
  localStorage.removeItem('rsToken');
  localStorage.removeItem('rsRefreshToken');
  localStorage.removeItem('roomsstayUserEmail');
  localStorage.removeItem('rsUserMobile');
  localStorage.removeItem('rsUserName');
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
};

const getRequestPath = (url = '') => {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) return '';

  const withoutOrigin = rawUrl.startsWith(baseURL)
    ? rawUrl.slice(baseURL.length)
    : rawUrl;

  const normalized = withoutOrigin.startsWith('/') ? withoutOrigin : `/${withoutOrigin}`;
  return normalized.split('?')[0].split('#')[0];
};

const isPublicRequest = (url) => {
  const path = getRequestPath(url);
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const isProtectedRequest = (url) => !isPublicRequest(url);

const shouldRedirectToLogin = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || '').toLowerCase();

  if (status === 401 || status === 403) {
    return true;
  }

  return (
    message.includes('no token provided') ||
    message.includes('access denied') ||
    message.includes('invalid token') ||
    message.includes('jwt malformed') ||
    message.includes('jwt expired')
  );
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 100000, // 100 seconds timeout
  withCredentials: false, // Set to false to avoid CORS issues during development
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Refresh token queue management
let _isRefreshing = false;
let _refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => _refreshSubscribers.push(cb);
const onRefreshed = (token) => {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
};

// Store reference to update server status
let updateServerStatus = null;
let updateLoaderStatus = null;

// Set the callback function to update Redux store
export const setServerStatusCallback = (callback) => {
  updateServerStatus = callback;
};

export const setLoaderCallback = (callback) => {
  updateLoaderStatus = callback;
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Show loader
    if (updateLoaderStatus) updateLoaderStatus(true);

    // Get token from localStorage if available
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isProtectedRequest(config.url)) {
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(new axios.Cancel('Missing auth token for protected request'));
    }

    // Per-endpoint timeout tuning:
    // Booking calls can legitimately take longer; avoid throwing a global "server timeout" signal.
    if (typeof config.url === 'string' && config.url.startsWith('/booking/')) {
      config.timeout = 30000;
    }

    // Log request for debugging (remove in production)
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    // Hide loader on request error
    if (updateLoaderStatus) updateLoaderStatus(false);
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Hide loader
    if (updateLoaderStatus) updateLoaderStatus(false);

    // Server is connected - update status
    if (updateServerStatus) {
      updateServerStatus(true, null);
    }

    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    // Hide loader
    if (updateLoaderStatus) updateLoaderStatus(false);

    // Handle different error scenarios
    if (error.code === 'ECONNABORTED') {
      // Timeout error
      console.error('⏰ Request Timeout:', error.config.url);
      // NOTE: A single request timing out doesn't always mean the server is down.
      // (especially for longer operations like booking). We keep the global
      // server status unchanged to avoid showing misleading timeout UI.
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`❌ API Error: ${status}`, data);

      // Handle specific status codes
      switch (status) {
        case 401: {
          const refreshToken = localStorage.getItem('rsRefreshToken');
          if (!refreshToken || error.config?._retry) {
            clearAuthStorage();
            if (updateServerStatus) {
              updateServerStatus(true, 'Session expired. Please login again.');
            }
            redirectToLogin();
          } else if (_isRefreshing) {
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((newToken) => {
                if (newToken) {
                  const retryConfig = { ...error.config, _retry: true };
                  retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${newToken}` };
                  resolve(apiClient(retryConfig));
                } else {
                  reject(error);
                }
              });
            });
          } else {
            _isRefreshing = true;
            axios.post(`${baseURL}/auth/refresh`, { refreshToken })
              .then((res) => {
                const newToken = res.data.rsToken;
                const newRefreshToken = res.data.refreshToken;
                localStorage.setItem('authToken', newToken);
                localStorage.setItem('rsRefreshToken', newRefreshToken);
                _isRefreshing = false;
                onRefreshed(newToken);
                const retryConfig = { ...error.config, _retry: true };
                retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${newToken}` };
                return apiClient(retryConfig);
              })
              .catch(() => {
                _isRefreshing = false;
                onRefreshed(null);
                clearAuthStorage();
                redirectToLogin();
              });
          }
          break;
        }
        
        case 403:
          if (shouldRedirectToLogin(error) && !error.config?._retry) {
            const refreshToken = localStorage.getItem('rsRefreshToken');
            if (refreshToken && !_isRefreshing) {
              _isRefreshing = true;
              return axios.post(`${baseURL}/auth/refresh`, { refreshToken })
                .then((res) => {
                  const newToken = res.data.rsToken;
                  const newRefreshToken = res.data.refreshToken;
                  localStorage.setItem('authToken', newToken);
                  localStorage.setItem('rsRefreshToken', newRefreshToken);
                  _isRefreshing = false;
                  onRefreshed(newToken);
                  const retryConfig = { ...error.config, _retry: true };
                  retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${newToken}` };
                  return apiClient(retryConfig);
                })
                .catch(() => {
                  _isRefreshing = false;
                  onRefreshed(null);
                  clearAuthStorage();
                  redirectToLogin();
                  return Promise.reject(error);
                });
            } else {
              clearAuthStorage();
            }
          }
          if (updateServerStatus) {
            updateServerStatus(true, 'Access denied. You do not have permission.');
          }
          break;
        
        case 404:
          // Not Found
          console.error('Resource not found:', error.config.url);
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          if (updateServerStatus) {
            updateServerStatus(false, `Server error (${status}). Please try again later.`);
          }
          break;
        
        default:
          if (updateServerStatus) {
            updateServerStatus(true, data?.message || 'An error occurred.');
          }
      }
    } else if (error.request) {
      // Request made but no response received - Server is down
      console.error('❌ Network Error: No response from server');
      if (updateServerStatus) {
        updateServerStatus(false, 'Cannot connect to server. Please check your connection.');
      }
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
      if (updateServerStatus) {
        updateServerStatus(false, error.message);
      }
    }

    if (shouldRedirectToLogin(error) && isProtectedRequest(error.config?.url) && error.config?._retry) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

// Health check function to regularly ping the server
export const checkServerHealth = async () => {
  try {
    // Use a simple GET request without authentication
    await axios.get(`${baseURL}/health`, {
      timeout: 5000,
      withCredentials: false,
    });
    
    if (updateServerStatus) {
      updateServerStatus(true, null);
    }
    
    return true;
  } catch {
    // Silently fail if health endpoint doesn't exist
    console.warn('Health check failed (this is normal if backend /health endpoint is not configured)');
    
    // Don't update server status as down just because health endpoint is missing
    // if (updateServerStatus) {
    //   updateServerStatus(false, 'Server is not responding.');
    // }
    return false;
  }
};

// Start periodic health checks
let healthCheckInterval = null;

export const startHealthCheck = (intervalMs = 30000) => {
  // Stop existing interval if any
  stopHealthCheck();
  
  // Initial check
  checkServerHealth();
  
  // Set up periodic checks (default: every 30 seconds)
  healthCheckInterval = setInterval(() => {
    checkServerHealth();
  }, intervalMs);
  
  console.log(`🏥 Health check started (every ${intervalMs / 1000}s)`);
};

export const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🏥 Health check stopped');
  }
};

export default apiClient;
