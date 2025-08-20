// Export all admin API functions
export * from './admin-api';

// Export verification-specific API functions
export * from './verification-api';

// Re-export the main axios client
export { adminApi } from '@/lib/axios';
