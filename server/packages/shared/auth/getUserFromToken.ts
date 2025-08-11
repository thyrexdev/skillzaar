import { verifyToken } from "./jwt";

export const getUserFromToken = async (token: string) => {
  try {
    const user = await verifyToken<{ userId: string; role: string }>(token);
    return user;
  } catch {
    return null;
  }
};
