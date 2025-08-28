import { verifyToken } from "./jwt";

export type UserTokenPayload = {
  userId: string;
  role: string;
};

export const getUserFromToken = async (token: string) => {
  try {
    return await verifyToken<UserTokenPayload>(token);
  } catch {
    return null;
  }
};
