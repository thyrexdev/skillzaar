import { Hono } from 'hono';
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { 
  rateLimitMiddleware, 
  loginRateLimitMiddleware, 
  rateLimitConfigs 
} from '../middleware/rateLimiting.middleware';

const authRoutes = new Hono();

// Apply rate limiting to authentication endpoints
authRoutes.post("/register", rateLimitMiddleware(rateLimitConfigs.register), register);
authRoutes.post("/login", loginRateLimitMiddleware(rateLimitConfigs.login), login);
authRoutes.post("/logout", logout); // No rate limiting needed for logout
authRoutes.post("/forgot-password", rateLimitMiddleware(rateLimitConfigs.passwordReset), forgotPassword);
authRoutes.post("/reset-password", rateLimitMiddleware(rateLimitConfigs.passwordReset), resetPassword);

export default authRoutes;
