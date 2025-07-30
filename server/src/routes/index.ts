import { Router } from "express";
import authRoutes from "./auth.routes";
import otpRoutes from "./otp.routes";
import jobRoutes from "./job.routes";
import clientRoutes from "./client.routes";

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
