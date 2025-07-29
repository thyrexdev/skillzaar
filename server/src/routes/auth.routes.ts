import { Router } from "express";
import { register, login, forgotPassword, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

export default router;
