import { prisma } from "../../../config/prisma";
import { Freelancer, Skill } from "../../../generated/prisma";
import { UpdateSkillsData } from "../interfaces/skills.interfaces";

type FreelancerWithSkills = Freelancer & {
  skills: Skill[];
};

export const SkillsService = {
  updateServices: async (
    userId: string,
    updateData: UpdateSkillsData
  ): Promise<FreelancerWithSkills> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Freelancer: true },
    });

    if (!user || user.role !== "FREELANCER" || !user.Freelancer) {
      throw new Error("freelancer not found");
    }

    const freelancerId = user.Freelancer.id;

    const existingSkills = await prisma.skill.findMany({
      where: {
        name: { in: updateData.skills },
      },
    });

    const existingNames = existingSkills.map((skill) => skill.name);
    const newSkillNames = updateData.skills.filter(
      (name) => !existingNames.includes(name)
    );

    const newSkills = await Promise.all(
      newSkillNames.map((name) =>
        prisma.skill.create({
          data: { name },
        })
      )
    );

    const allSkills = [...existingSkills, ...newSkills];

    const updatedSkills = await prisma.freelancer.update({
      where: { id: freelancerId },
      data: {
        skills: {
          set: allSkills.map(skill => ({ id: skill.id }))
        }
      },
      include: {
        skills: true
      }
    });

    return updatedSkills

  },
};
