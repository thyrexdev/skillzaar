import { Request, Response } from "express";
import { JobService } from "../services/job.service";
import { z } from "zod";

// Job validation schemas
const createJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  category: z.string().min(1, "Category is required"),
});

const updateJobSchema = createJobSchema.partial();

export const createJob = async (req: Request, res: Response) => {
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

export const getClientJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { page = 1, limit = 10, status, category } = req.query;
    
    const jobs = await JobService.getClientJobs(userId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      category: category as string,
    });
    
    res.json(jobs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
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

export const updateJob = async (req: Request, res: Response) => {
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

export const deleteJob = async (req: Request, res: Response) => {
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

export const getJobStats = async (req: Request, res: Response) => {
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

export const getJobProposals = async (req: Request, res: Response) => {
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

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }

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
