import { Context } from 'hono';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { OtpEmailType } from '../utils/sendOtpEmail';
import { prisma } from '@frevix/shared';
import bcrypt from 'bcryptjs';
import { logger } from '@frevix/config/dist/logger';

export const register = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { user, token } = await AuthService.register(body);
    return c.json({ user, token }, 201);
  } catch (err: any) {
    logger.error(`Register error: ${err.message}`);
    return c.json({ error: err.message }, 400);
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { user, token } = await AuthService.login(body);
    return c.json({ user, token }, 200);
  } catch (err: any) {
    logger.error(`Login error: ${err.message}`);
    return c.json({ error: err.message }, 401);
  }
};

export const forgotPassword = async (c: Context) => {
  const { email } = await c.req.json();

  try {
    // Validate email is provided
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    await OtpService.createAndSendOtp(email, OtpEmailType.PASSWORD_RESET);
    return c.json({ message: 'Password reset OTP sent to email' });
  } catch (error: any) {
    logger.error(`Forgot password error: ${error.message}`);
    return c.json({ error: error.message }, 400);
  }
};

export const resetPassword = async (c: Context) => {
  const { email, otp, newPassword } = await c.req.json();

  try {
    // Verify OTP first
    await OtpService.verifyOtp(email, otp, OtpEmailType.PASSWORD_RESET);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return c.json({ message: 'User not found' }, 404);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return c.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    logger.error(`Reset password error: ${error.message}`);
    return c.json({ error: error.message }, 400);
  }
};
