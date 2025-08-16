import { prisma } from "@vync/shared";
import { Freelancer } from "@vync/shared/src/generated/prisma";
import { UpdateProfileData, PublicFreelancerProfile } from "../../interfaces/freelancer/freelancer.interface";

export const ProfileService = {
  getFreelancerByUserId: async (userId: string): Promise<Freelancer> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true },
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    return user.Freelancer;
  },

  updateFreelancerProfile: async (
    userId: string,
    updateData: UpdateProfileData
  ): Promise<Freelancer> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true },
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("freelancer not found");
    }

    const updatedProfile = await prisma.freelancer.update({
      where: { id: user.Freelancer.id },
      data: {
        bio: updateData.bio,
        hourlyRate: updateData.hourlyRate,
        experienceLevel: updateData.experienceLevel,
      },
    });
    return updatedProfile;
  },

  getPublicFreelancerProfile: async (userId: string): Promise<PublicFreelancerProfile> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Freelancer: {
          include: {
            skills: true,
            portfolioLinks: true,
            _count: {
              select: {
                contracts: true,
                reviews: true
              }
            }
          }
        }
      }
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("Freelancer not found");
    }

    // Return only public data
    return {
      fullName: user.name,
      bio: user.Freelancer.bio,
      hourlyRate: user.Freelancer.hourlyRate,
      experienceLevel: user.Freelancer.experienceLevel,
      skills: user.Freelancer.skills.map((skill: { name: string }) => skill.name),
      portfolioLinks: user.Freelancer.portfolioLinks.map((link: { title: string; description: string; imageUrls: string[]; liveUrl: string }) => ({
        title: link.title,
        description: link.description,
        imageUrls: link.imageUrls,
        liveUrl: link.liveUrl
      })),
      contractsCount: user.Freelancer._count.contracts,
      reviewsCount: user.Freelancer._count.reviews
    };
  }
};
