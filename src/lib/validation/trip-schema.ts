import { z } from "zod";
import { sanitizeText } from "@/lib/validation/sanitize";

export const createTripSchema = z.object({
  destination: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length >= 2, "Destination must be at least 2 characters")
    .refine((value) => value.length <= 80, "Destination must be at most 80 characters"),
  dateRange: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length >= 3, "Date range is required")
    .refine((value) => value.length <= 80, "Date range must be at most 80 characters"),
  budget: z.enum(["lean", "standard", "premium"]),
  vibe: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length >= 2, "Vibe must be at least 2 characters")
    .refine((value) => value.length <= 120, "Vibe must be at most 120 characters"),
});

export const replanTripSchema = z.object({
  reason: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length >= 4, "Replan reason must be at least 4 characters")
    .refine((value) => value.length <= 240, "Replan reason must be at most 240 characters"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type ReplanTripInput = z.infer<typeof replanTripSchema>;
