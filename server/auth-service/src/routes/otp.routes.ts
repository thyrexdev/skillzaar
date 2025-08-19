import { Hono } from 'hono';
import { requestOtp, verifyOtp } from '../controllers/otp.controller';
import { rateLimitMiddleware, rateLimitConfigs } from '../middleware/rateLimiting.middleware';

const otpRoutes = new Hono();

// Apply rate limiting to OTP endpoints
otpRoutes.post("/request", rateLimitMiddleware(rateLimitConfigs.otp), requestOtp);
otpRoutes.post("/verify", rateLimitMiddleware(rateLimitConfigs.otpVerify), verifyOtp);

export default otpRoutes;
