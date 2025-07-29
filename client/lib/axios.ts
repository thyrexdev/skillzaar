import axios from 'axios';
import { useAuth } from '@/stores/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store
    const token = useAuth.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      useAuth.getState().logout();
      
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
