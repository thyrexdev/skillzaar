import { z } from "zod";
import { ExperienceLevel } from "../../../generated/prisma";

export const UpdateFreelancerProfileValidator = z.object({
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(1000, "Bio can't exceed 1000 characters")
    .optional(),

  hourlyRate: z
    .number()
    .min(1, "Hourly rate must be at least $1")
    .max(1000, "Hourly rate seems too high")
    .optional(),

  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
});
