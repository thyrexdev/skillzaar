import { Request, Response } from "express";
import { JobService } from "../services/job.service";
import { z } from "zod";
import {
  CreateJobRequest,
  CreateJobResponse,
  ClientJobsResponse,
  JobByIdResponse,
  UpdateJobResponse,
  DeleteJobResponse,
  JobStatsResponse,
  JobProposalsResponse,
  UpdateJobStatusResponse,
  JobErrorResponse,
  ValidationErrorResponse,
  BrowseJobsResponse,
  JobMarketStatsResponse
} from "../interfaces/job.interfaces";
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  jobFiltersSchema,
  browseJobsFiltersSchema
} from "../validators/job.validators";

export const createJob = async (
  req: Request<{}, CreateJobResponse | ValidationErrorResponse | JobErrorResponse, CreateJobRequest>,
  res: Response<CreateJobResponse | ValidationErrorResponse | JobErrorResponse>
) => {
  try {
    // Validate request body
    const validatedData = createJobSchema.parse(req.body);
    
    // Get user ID from auth middleware (assuming it's attached to req.user)
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const job = await JobService.createJob(userId, validatedData);
    res.status(201).json({ 
      message: "Job created successfully",
      job 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getClientJobs = async (
  req: Request,
  res: Response<ClientJobsResponse | JobErrorResponse>
) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate query parameters
    const validatedFilters = jobFiltersSchema.parse(req.query);
    
    const jobs = await JobService.getClientJobs(userId, validatedFilters);
    
    res.json(jobs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getJobById = async (
  req: Request,
  res: Response<JobByIdResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;

    const job = await JobService.getJobById(jobId, userId);
    res.json({ job });
  } catch (error: any) {
    if (error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateJob = async (
  req: Request,
  res: Response<UpdateJobResponse | ValidationErrorResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;
    
    // Validate request body
    const validatedData = updateJobSchema.parse(req.body);

    const job = await JobService.updateJob(jobId, userId, validatedData);
    res.json({ 
      message: "Job updated successfully",
      job 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    if (error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const deleteJob = async (
  req: Request,
  res: Response<DeleteJobResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;

    await JobService.deleteJob(jobId, userId);
    res.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    if (error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getJobStats = async (
  req: Request,
  res: Response<JobStatsResponse | JobErrorResponse>
) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const stats = await JobService.getJobStats(userId);
    res.json({ stats });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getJobProposals = async (
  req: Request,
  res: Response<JobProposalsResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;
    const { page = 1, limit = 10 } = req.query;

    const proposals = await JobService.getJobProposals(jobId, userId, {
      page: Number(page),
      limit: Number(limit),
    });
    
    res.json(proposals);
  } catch (error: any) {
    if (error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateJobStatus = async (
  req: Request,
  res: Response<UpdateJobStatusResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;
    
    // Validate request body
    const validatedData = updateJobStatusSchema.parse(req.body);
    const { status } = validatedData;

    const job = await JobService.updateJobStatus(jobId, userId, status);
    res.json({ 
      message: "Job status updated successfully",
      job 
    });
  } catch (error: any) {
    if (error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const browseJobs = async (
  req: Request,
  res: Response<BrowseJobsResponse | JobErrorResponse>
) => {
  try {
    // Validate query parameters
    const filters = browseJobsFiltersSchema.parse(req.query);

    const jobs = await JobService.browseJobs(filters);
    res.json(jobs);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getJobMarketStats = async (
  req: Request,
  res: Response<JobMarketStatsResponse | JobErrorResponse>
) => {
  try {
    const stats = await JobService.getJobMarketStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Public method to get a job by ID (for freelancers)
export const getJobByIdPublic = async (
  req: Request,
  res: Response<JobByIdResponse | JobErrorResponse>
) => {
  try {
    const { jobId } = req.params;

    const job = await JobService.getJobByIdPublic(jobId);
    res.json({ job });
  } catch (error: any) {
    if (error.message === "Job not found" || error.message === "Job is not available") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

// Get featured jobs
export const getFeaturedJobs = async (
  req: Request,
  res: Response<{ jobs: any[] } | JobErrorResponse>
) => {
  try {
    const { limit } = req.query;
    const limitNumber = limit ? parseInt(limit as string) : 6;

    const jobs = await JobService.getFeaturedJobs(limitNumber);
    res.json({ jobs });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
