import { Request, Response } from "express";
import { OtpService } from "../services/otp.service";
import { OtpEmailType } from "../../../utils/sendOtpEmail";
import {
  RequestOtpRequest,
  VerifyOtpRequest,
  OtpResponse,
  OtpVerifyResponse,
  OtpErrorResponse
} from "../interfaces/otp.interfaces";

export const requestOtp = async (
  req: Request<{}, OtpResponse | OtpErrorResponse, RequestOtpRequest>,
  res: Response<OtpResponse | OtpErrorResponse>
) => {
  const { email, type } = req.body;

  try {
    await OtpService.createAndSendOtp(email, type as OtpEmailType);
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyOtp = async (
  req: Request<{}, OtpVerifyResponse | OtpErrorResponse, VerifyOtpRequest>,
  res: Response<OtpVerifyResponse | OtpErrorResponse>
) => {
  const { email, otp, type } = req.body;

  try {
    await OtpService.verifyOtp(email, otp, type as OtpEmailType);
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

