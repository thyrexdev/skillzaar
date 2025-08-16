import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { message } from 'antd';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

interface RequestConfig extends AxiosRequestConfig {
  skipErrorNotification?: boolean;
  retryAttempts?: number;
}

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:5004';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Create Axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for auth token
  instance.interceptors.request.use(
    (config) => {
      // Get auth token from store
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RequestConfig & { _retry?: boolean };

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
        });
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        // Clear auth store
        const authStore = useAuthStore.getState();
        authStore.logout();
        
        // Redirect to login (client-side only)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        message.error('Access denied. You do not have permission to perform this action.');
        return Promise.reject(error);
      }

      // Handle network errors with retry
      if (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNABORTED' ||
        !error.response
      ) {
        const retryAttempts = originalRequest.retryAttempts || MAX_RETRY_ATTEMPTS;
        
        if (!originalRequest._retry && retryAttempts > 0) {
          originalRequest._retry = true;
          originalRequest.retryAttempts = retryAttempts - 1;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          console.log(`🔄 Retrying request... Attempts left: ${retryAttempts - 1}`);
          return instance(originalRequest);
        }
      }

      // Show error notification unless skipped
      if (!originalRequest?.skipErrorNotification) {
        const errorMessage = getErrorMessage(error);
        message.error(errorMessage);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Helper functions
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const state = useAuthStore.getState();
    return state.token;
  }
  return null;
};

const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    return data.error || data.message || 'An error occurred';
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  return error.message || 'An unexpected error occurred';
};

// Build query parameters helper
const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'dateRange' && typeof value === 'object' && value.start && value.end) {
        // Handle date ranges - backend expects startDate and endDate
        searchParams.append('startDate', value.start.toISOString());
        searchParams.append('endDate', value.end.toISOString());
      } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        // Handle ranges
        searchParams.append(`${key}Min`, value.min.toString());
        searchParams.append(`${key}Max`, value.max.toString());
      } else if (Array.isArray(value)) {
        // Handle arrays
        value.forEach(item => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
};

// Create the main API client instance
const apiClient = createAxiosInstance();

// API wrapper functions
class AdminApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // Generic request methods
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Specialized methods for common patterns
  async getWithParams<T>(url: string, params: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    const queryString = buildQueryParams(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.get<T>(fullUrl, config);
  }

  async getPaginated<T>(
    url: string, 
    page: number = 1, 
    limit: number = 20, 
    filters: Record<string, any> = {},
    config?: RequestConfig
  ): Promise<ApiResponse<{ items: T[]; total: number; totalPages: number; currentPage: number }>> {
    const params = { page, limit, ...filters };
    return this.getWithParams(url, params, config);
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, additionalData?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return response.data;
  }

  // Download file method
  async downloadFile(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { skipErrorNotification: true });
      return response.success;
    } catch {
      return false;
    }
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Get current base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }

  // Update base URL
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  // Get timeout value
  getTimeout(): number {
    return this.client.defaults.timeout || 0;
  }

  // Set timeout value
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();

// Export utilities
export { buildQueryParams, getErrorMessage };

// Export types
export type { ApiResponse, RequestConfig };

// Default export
export default adminApi;
