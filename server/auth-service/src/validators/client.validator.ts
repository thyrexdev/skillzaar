import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  avatar: z.string().url("Invalid URL format").nullable().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").nullable().optional(),
  company: z.string().nullable().optional(),
  website: z.string().url("Invalid URL format").nullable().optional(),
  location: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});
