import apiClient from "@/lib/axios";

// Client profile interfaces based on backend schema
export interface ClientProfile {
  id: string;
  userId: string;
  fullName: string;
  companyName?: string;
  bio?: string;
  website?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientStats {
  totalJobs: number;
  totalSpent: number;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
  _count?: {
    proposals: number;
  };
}

export interface UpdateClientProfileData {
  name?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  phone?: string;
}

export const clientService = {
  // Get client profile by user ID
  getClientProfile: async (userId: string): Promise<{ client: ClientProfile }> => {
    const response = await apiClient.get(`/client/profile/${userId}`);
    return response.data;
  },

  // Get client statistics
  getClientStats: async (userId: string): Promise<{ stats: ClientStats }> => {
    const response = await apiClient.get(`/client/stats/${userId}`);
    return response.data;
  },

  // Get client's jobs
  getClientJobs: async (userId: string): Promise<{ jobs: Job[] }> => {
    const response = await apiClient.get(`/client/jobs/${userId}`);
    return response.data;
  },

  // Update client profile
  updateClientProfile: async (userId: string, profileData: UpdateClientProfileData): Promise<{ message: string; client: ClientProfile }> => {
    const response = await apiClient.put(`/client/profile/${userId}`, profileData);
    return response.data;
  },
};
