// lib/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@/stores/useAuth";

const API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // مهم لو السيرفر بيرجع refresh token في cookies
});

// ======================
// Refresh Queue System
// ======================
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ======================
// Request Interceptor
// ======================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useAuth.getState();
    if (token && config.headers) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ======================
// Response Interceptor
// ======================
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const { logout, login, user } = useAuth.getState();

    // لو التوكن خلص (401) وما جربناش refresh قبل كده
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // لو فيه refresh شغال → نستنى التوكن الجديد
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token, user: refreshedUser } = res.data as {
          token: string;
          user?: any;
        };

        login(refreshedUser || user, token); // update store
        onTokenRefreshed(token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest); // retry
      } catch (err) {
        logout();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
