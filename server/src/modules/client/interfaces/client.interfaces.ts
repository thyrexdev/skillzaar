import { Client, Job, JobStatus } from '../../../generated/prisma';

// Request interfaces
export interface UpdateClientProfileRequest {
  name?: string;
  avatar?: string | null;
  bio?: string | null;
  company?: string | null;
  website?: string | null;
  location?: string | null;
  phone?: string | null;
}

export interface GetClientProfileParams {
  userId: string;
}

export interface GetClientJobsParams {
  userId: string;
}

export interface GetClientStatsParams {
  userId: string;
}

// Response interfaces
export interface ClientProfileResponse {
  client: Client;
}

export interface ClientJobsResponse {
  jobs: Job[];
}

export interface ClientStatsResponse {
  stats: ClientStats;
}

export interface UpdateClientProfileResponse {
  message: string;
  client: Client;
}

// Data transfer objects
export interface ClientStats {
  totalJobs: number;
  totalSpent: number;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  phone?: string;
}

// Service return types
export interface ClientWithJobs extends Client {
  jobs: Job[];
}

export interface ClientServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Extended Client interface with user data
export interface ClientWithUser extends Client {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Job aggregation interface
export interface JobAggregation {
  _sum: {
    budget: number | null;
  };
}

// Error response interface
export interface ClientErrorResponse {
  error: string;
  details?: any;
}

// Validation error interface
export interface ValidationErrorResponse {
  error: string;
  details: Array<{
    code: string;
    expected?: string;
    received?: string;
    path: Array<string | number>;
    message: string;
  }>;
}
