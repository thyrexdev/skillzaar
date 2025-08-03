import { Job, JobStatus, Proposal } from "../../../generated/prisma";

// Request interfaces
export interface CreateJobRequest {
  title: string;
  description: string;
  budget: number;
  category: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  budget?: number;
  category?: string;
}

export interface GetClientJobsFilters {
  page: number;
  limit: number;
  status?: JobStatus;
  category?: string;
}

export interface GetJobProposalsFilters {
  page: number;
  limit: number;
}

// Response interfaces
export interface CreateJobResponse {
  message: string;
  job: Job;
}

export interface ClientJobsResponse {
  jobs: Job[];
  pagination: PaginationInfo;
}

export interface JobByIdResponse {
  job: JobWithProposals;
}

export interface UpdateJobResponse {
  message: string;
  job: Job;
}

export interface DeleteJobResponse {
  message: string;
}

export interface JobProposalsResponse {
  proposals: ProposalWithFreelancer[];
  pagination: PaginationInfo;
}

export interface JobStatsResponse {
  stats: JobStats;
}

export interface UpdateJobStatusResponse {
  message: string;
  job: Job;
}

// Data transfer objects
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  canceledJobs: number;
  totalProposals: number;
  totalSpent: number;
  averageBudget: number;
}

export interface JobWithProposals extends Job {
  proposals: Proposal[];
  _count: {
    proposals: number;
  };
}

export interface ProposalWithFreelancer extends Proposal {
  freelancer: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    _count: {
      contracts: number;
      reviews: number;
    };
  };
}

// Browse jobs interfaces (for freelancers)
export interface BrowseJobsFilters {
  page: number;
  limit: number;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: JobStatus;
  search?: string;
}

export interface BrowseJobsResponse {
  jobs: JobWithClient[];
  pagination: PaginationInfo;
}

export interface JobWithClient extends Job {
  client: {
    id: string;
    fullName: string;
    companyName?: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count: {
    proposals: number;
  };
}

export interface JobMarketStatsResponse {
  stats: JobMarketStats;
}

export interface JobMarketStats {
  totalOpenJobs: number;
  totalJobsThisWeek: number;
  averageBudget: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

// Error response interface
export interface JobErrorResponse {
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
