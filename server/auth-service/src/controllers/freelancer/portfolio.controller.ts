import { Context } from "hono";
import { PortfolioService } from "../../services/freelancer/portfolio.service";
import {
  CreatePortfolioValidator,
  UpdatePortfolioValidator
} from "../../validators/freelancer/portfolio.validator";
import { logger } from "@frevix/config/dist/logger";

export const PortfolioController = {
  createProject: async (c: Context) => {
    try {
      const userId = c.req.param("userId");
      const body = await c.req.json();
      const validatedData = CreatePortfolioValidator.parse(body);

      const newProject = await PortfolioService.createProject(userId, validatedData);

      return c.json(
        {
          success: true,
          message: "Portfolio project created successfully",
          data: newProject,
        },
        201
      );
    } catch (error: any) {
      logger.error("Error in createProject controller:", error);
      return c.json(
        {
          success: false,
          message: "Failed to create portfolio project",
          error: error?.message ?? "Unknown error",
        },
        500
      );
    }
  },

  updateProject: async (c: Context) => {
    try {
      const userId = c.req.param("userId");
      const projectId = c.req.param("projectId");
      const body = await c.req.json();
      const validatedData = UpdatePortfolioValidator.parse(body);

      const updatedProject = await PortfolioService.updateProject(userId, projectId, validatedData);

      return c.json({
        success: true,
        message: "Portfolio project updated successfully",
        data: updatedProject,
      });
    } catch (error: any) {
      logger.error("Error in updateProject controller:", error);
      const statusCode = error?.message?.includes("not found") ? 404 : 500;
      return c.json(
        {
          success: false,
          message: "Failed to update portfolio project",
          error: error?.message ?? "Unknown error",
        },
        statusCode
      );
    }
  },

  deleteProject: async (c: Context) => {
    try {
      const userId = c.req.param("userId");
      const projectId = c.req.param("projectId");

      const result = await PortfolioService.deleteProject(userId, projectId);

      return c.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error("Error in deleteProject controller:", error);
      const statusCode = error?.message?.includes("not found") ? 404 : 500;
      return c.json(
        {
          success: false,
          message: "Failed to delete portfolio project",
          error: error?.message ?? "Unknown error",
        },
        statusCode
      );
    }
  },
};
