import { Router } from "express";
import {
  getClientProfile,
  updateClientProfile,
  getClientStats,
  getClientJobs,
} from "../controllers/client.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

// Client profile routes
router.get("/profile/:userId", getClientProfile);
router.put("/profile/:userId", updateClientProfile);

// Client statistics
router.get("/stats/:userId", getClientStats);

// Client jobs
router.get("/jobs/:userId", getClientJobs);

export default router;
