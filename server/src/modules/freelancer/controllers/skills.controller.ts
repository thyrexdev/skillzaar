import { Request, Response } from "express";
import { SkillsService } from "../services/skills.service";
import { UpdateSkillsValidator } from "../validators/skills.validator";

export const SkillsController = {
  updateSkills: async (req: Request, res: Response) => {
    try {
    const { userId } = req.params;

      const parsed = UpdateSkillsValidator.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updatedFreelancer = await SkillsService.updateServices(userId, parsed.data);

      return res.status(200).json({
        success: true,
        message: "Skills updated successfully",
        data: updatedFreelancer.skills,
      });

    } catch (error) {
      console.error("Error in updateSkills:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update skills",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
