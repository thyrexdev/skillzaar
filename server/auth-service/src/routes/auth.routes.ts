import { Hono } from 'hono';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';

const authRoutes = new Hono();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes;
