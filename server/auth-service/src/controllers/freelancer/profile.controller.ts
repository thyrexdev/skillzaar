import { Context } from "hono";
import { ProfileService } from "../../services/freelancer/profile.service";
import { UpdateFreelancerProfileValidator } from "../../validators/freelancer/profile.validator";
import { logger } from "@vync/config";

export const ProfileController = {
  // ✅ Get current freelancer profile
  getProfile: async (c: Context) => {
    try {
      const userId = c.req.param("userId");

      const profile = await ProfileService.getFreelancerByUserId(userId);

      return c.json({
        success: true,
        message: "Freelancer profile retrieved successfully",
        data: profile,
      }, 200);
    } catch (error: any) {
      logger.error("Error in getProfile:", error);
      return c.json({
        success: false,
        message: "Freelancer not found",
        error: error?.message ?? "Unknown error",
      }, 404);
    }
  },

  // ✅ Update freelancer profile
  updateProfile: async (c: Context) => {
    try {
      const userId = c.req.param("userId");
      const body = await c.req.json();

      const parsed = UpdateFreelancerProfileValidator.safeParse(body);

      if (!parsed.success) {
        return c.json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        }, 400);
      }

      const updatedProfile = await ProfileService.updateFreelancerProfile(
        userId,
        parsed.data
      );

      return c.json({
        success: true,
        message: "Freelancer profile updated successfully",
        data: updatedProfile,
      }, 200);
    } catch (error: any) {
      logger.error("Error in updateProfile:", error);
      return c.json({
        success: false,
        message: "Failed to update freelancer profile",
        error: error?.message ?? "Unknown error",
      }, 500);
    }
  },

  // ✅ Get public freelancer profile (no auth)
  getPublicProfile: async (c: Context) => {
    try {
      const userId = c.req.param("userId");

      const publicProfile = await ProfileService.getPublicFreelancerProfile(userId);

      return c.json({
        success: true,
        message: "Public freelancer profile retrieved successfully",
        data: publicProfile,
      }, 200);
    } catch (error: any) {
      logger.error("Error in getPublicProfile:", error);
      return c.json({
        success: false,
        message: "Freelancer not found",
        error: error?.message ?? "Unknown error",
      }, 404);
    }
  },
};
