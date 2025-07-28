import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/api", (req, res) => {
  res.send("Skillzaar Backend is running 🚀");
});

// Add auth routes
router.use(authRoutes);

export default router;
