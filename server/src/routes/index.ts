import { Router } from "express";
// Import routes from module indexes for cleaner, centralized imports
import { authRoutes } from "../modules/auth";
import { otpRoutes } from "../modules/otp";
import { jobRoutes } from "../modules/job";
import { clientRoutes } from "../modules/client";

const router = Router();

router.get("/api", (req, res) => {
  res.send("Skillzaar Backend is running 🚀");
});

// Add auth routes
router.use(authRoutes);

// Add OTP routes
router.use(otpRoutes);

// Add job routes
router.use(jobRoutes);

// Add client routes
router.use("/client", clientRoutes);

export default router;
