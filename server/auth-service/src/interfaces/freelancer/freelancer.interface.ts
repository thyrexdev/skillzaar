import { Freelancer, Skill, PortfolioLink, Proposal, Contract, Review, ExperienceLevel } from '@frevix/shared/src/generated/prisma';

// Request interfaces
export interface UpdateFreelancerProfileRequest {
  fullName?: string;
  hourlyRate?: number;
  experienceLevel?: ExperienceLevel;
  bio?: string;
  skills?: string[];
  portfolioLinks?: {
    url: string;
    description?: string;
  }[];
}

export interface GetFreelancerProfileParams {
  userId: string;
}

export interface GetFreelancerProposalsParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface GetFreelancerContractsParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetFreelancerStatsParams {
  userId: string;
}

export interface CreateProposalRequest {
  freelancerId: string;
  jobId: string;
  coverLetter: string;
  proposedRate: number;
}

export interface FreelancerSearchFilters {
  page: number;
  limit: number;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  minRating?: number;
  location?: string;
}

// Response interfaces
export interface FreelancerProfileResponse {
  freelancer: FreelancerWithDetails;
}

export interface FreelancerProposalsResponse {
  proposals: ProposalWithJob[];
  pagination: PaginationInfo;
}

export interface FreelancerContractsResponse {
  contracts: ContractWithDetails[];
  pagination: PaginationInfo;
}

export interface FreelancerStatsResponse {
  stats: FreelancerStats;
}

export interface UpdateFreelancerProfileResponse {
  message: string;
  freelancer: FreelancerWithDetails;
}

export interface CreateProposalResponse {
  message: string;
  proposal: Proposal;
}

export interface FreelancerSearchResponse {
  freelancers: FreelancerWithDetails[];
  pagination: PaginationInfo;
}

// Data transfer objects
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FreelancerStats {
  totalProposals: number;
  acceptedProposals: number;
  activeContracts: number;
  completedContracts: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

export interface UpdateProfileData {
  fullName?: string;
  hourlyRate?: number;
  experienceLevel?: ExperienceLevel;
  bio?: string;
  skills?: string[];
  portfolioLinks?: {
    url: string;
    description?: string;
  }[];
}

// Service return types
export interface FreelancerWithDetails extends Freelancer {
  skills: Skill[];
  portfolioLinks: PortfolioLink[];
  _count?: {
    contracts: number;
    reviews: number;
    proposals: number;
  };
}

export interface FreelancerWithUser extends Freelancer {
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

export interface ProposalWithJob extends Proposal {
  job: {
    id: string;
    title: string;
    description: string;
    budget: number;
    category: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    client: {
      id: string;
      fullName: string;
      companyName?: string;
    };
  };
}

export interface ContractWithDetails extends Contract {
  job: {
    id: string;
    title: string;
    description: string;
    budget: number;
    category: string;
  };
  client: {
    id: string;
    fullName: string;
    companyName?: string;
  };
}

export interface ReviewWithContract extends Review {
  contract: {
    id: string;
    job: {
      title: string;
    };
    client: {
      fullName: string;
      companyName?: string;
    };
  };
}

export interface FreelancerServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Aggregation interfaces
export interface ProposalAggregation {
  _count: {
    id: number;
  };
}

export interface ContractAggregation {
  _count: {
    id: number;
  };
  _sum: {
    job: {
      budget: number | null;
    };
  };
}

export interface ReviewAggregation {
  _avg: {
    rating: number | null;
  };
  _count: {
    id: number;
  };
}

// Error response interfaces
export interface FreelancerErrorResponse {
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

// Dashboard data interface
export interface FreelancerDashboardData {
  freelancer: FreelancerWithDetails;
  stats: FreelancerStats;
  recentProposals: ProposalWithJob[];
  activeContracts: ContractWithDetails[];
  recentReviews: ReviewWithContract[];
}

// Public profile interface (sanitized data for public viewing)
export interface PublicFreelancerProfile {
  fullName: string;
  bio: string | null;
  hourlyRate: number | null;
  experienceLevel: ExperienceLevel;
  skills: string[];
  portfolioLinks: {
    title: string;
    description: string | null;
    imageUrls: string[];
    liveUrl: string | null;
  }[];
  contractsCount: number;
  reviewsCount: number;
}

// Utility types for sorting and filtering
export type FreelancerSortField = 'fullName' | 'hourlyRate' | 'experienceLevel' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FreelancerSortOptions {
  field: FreelancerSortField;
  order: SortOrder;
}
