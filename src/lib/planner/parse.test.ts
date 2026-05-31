import { describe, expect, it } from "vitest";
import { parseItineraryResponse } from "@/lib/planner/parse";

describe("parseItineraryResponse", () => {
  it("returns strict parse for valid itinerary JSON", () => {
    const response = parseItineraryResponse(
      JSON.stringify({
        tripName: "Mumbai Weekend",
        destination: "Mumbai",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        days: [
          {
            date: "2026-06-01",
            events: [
              { time: "10:00", title: "Gateway Visit", location: "Gateway of India" },
            ],
          },
        ],
      }),
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.repaired).toBe(false);
      expect(response.data.destination).toBe("Mumbai");
    }
  });

  it("repairs partially valid itinerary JSON", () => {
    const response = parseItineraryResponse(
      JSON.stringify({
        tripName: "",
        destination: "",
      }),
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.repaired).toBe(true);
      expect(response.data.tripName).toBe("Untitled Trip");
    }
  });

  it("rejects non-JSON data", () => {
    const response = parseItineraryResponse("not-json");

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.errors[0]).toContain("Invalid JSON");
    }
  });
});
