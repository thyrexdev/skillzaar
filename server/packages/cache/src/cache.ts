import { getRedisClient } from "./client"

export async function setCache<T>(key: string, value: T, ttlSeconds?: number) {
  const client = await getRedisClient()
  const data = JSON.stringify(value)

  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, data)
  } else {
    await client.set(key, data)
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  const data = await client.get(key)
  return data ? (JSON.parse(data) as T) : null
}

export async function delCache(key: string) {
  const client = await getRedisClient()
  await client.del(key)
}

export async function hasCache(key: string): Promise<boolean> {
  const client = await getRedisClient()
  return (await client.exists(key)) > 0
}
