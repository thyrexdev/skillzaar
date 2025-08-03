import { Request, Response } from "express";
import { PortfolioService } from "../services/portfolio.service";
import { CreatePortfolioValidator, UpdatePortfolioValidator } from "../validators/portfolio.validator";

export const PortfolioController = {
  createProject: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const validatedData = CreatePortfolioValidator.parse(req.body);

      const newProject = await PortfolioService.createProject(
        userId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: "Portfolio project created successfully",
        data: newProject,
      });
    } catch (error) {
      console.error("Error in createProject controller:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create portfolio project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  updateProject: async (req: Request, res: Response) => {
    try {
      const { userId, projectId } = req.params;
      const validatedData = UpdatePortfolioValidator.parse(req.body);

      const updatedProject = await PortfolioService.updateProject(
        userId,
        projectId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        message: "Portfolio project updated successfully",
        data: updatedProject,
      });
    } catch (error) {
      console.error("Error in updateProject controller:", error);
      const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: "Failed to update portfolio project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deleteProject: async (req: Request, res: Response) => {
    try {
      const { userId, projectId } = req.params;

      const result = await PortfolioService.deleteProject(userId, projectId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteProject controller:", error);
      const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: "Failed to delete portfolio project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
