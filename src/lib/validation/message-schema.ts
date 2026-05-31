import { z } from "zod";
import { sanitizeText } from "@/lib/validation/sanitize";

export const messageRequestSchema = z.object({
  name: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length >= 2, "Name must be at least 2 characters")
    .refine((value) => value.length <= 50, "Name must be at most 50 characters"),
});

export type MessageRequest = z.infer<typeof messageRequestSchema>;
