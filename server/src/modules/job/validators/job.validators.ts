import { z } from "zod";
import { JobStatus } from "../../../generated/prisma";

export const createJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  category: z.string().min(1, "Category is required"),
});

export const updateJobSchema = createJobSchema.partial();

export const updateJobStatusSchema = z.object({
  status: z.enum([
    JobStatus.OPEN,
    JobStatus.IN_PROGRESS, 
    JobStatus.COMPLETED,
    JobStatus.CANCELED
  ], {
    errorMap: () => ({ message: "Invalid status. Must be one of: OPEN, IN_PROGRESS, COMPLETED, CANCELED" })
  })
});

export const jobFiltersSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  status: z.nativeEnum(JobStatus).optional(),
  category: z.string().optional(),
}).refine(data => data.page > 0, { message: "Page must be greater than 0", path: ["page"] })
  .refine(data => data.limit > 0 && data.limit <= 100, { message: "Limit must be between 1 and 100", path: ["limit"] });
