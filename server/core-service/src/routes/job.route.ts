import { Hono } from "hono";
import {
  createJob,
  getClientJobs,
  getJobById,
  getJobByIdPublic,
  updateJob,
  deleteJob,
  getJobStats,
  getJobProposals,
  updateJobStatus,
  browseJobs,
  getJobMarketStats,
  getFeaturedJobs,
} from "../controllers/job.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const jobRoutes = new Hono();

// 🟢 Public routes
jobRoutes.get("/browse", browseJobs);
jobRoutes.get("/featured", getFeaturedJobs);
jobRoutes.get("/market-stats", getJobMarketStats);
jobRoutes.get("/public/:jobId", getJobByIdPublic);

// 🔒 Authenticated routes (require JWT)
jobRoutes.use("*", authMiddleware);

jobRoutes.post("/post", createJob);
jobRoutes.get("/", getClientJobs);
jobRoutes.get("/:jobId", getJobById);
jobRoutes.put("/:jobId", updateJob);
jobRoutes.delete("/:jobId", deleteJob);
jobRoutes.get("/:jobId/proposals", getJobProposals);
jobRoutes.patch("/:jobId/status", updateJobStatus);
jobRoutes.get("/stats/client", getJobStats);

export default jobRoutes;
