import { Hono } from "hono";
import { ProfileController } from "../controllers/freelancer/profile.controller";
import { SkillsController } from "../controllers/freelancer/skills.controller";
import { PortfolioController } from "../controllers/freelancer/portfolio.controller";
import { authMiddleware } from "@vync/shared/src";

const freelancerRoutes = new Hono();

freelancerRoutes.get("/public-profile/:userId", ProfileController.getPublicProfile);

freelancerRoutes.use("*", authMiddleware);

freelancerRoutes.get("/profile/:userId", ProfileController.getProfile);
freelancerRoutes.put("/profile/:userId", ProfileController.updateProfile);

freelancerRoutes.put("/skills/:userId", SkillsController.updateSkills);

freelancerRoutes.post("/portfolio/:userId", PortfolioController.createProject);
freelancerRoutes.put("/portfolio/:userId/:projectId", PortfolioController.updateProject);
freelancerRoutes.delete("/portfolio/:userId/:projectId", PortfolioController.deleteProject);

export default freelancerRoutes;