export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}
