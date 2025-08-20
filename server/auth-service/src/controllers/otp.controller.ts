import { Context } from 'hono';
import { OtpService } from '../services/otp.service';
import { OtpEmailType } from '../utils/sendOtpEmail';
import { logger } from '@vync/config';


export const requestOtp = async (c: Context) => {
  const { email, type } = await c.req.json();

  try {
    await OtpService.createAndSendOtp(email, type as OtpEmailType);
    return c.json({ message: 'OTP sent successfully.' }, 200);
  } catch (error: any) {
    logger.error(`Request OTP error: ${error.message}`);
    return c.json({ error: error.message }, 400);
  }
};

export const verifyOtp = async (c: Context) => {
  const { email, otp, type } = await c.req.json();

  try {
    await OtpService.verifyOtp(email, otp, type as OtpEmailType);
    return c.json({ message: 'OTP verified successfully.' }, 200);
  } catch (error: any) {
    logger.error(`Verify OTP error: ${error.message}`);
    return c.json({ error: error.message }, 400);
  }
};
