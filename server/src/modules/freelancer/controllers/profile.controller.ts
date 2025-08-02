import { Request, Response } from "express";
import { ProfileService } from "../services/profile.service";
import { UpdateFreelancerProfileValidator } from "../validators/profile.validator";

export const ProfileController = {
  // ✅ Get current freelancer profile
  getProfile: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const profile = await ProfileService.getFreelancerByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "Freelancer profile retrieved successfully",
        data: profile,
      });
    } catch (error) {
      console.error("Error in getProfile:", error);
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // ✅ Update freelancer profile
  updateProfile: async (req: Request, res: Response) => {
    try {
    const { userId } = req.params;

      // Validate request body
      const parsed = UpdateFreelancerProfileValidator.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updatedProfile = await ProfileService.updateFreelancerProfile(
        userId,
        parsed.data
      );

      return res.status(200).json({
        success: true,
        message: "Freelancer profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update freelancer profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // ✅ Get public freelancer profile (no authentication required)
  getPublicProfile: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const publicProfile = await ProfileService.getPublicFreelancerProfile(userId);

      return res.status(200).json({
        success: true,
        message: "Public freelancer profile retrieved successfully",
        data: publicProfile,
      });
    } catch (error) {
      console.error("Error in getPublicProfile:", error);
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
