import { Router } from "express";
// Import routes from module indexes for cleaner, centralized imports
import { authRoutes } from "../modules/auth";
import { otpRoutes } from "../modules/otp";
import { jobRoutes } from "../modules/job";
import { clientRoutes } from "../modules/client";
import { freelancerRoutes } from "../modules/freelancer";

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

// Add freelancer routes
router.use("/freelancer", freelancerRoutes);

export default router;
