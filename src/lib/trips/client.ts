import type { TripRecord, TripSummary, BudgetMode } from "@/lib/trips/types";

type ApiErrorResponse = {
  error?: string;
};

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<TResponse>(input: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as TResponse & ApiErrorResponse;

  if (!response.ok) {
    throw new ApiClientError(data.error ?? "Request failed", response.status);
  }

  return data;
}

export async function fetchTripSummaries(): Promise<TripSummary[]> {
  const payload = await fetchJson<{ trips: TripSummary[] }>("/api/trips");
  return payload.trips;
}

export async function createTripRequest(input: {
  destination: string;
  dateRange: string;
  budget: BudgetMode;
  vibe: string;
}): Promise<TripRecord> {
  const payload = await fetchJson<{ trip: TripRecord }>("/api/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return payload.trip;
}

export async function replanTripRequest(tripId: string, reason: string): Promise<TripRecord> {
  const payload = await fetchJson<{ trip: TripRecord }>(`/api/trips/${tripId}/replan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  return payload.trip;
}
