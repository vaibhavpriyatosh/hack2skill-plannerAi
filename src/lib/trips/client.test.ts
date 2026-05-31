import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  createTripRequest,
  fetchTripSummaries,
  replanTripRequest,
} from "@/lib/trips/client";

describe("trips client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches trip summaries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          trips: [
            {
              id: "t1",
              destination: "Denmark",
              date_range: "2026-08-12 to 2026-08-16",
              budget: "lean",
              vibe: "relaxed",
              status: "ready",
              created_at: "2026-05-31T00:00:00.000Z",
            },
          ],
        }),
      }),
    );

    const trips = await fetchTripSummaries();
    expect(trips).toHaveLength(1);
    expect(trips[0]?.destination).toBe("Denmark");
  });

  it("throws ApiClientError on failed request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      }),
    );

    await expect(createTripRequest({
      destination: "Denmark",
      dateRange: "2026-08-12 to 2026-08-16",
      budget: "standard",
      vibe: "food",
    })).rejects.toBeInstanceOf(ApiClientError);
  });

  it("sends replan reason and returns updated trip", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        trip: {
          id: "t2",
          user_id: "u1",
          destination: "Denmark",
          date_range: "2026-08-12 to 2026-08-16",
          budget: "premium",
          vibe: "luxury",
          status: "ready",
          itinerary_json: null,
          created_at: "2026-05-31T00:00:00.000Z",
          updated_at: "2026-05-31T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const trip = await replanTripRequest("t2", "Avoid rush-hour traffic near city center");
    expect(trip.id).toBe("t2");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
