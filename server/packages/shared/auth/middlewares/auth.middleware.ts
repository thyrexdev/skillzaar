import { Context, Next } from "hono";
import { getUserFromToken, type UserTokenPayload } from "../getUserFromToken";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Authorization header missing" }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return c.json({ message: "Token not provided" }, 401);
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", user as UserTokenPayload);
  await next();
};

export const getAuthUser = (c: Context): UserTokenPayload => {
  const user = c.get("user");
  if (!user) {
    throw new Error(
      "No authenticated user found in context. Did you forget authMiddleware?"
    );
  }
  return c.get("user");
};
