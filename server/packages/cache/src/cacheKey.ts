export const CacheKeys = {
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  USER_REFRESH_TOKEN: (userId: string) => `user:refresh:${userId}`,
  AUTH_ATTEMPTS: (ip: string) => `auth:attempts:${ip}`, // للتعامل مع brute force
  // ضيف أي مفاتيح ثابتة هنا
} as const
