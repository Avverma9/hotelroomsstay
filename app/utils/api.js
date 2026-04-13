import axios from "axios";
import { baseURL as url } from "./baseUrl";
import { clearAuthSession, getRefreshToken, getToken, saveAuthSession } from "./credentials";

const api = axios.create({
  baseURL: url,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

export const getAccessToken = () => getToken();

// Refresh token queue management
let _isRefreshing = false;
let _refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => _refreshSubscribers.push(cb);
const onRefreshed = (token) => {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
};

api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (!isAuthError || error.config?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await getRefreshToken().catch(() => null);
    if (!refreshToken) {
      await clearAuthSession();
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            const retryConfig = { ...error.config, _retry: true };
            retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${newToken}` };
            resolve(api(retryConfig));
          } else {
            reject(error);
          }
        });
      });
    }

    _isRefreshing = true;
    try {
      const res = await axios.post(`${url}/auth/refresh`, { refreshToken });
      const newToken = res.data.rsToken;
      const newRefreshToken = res.data.refreshToken;

      await saveAuthSession({ token: newToken, refreshToken: newRefreshToken });
      _isRefreshing = false;
      onRefreshed(newToken);

      const retryConfig = { ...error.config, _retry: true };
      retryConfig.headers = { ...retryConfig.headers, Authorization: `Bearer ${newToken}` };
      return api(retryConfig);
    } catch (refreshError) {
      _isRefreshing = false;
      onRefreshed(null);
      await clearAuthSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
