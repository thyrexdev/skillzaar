// schemas/loginSchema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
  role: z.enum(["FREELANCER", "CLIENT"], {
    required_error: "Please select your role",
  }),
});
