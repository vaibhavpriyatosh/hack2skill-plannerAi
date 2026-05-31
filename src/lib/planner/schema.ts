import { z } from "zod";

export const itineraryEventSchema = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1).default("TBD"),
  notes: z.string().optional(),
});

export const itineraryDaySchema = z.object({
  date: z.string().min(1),
  events: z.array(itineraryEventSchema),
});

export const itinerarySchema = z.object({
  tripName: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.array(itineraryDaySchema),
});

export type Itinerary = z.infer<typeof itinerarySchema>;
