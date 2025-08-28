import { setCache, getCache, delCache, CacheKeys } from "@vync/cache";

type CachedUser = {
  id: string,
  name: string,
  phoneNumber: string
  country: string
  email: string,
  isVerified: boolean,
  role: "FREELANCER" | "CLIENT" | "ADMIN"
}

export async function cachedUserSession(user: CachedUser, ttl: number) {
  await setCache(CacheKeys.USER_REFRESH_TOKEN(user.id), user, ttl)
}

export async function getCachedUserSession(userId: string) {
  return await getCache<CachedUser>(CacheKeys.USER_REFRESH_TOKEN(userId))
}

export async function clearUserSession(userId: string) {
  return await delCache(CacheKeys.USER_REFRESH_TOKEN(userId))
}
