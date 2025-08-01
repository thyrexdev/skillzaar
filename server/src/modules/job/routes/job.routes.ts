import { Router } from "express";
import {
  createJob,
  getClientJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobStats,
  getJobProposals,
  updateJobStatus,
} from "../controllers/job.controller";
import { protect } from "../../../middlewares/auth.middleware";

const router = Router();

router.post("/jobs", protect, createJob);
router.get("/jobs", protect, getClientJobs);
router.get("/jobs/:jobId", protect, getJobById);
router.put("/jobs/:jobId", protect, updateJob);
router.delete("/jobs/:jobId", protect, deleteJob);
router.get("/jobs/:jobId/proposals", protect, getJobProposals);
router.get("/job-stats", protect, getJobStats);
router.patch("/jobs/:jobId/status", protect, updateJobStatus);

export default router;
