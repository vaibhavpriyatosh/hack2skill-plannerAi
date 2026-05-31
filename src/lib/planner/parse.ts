import { z } from "zod";
import { itinerarySchema, type Itinerary } from "@/lib/planner/schema";

const repairableSchema = z.object({
  tripName: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.array(z.unknown()).optional(),
});

type ParseResult =
  | { success: true; data: Itinerary; repaired: boolean }
  | { success: false; errors: string[] };

function repairCandidate(payload: z.infer<typeof repairableSchema>): Itinerary {
  return {
    tripName: payload.tripName?.trim() || "Untitled Trip",
    destination: payload.destination?.trim() || "Unknown Destination",
    startDate: payload.startDate?.trim() || "TBD",
    endDate: payload.endDate?.trim() || "TBD",
    days: Array.isArray(payload.days) ? [] : [],
  };
}

export function parseItineraryResponse(raw: string): ParseResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return {
      success: false,
      errors: ["Invalid JSON response"],
    };
  }

  const candidate =
    typeof parsedJson === "object" && parsedJson !== null
      ? ((parsedJson as Record<string, unknown>).itinerary ??
          (parsedJson as Record<string, unknown>).plan ??
          parsedJson)
      : parsedJson;

  const strict = itinerarySchema.safeParse(candidate);
  if (strict.success) {
    return {
      success: true,
      data: strict.data,
      repaired: false,
    };
  }

  const repairable = repairableSchema.safeParse(candidate);
  if (!repairable.success) {
    return {
      success: false,
      errors: strict.error.issues.map((issue) => issue.message),
    };
  }

  const repaired = repairCandidate(repairable.data);
  return {
    success: true,
    data: repaired,
    repaired: true,
  };
}
