import { prisma } from "@vync/shared";
import { CreatePortfolioProjectInput, UpdatePortfolioProjectInput } from "../../interfaces/freelancer/portfolio.interface";

export const PortfolioService = {
  createProject: async (userId: string, data: CreatePortfolioProjectInput) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerId = user.Freelancer.id;

    const newProject = await prisma.portfolioLink.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrls: data.imageUrls,
        githubUrl: data.githubUrl,
        liveUrl: data.liveUrl,
        freelancer: {
          connect: { id: freelancerId }
        }
      }
    });

    return newProject;
  },

  updateProject: async (userId: string, projectId: string, data: UpdatePortfolioProjectInput) => {
    // First verify the user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerId = user.Freelancer.id;

    // Check if the project exists and belongs to this freelancer
    const existingProject = await prisma.portfolioLink.findFirst({
      where: {
        id: projectId,
        freelancerId: freelancerId
      }
    });

    if (!existingProject) {
      throw new Error("Portfolio project not found or you don't have permission to update it");
    }

    // Update the project
    const updatedProject = await prisma.portfolioLink.update({
      where: { id: projectId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrls && { imageUrls: data.imageUrls }),
        ...(data.githubUrl !== undefined && { githubUrl: data.githubUrl }),
        ...(data.liveUrl !== undefined && { liveUrl: data.liveUrl })
      }
    });

    return updatedProject;
  },

  deleteProject: async (userId: string, projectId: string) => {
    // First verify the user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    const freelancerId = user.Freelancer.id;

    // Check if the project exists and belongs to this freelancer
    const existingProject = await prisma.portfolioLink.findFirst({
      where: {
        id: projectId,
        freelancerId: freelancerId
      }
    });

    if (!existingProject) {
      throw new Error("Portfolio project not found or you don't have permission to delete it");
    }

    // Delete the project
    await prisma.portfolioLink.delete({
      where: { id: projectId }
    });

    return { message: "Portfolio project deleted successfully" };
  }
}
