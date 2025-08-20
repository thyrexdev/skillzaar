import { z } from "zod";
import { MIDDLE_EAST_COUNTRIES } from "@/constants/countries";
import { ROLES } from "@/constants/roles";

export const registerSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    email: z.string().email("Invalid email address."),
    phoneNumber: z.string().min(8, "Phone number is required."),
    country: z
      .enum(
        MIDDLE_EAST_COUNTRIES.map((c) => c.name) as [string, ...string[]]
      )
      .refine((val) => !!val, { message: "Please select your country" }),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Confirm password is required."),
    role: z
      .enum(
        ROLES.map((c) => c.name) as [string, ...string[]]
      )
      .refine((val) => !!val, { message: "Please select your role" }),
agree: z.boolean().refine(val => val === true, {
  message: "You must agree to terms and privacy policy",
}),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type FormData = z.infer<typeof registerSchema>;
