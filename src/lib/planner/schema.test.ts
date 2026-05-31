import { describe, expect, it } from "vitest";
import { itinerarySchema } from "@/lib/planner/schema";

describe("itinerarySchema", () => {
  it("accepts a valid itinerary payload", () => {
    const parsed = itinerarySchema.safeParse({
      tripName: "Goa Sprint",
      destination: "Goa",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      days: [
        {
          date: "2026-06-10",
          events: [
            {
              time: "09:00",
              title: "Beach Walk",
              location: "Miramar Beach",
            },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an itinerary with missing required fields", () => {
    const parsed = itinerarySchema.safeParse({
      tripName: "Broken payload",
      days: [],
    });

    expect(parsed.success).toBe(false);
  });
});
