import { z } from "zod";

export const UpdateSkillsValidator = z.object({
  skills: z
    .array(
      z
        .string()
        .min(2, "Each skill must be at least 2 characters")
        .max(50, "Skill name is too long")
    )
    .min(1, "At least one skill is required")
    .max(20, "You can’t have more than 20 skills"),
});
