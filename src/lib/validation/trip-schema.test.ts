import { describe, expect, it } from "vitest";
import { createTripSchema, replanTripSchema } from "@/lib/validation/trip-schema";

describe("createTripSchema", () => {
  it("sanitizes and accepts valid input", () => {
    const parsed = createTripSchema.safeParse({
      destination: "  Copenhagen\t",
      dateRange: " 2026-08-12 to 2026-08-16 ",
      budget: "standard",
      vibe: " relaxed city walks\n",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.destination).toBe("Copenhagen");
      expect(parsed.data.dateRange).toBe("2026-08-12 to 2026-08-16");
      expect(parsed.data.vibe).toBe("relaxed city walks");
    }
  });

  it("rejects invalid destination lengths", () => {
    const tooShort = createTripSchema.safeParse({
      destination: "A",
      dateRange: "2026-08-12 to 2026-08-16",
      budget: "lean",
      vibe: "food",
    });

    expect(tooShort.success).toBe(false);
  });
});

describe("replanTripSchema", () => {
  it("accepts and sanitizes replan reason", () => {
    const parsed = replanTripSchema.safeParse({
      reason: "  Rain after 2 PM, move outdoor spots earlier.  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reason).toBe("Rain after 2 PM, move outdoor spots earlier.");
    }
  });

  it("rejects very short reason", () => {
    const parsed = replanTripSchema.safeParse({ reason: "ok" });
    expect(parsed.success).toBe(false);
  });
});
