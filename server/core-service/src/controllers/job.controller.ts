import type { Context } from "hono";
import { z } from "zod";
import { logger } from '@vync/config';
import { JobService } from "../services/job.service";
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  jobFiltersSchema,
  browseJobsFiltersSchema,
} from "../validators/job.validator";

export const createJob = async (c: Context) => {
  try {
    logger.info('🚀 createJob controller called');
    const body = await c.req.json();
    logger.info('📝 Request body:', body);
    const validatedData = createJobSchema.parse(body);
    logger.info('✅ Validation passed:', validatedData);

    const user = c.get("user");
    logger.info('👤 User from context:', user);
    if (!user?.sub) return c.json({ error: "User not authenticated" }, 401);

    logger.info('🔄 Calling JobService.createJob with userId:', user.sub);
    const job = await JobService.createJob(user.sub, validatedData);
    logger.info('✅ Job created successfully:', job.id);
    return c.json({ message: "Job created successfully", job }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const getClientJobs = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.sub) return c.json({ error: "User not authenticated" }, 401);

    const query = c.req.query();
    const validatedFilters = jobFiltersSchema.parse(query);

    const jobs = await JobService.getClientJobs(user.sub, validatedFilters);
    return c.json(jobs);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const getJobById = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");

    const job = await JobService.getJobById(jobId, user?.sub);
    return c.json({ job });
  } catch (error: any) {
    return c.json({ error: error.message }, error.message === "Job not found" ? 404 : 400);
  }
};

export const updateJob = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");
    const body = await c.req.json();

    const validatedData = updateJobSchema.parse(body);

    const job = await JobService.updateJob(jobId, user?.sub, validatedData);
    return c.json({ message: "Job updated successfully", job });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, error.message === "Job not found" ? 404 : 400);
  }
};

export const deleteJob = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");

    await JobService.deleteJob(jobId, user?.sub);
    return c.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    return c.json({ error: error.message }, error.message === "Job not found" ? 404 : 400);
  }
};

export const getJobStats = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.sub) return c.json({ error: "User not authenticated" }, 401);

    const stats = await JobService.getJobStats(user.sub);
    return c.json({ stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const getJobProposals = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");
    const query = c.req.query();

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const proposals = await JobService.getJobProposals(jobId, user?.sub, { page, limit });
    return c.json(proposals);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message === "Job not found" ? 404 : 400);
  }
};

export const updateJobStatus = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");
    const body = await c.req.json();

    const { status } = updateJobStatusSchema.parse(body);

    const job = await JobService.updateJobStatus(jobId, user?.sub, status);
    return c.json({ message: "Job status updated successfully", job });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, error.message === "Job not found" ? 404 : 400);
  }
};

export const browseJobs = async (c: Context) => {
  try {
    const query = c.req.query();
    const filters = browseJobsFiltersSchema.parse(query);

    const jobs = await JobService.browseJobs(filters);
    return c.json(jobs);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const getJobMarketStats = async (c: Context) => {
  try {
    const stats = await JobService.getJobMarketStats();
    return c.json({ stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const getJobByIdPublic = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const job = await JobService.getJobByIdPublic(jobId);
    return c.json({ job });
  } catch (error: any) {
    return c.json({ error: error.message }, error.message.includes("not available") ? 404 : 400);
  }
};

export const getFeaturedJobs = async (c: Context) => {
  try {
    const query = c.req.query();
    const limitNumber = query.limit ? parseInt(query.limit) : 6;

    const jobs = await JobService.getFeaturedJobs(limitNumber);
    return c.json({ jobs });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};
