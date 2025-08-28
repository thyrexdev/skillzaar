import { createClient, type RedisClientType } from "redis";
import { env } from "@vync/config";
import { logger } from "@vync/config";

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({
      url: env.REDIS_URL || "redis://redis:6379",
    });

    client.on("error", (err) => {
      logger.error("Redis Client Error", err);
    });

    await client.connect();
  }

  return client;
}
