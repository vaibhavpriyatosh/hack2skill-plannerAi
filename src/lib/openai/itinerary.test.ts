import { describe, expect, it } from "vitest";
import { generateItinerary } from "@/lib/openai/itinerary";

describe("generateItinerary", () => {
  it("uses deterministic fallback when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateItinerary({
      destination: "Karnataka",
      dateRange: "2026-08-12 to 2026-08-16",
      budget: "lean",
      vibe: "relaxed",
    });

    expect(result.destination).toBe("Karnataka");
    expect(result.startDate).toBe("2026-08-12");
    expect(result.endDate).toBe("2026-08-16");
    expect(result.days).toHaveLength(5);
    expect(result.days[0]?.events).toHaveLength(4);
    expect(result.days[0]?.events[0]?.location).toBe("Mysore Palace");
  });

  it("falls back to a 3-day range when date parsing input is invalid", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateItinerary({
      destination: "Mars Colony",
      dateRange: "sometime next season",
      budget: "premium",
      vibe: "adventure",
    });

    expect(result.days).toHaveLength(3);
    expect(result.days.every((day) => day.events.length === 4)).toBe(true);
  });
});
