import {
  SignJWT,
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyResult,
} from "jose";
import { env, logger } from "@vync/config";

const secret = env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET not set");

const JWT_SECRET = new TextEncoder().encode(secret);
const HEADER = { alg: "HS256" } as const;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

const createInvalidTokenError = (message = "Invalid or expired token") => {
  const err = new Error(message);
  err.name = "InvalidTokenError";
  return err;
};

export const signToken = async (payload: JWTPayload): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader(HEADER)
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRES_IN}`)
    .sign(JWT_SECRET);
};

export const verifyToken = async <T extends JWTPayload>(
  token: string
): Promise<T | null> => {
  try {
    const { payload }: JWTVerifyResult = await jwtVerify(token, JWT_SECRET);
    return payload as T;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      logger.error(`JWT expired: ${error.message}`);
      throw createInvalidTokenError("Token has expired");
    }
    if (error instanceof errors.JWTInvalid) {
      logger.error(`JWT invalid: ${error.message}`);
      throw createInvalidTokenError("Token is invalid");
    }
    logger.error("JWT verification error", { error });
    throw createInvalidTokenError();
  }
};
