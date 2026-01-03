import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Access token хранится только в памяти
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Флаг для предотвращения бесконечного цикла refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // отправляем cookie (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: добавляем access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = response.data?.data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
};

// Response interceptor: при 401 пробуем refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Если 401 и это не retry и не сам refresh запрос
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      // Если уже идёт refresh — ждём его
      if (isRefreshing && refreshPromise) {
        const newToken = await refreshPromise;
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        return Promise.reject(error);
      }

      isRefreshing = true;
      refreshPromise = refreshAccessToken();

      try {
        const newToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (newToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
