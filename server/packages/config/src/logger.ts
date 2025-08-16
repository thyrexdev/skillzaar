import { env } from "./env";

export const logger = {
  info: (...args: any[]) => {
    if (env.NODE_ENV !== "production") {
      console.log("[INFO]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (env.NODE_ENV !== "production") {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args); // يطبع دايمًا
  },
};

