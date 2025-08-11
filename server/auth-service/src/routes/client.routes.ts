import { Hono } from "hono";
import {
  getClientProfile,
  getClientJobs,
  updateClientProfile,
  getClientStats
} from "../controllers/client.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const clientRoutes = new Hono();

clientRoutes.use("*", authMiddleware);

clientRoutes.get("/:userId", getClientProfile);
clientRoutes.get("/:userId/jobs", getClientJobs);
clientRoutes.put("/:userId", updateClientProfile);
clientRoutes.get("/:userId/stats", getClientStats);

export default clientRoutes;
