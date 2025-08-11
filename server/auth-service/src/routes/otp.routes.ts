import { Hono } from 'hono';
import { requestOtp, verifyOtp } from '../controllers/otp.controller';

const otpRoutes = new Hono();

otpRoutes.post("/request", requestOtp);
otpRoutes.post("/verify", verifyOtp);

export default otpRoutes;
