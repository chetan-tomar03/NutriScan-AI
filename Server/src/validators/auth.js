import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  acceptedPrivacyNote: z
    .boolean()
    .refine((v) => v === true, "You must accept the privacy note"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(72),
});