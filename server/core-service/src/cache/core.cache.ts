import { setCache, getCache, delCache, CacheKeys } from "@vync/cache"
import type { Job } from "packages/shared/src/generated/prisma"
import type { JobWithClient, BrowseJobsFilters, JobMarketStats } from "../interfaces/job.interface"

// caching Job (client private)
export async function cachedJob(job: Job, ttl: number = 3600) {
  await setCache(CacheKeys.JOB(job.id), job, ttl)
}

export async function getCachedJob(jobId: string): Promise<Job | null> {
  return await getCache<Job>(CacheKeys.JOB(jobId))
}

export async function delCachedJob(jobId: string) {
  await delCache(CacheKeys.JOB(jobId))
}

// Client Jobs (private list)
export async function cachedClientJobs(userId: string, jobs: JobWithClient[], ttl: number = 300) {
  await setCache(CacheKeys.CLIENT_JOBS_LIST(userId), jobs, ttl)
}

export async function getCachedClientJobs(userId: string): Promise<JobWithClient[] | null> {
  return await getCache<JobWithClient[]>(CacheKeys.CLIENT_JOBS_LIST(userId))
}

export async function delCachedClientJobs(userId: string) {
  await delCache(CacheKeys.CLIENT_JOBS_LIST(userId))
}

// Browse Jobs (public - with filters)
export async function cachedBrowseJobs(filters: BrowseJobsFilters, jobs: JobWithClient[], ttl: number = 300) {
  await setCache(CacheKeys.BROWSE_JOBS(filters), jobs, ttl)
}

export async function getCachedBrowseJobs(filters: BrowseJobsFilters): Promise<JobWithClient[] | null> {
  return await getCache<JobWithClient[]>(CacheKeys.BROWSE_JOBS(filters))
}

export async function delCachedBrowseJobs(filters: BrowseJobsFilters) {
  await delCache(CacheKeys.BROWSE_JOBS(filters))
}

// Jon Market Stats 
export async function cachedJobMarketStats(stats: JobMarketStats, ttl: number = 300) {
  await setCache(CacheKeys.JOB_MARKET_STATS(), stats, ttl)
}

export async function getCachedJobMarketStats(): Promise<JobMarketStats | null> {
  return await getCache<JobMarketStats>(CacheKeys.JOB_MARKET_STATS())
}

export async function delCachedJobMarketStats() {
  await delCache(CacheKeys.JOB_MARKET_STATS())
}

// Featured Jobs (public)
export async function cachedFeaturedJobs(jobs: JobWithClient[], ttl: number = 600) {
  await setCache(CacheKeys.FEATURED_JOBS(), jobs, ttl)
}

export async function getCachedFeaturedJobs(): Promise<JobWithClient[] | null> {
  return await getCache<JobWithClient[]>(CacheKeys.FEATURED_JOBS())
}

export async function delCachedFeaturedJobs() {
  await delCache(CacheKeys.FEATURED_JOBS())
}
