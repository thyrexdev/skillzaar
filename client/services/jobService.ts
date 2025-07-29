import apiClient from "@/lib/axios";

// Job related interfaces
export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count: {
    proposals: number;
  };
  proposals?: Proposal[];
}

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedDuration: number;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    skills: Array<{
      id: string;
      name: string;
    }>;
    _count: {
      contracts: number;
      reviews: number;
    };
  };
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

export interface CreateJobData {
  title: string;
  description: string;
  budget: number;
  category: string;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  budget?: number;
  category?: string;
}

export interface JobFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}

export interface ProposalFilters {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const jobService = {
  // Create a new job
  createJob: async (jobData: CreateJobData): Promise<{ message: string; job: Job }> => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },

  // Get client's jobs with pagination and filters
  getClientJobs: async (filters?: JobFilters): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);

    const response = await apiClient.get(`/jobs?${params.toString()}`);
    return {
      data: response.data.jobs,
      pagination: response.data.pagination
    };
  },

  // Get a specific job by ID
  getJobById: async (jobId: string): Promise<{ job: Job }> => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Update a job
  updateJob: async (jobId: string, updateData: UpdateJobData): Promise<{ message: string; job: Job }> => {
    const response = await apiClient.put(`/jobs/${jobId}`, updateData);
    return response.data;
  },

  // Delete a job
  deleteJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Get job statistics
  getJobStats: async (): Promise<{ stats: JobStats }> => {
    const response = await apiClient.get('/job-stats');
    return response.data;
  },

  // Get proposals for a specific job
  getJobProposals: async (jobId: string, filters?: ProposalFilters): Promise<PaginatedResponse<Proposal>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/jobs/${jobId}/proposals?${params.toString()}`);
    return {
      data: response.data.proposals,
      pagination: response.data.pagination
    };
  },

  // Update job status
  updateJobStatus: async (jobId: string, status: string): Promise<{ message: string; job: Job }> => {
    const response = await apiClient.patch(`/jobs/${jobId}/status`, { status });
    return response.data;
  }
};
