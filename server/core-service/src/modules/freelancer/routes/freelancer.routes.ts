import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { SkillsController } from "../controllers/skills.controller";
import { PortfolioController } from "../controllers/portfolio.controller";
import { protect } from "../../../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.get("/public-profile/:userId", ProfileController.getPublicProfile);

// Apply authentication middleware to all protected routes
router.use(protect);

// Freelancer profile routes
router.get("/profile/:userId", ProfileController.getProfile);
router.put("/profile/:userId", ProfileController.updateProfile);

// Skills management routes
router.put("/skills/:userId", SkillsController.updateSkills);

// Portfolio management routes
router.post("/portfolio/:userId", PortfolioController.createProject);
router.put("/portfolio/:userId/:projectId", PortfolioController.updateProject);
router.delete("/portfolio/:userId/:projectId", PortfolioController.deleteProject);

export default router;
