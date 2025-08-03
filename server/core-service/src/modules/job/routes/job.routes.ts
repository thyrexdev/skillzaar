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
  browseJobs,
  getJobMarketStats,
  getJobByIdPublic,
  getFeaturedJobs
} from "../controllers/job.controller";
import { protect } from "../../../middlewares/auth.middleware";

const router = Router();

// Public
router.get("/jobs/browse", browseJobs);
router.get("/jobs/featured", getFeaturedJobs);
router.get("/jobs/market-stats", getJobMarketStats);
router.get("/jobs/:jobId/public", getJobByIdPublic);

// Protected
router.post("/jobs", protect, createJob);
router.get("/jobs", protect, getClientJobs);
router.get("/jobs/:jobId", protect, getJobById);
router.put("/jobs/:jobId", protect, updateJob);
router.patch("/jobs/:jobId/status", protect, updateJobStatus);
router.delete("/jobs/:jobId", protect, deleteJob);
router.get("/jobs/:jobId/proposals", protect, getJobProposals);
router.get("/job-stats", protect, getJobStats);

export default router;
