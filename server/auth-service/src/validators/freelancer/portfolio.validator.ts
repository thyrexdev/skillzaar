import { z } from "zod";

export const CreatePortfolioValidator = z.object({
  title: z.string().min(3, "Title is too short"),
  description: z.string().max(1000, "Description is too long").optional(),
  imageUrls: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required"),
  githubUrl: z.string().url("Invalid GitHub URL").optional(),
  liveUrl: z.string().url("Invalid live URL").optional(),
});

export const UpdatePortfolioValidator = z.object({
  title: z.string().min(3, "Title is too short").optional(),
  description: z.string().max(1000, "Description is too long").optional(),
  imageUrls: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required")
    .optional(),
  githubUrl: z.string().url("Invalid GitHub URL").optional(),
  liveUrl: z.string().url("Invalid live URL").optional(),
});
