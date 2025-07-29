import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { OtpService } from "../services/otp.service";
import { OtpEmailType } from "../utils/sendOtpEmail";
import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response) => {
  try {
    const { user, token } = await AuthService.register(req.body);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { user, token } = await AuthService.login(req.body);
    res.status(200).json({ user, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};


export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {    
    // Validate email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await OtpService.createAndSendOtp(email, OtpEmailType.PASSWORD_RESET);
    res.json({ message: "Password reset OTP sent to email" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Verify OTP first
    await OtpService.verifyOtp(email, otp, OtpEmailType.PASSWORD_RESET);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
