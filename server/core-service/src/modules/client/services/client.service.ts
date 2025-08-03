import { prisma } from "../../../config/prisma";
import { Client, Job, JobStatus } from "../../../generated/prisma";
import {
  UpdateProfileData,
  ClientStats,
  ClientWithJobs
} from "../interfaces/client.interfaces";

export const ClientService = {
  getClientByUserId: async (userId: string): Promise<Client> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true },
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }
    
    return user.Client;
  },

  getClientJobs: async (userId: string): Promise<Job[]> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true },
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const client = await prisma.client.findUnique({
      where: {
        id: user.Client.id,
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return client.jobs;
  },

  updateClientProfile: async (
    userId: string,
    updateData: UpdateProfileData
  ): Promise<Client> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true },
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const updatedClient = await prisma.client.update({
      where: { id: user.Client.id },
      data: {
        fullName: updateData.name,
        bio: updateData.bio,
        companyName: updateData.company,
        website: updateData.website,
        location: updateData.location,
      },
    });
    return updatedClient;
  },

  getClientStats: async (userId: string): Promise<ClientStats> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Client: true },
    });

    if (!user || user.role !== "CLIENT" || !user.Client) {
      throw new Error("Client not found");
    }

    const clientId = user.Client.id;

    const [totalJobs, totalSpent] = await Promise.all([
      prisma.job.count({
        where: { clientId },
      }),
      prisma.job.aggregate({
        where: {
          clientId,
          status: JobStatus.COMPLETED,
        },
        _sum: {
          budget: true,
        },
      }),
    ]);

    return {
      totalJobs,
      totalSpent: totalSpent._sum.budget || 0,
    };
  },
};
