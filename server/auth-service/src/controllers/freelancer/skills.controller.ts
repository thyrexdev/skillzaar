import { Context } from "hono";
import { SkillsService } from "../../services/freelancer/skills.service";
import { UpdateSkillsValidator } from "../../validators/freelancer/skills.validator";
import { logger } from "@vync/config";

export const SkillsController = {
  updateSkills: async (c: Context) => {
    try {
      const userId = c.req.param("userId");
      const body = await c.req.json();

      const parsed = UpdateSkillsValidator.safeParse(body);

      if (!parsed.success) {
        return c.json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        }, 400);
      }

      const updatedFreelancer = await SkillsService.updateServices(userId, parsed.data);

      return c.json({
        success: true,
        message: "Skills updated successfully",
        data: updatedFreelancer.skills,
      }, 200);
    } catch (error: any) {
      logger.error("Error in updateSkills:", error);
      return c.json({
        success: false,
        message: "Failed to update skills",
        error: error?.message ?? "Unknown error",
      }, 500);
    }
  }
};
