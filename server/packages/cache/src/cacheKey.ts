export const CacheKeys = {
  // Auth & User
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  USER_REFRESH_TOKEN: (userId: string) => `user:refresh:${userId}`,
  AUTH_ATTEMPTS: (ip: string) => `auth:attempts:${ip}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,

  // Jobs
  JOB: (jobId: string) => `job:${jobId}`,
  CLIENT_JOBS_LIST: (clientId: string) => `client:jobs:list:${clientId}`,
  CLIENT_JOB: (clientId: string, jobId: string) => `client:jobs:${clientId}:${jobId}`,

  // Browse jobs for freelancers (with filters)
  BROWSE_JOBS: (filters: Record<string, any>) => {
    const keyParts = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `jobs:list:${keyParts}`;
  },

  // Featured jobs / Market stats
  FEATURED_JOBS: () => `jobs:featured`,
  JOB_MARKET_STATS: () => `jobs:market:stats`
} as const;

