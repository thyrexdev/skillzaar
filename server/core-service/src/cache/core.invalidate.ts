import { prisma } from "@vync/shared";
import {
  cachedJob,
  cachedClientJobs,
  cachedFeaturedJobs,
  cachedJobMarketStats,
  cachedBrowseJobs,
  delCachedJob,
  delCachedClientJobs,
  delCachedBrowseJobs,
  delCachedFeaturedJobs,
  delCachedJobMarketStats
} from "./core.cache.ts";
import type { BrowseJobsFilters, JobMarketStats } from "../interfaces/job.interface";

export async function refreshJobCache(jobId: string, clientId: string) {
  // fetch latest job
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: { select: { proposals: true } }
    }
  });

  // fetch client jobs
  const clientJobs = await prisma.job.findMany({
    where: { clientId },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: { select: { proposals: true } }
    }
  });

  // featured jobs
  const featuredJobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: { select: { proposals: true } }
    }
  });

  // job market stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalOpenJobs, totalJobsThisWeek, avgBudget, topCategories] = await Promise.all([
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.job.aggregate({ where: { status: "OPEN" }, _avg: { budget: true } }),
    prisma.job.groupBy({
      by: ["category"],
      where: { status: "OPEN" },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 5
    })
  ]);

  const stats: JobMarketStats = {
    totalOpenJobs,
    totalJobsThisWeek,
    averageBudget: avgBudget._avg.budget || 0,
    topCategories: topCategories.map(c => ({ category: c.category, count: c._count.category }))
  };

  // browse jobs (default filter for now)
  const defaultFilters: BrowseJobsFilters = { page: 1, limit: 20 };
  const browseJobs = await prisma.job.findMany({
    skip: 0,
    take: 20,
    orderBy: { createdAt: "desc" },
    where: { status: "OPEN" },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: { select: { proposals: true } }
    }
  });

  // delete old cache
  await Promise.all([
    delCachedJob(jobId),
    delCachedClientJobs(clientId),
    delCachedFeaturedJobs(),
    delCachedJobMarketStats(),
    delCachedBrowseJobs(defaultFilters)
  ]);

  // set new cache
  await Promise.all([
    job && cachedJob(job),
    cachedClientJobs(clientId, clientJobs),
    cachedFeaturedJobs(featuredJobs),
    cachedJobMarketStats(stats),
    cachedBrowseJobs(defaultFilters, browseJobs)
  ]);
}
