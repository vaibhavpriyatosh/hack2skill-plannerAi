import type { Itinerary } from "@/lib/planner/schema";

export type BudgetMode = "lean" | "standard" | "premium";

export type TripStatus = "drafting" | "ready" | "failed";

export type TripRecord = {
  id: string;
  user_id: string;
  destination: string;
  date_range: string;
  budget: BudgetMode;
  vibe: string;
  status: TripStatus;
  itinerary_json: Itinerary | null;
  created_at: string;
  updated_at: string;
};

export type TripSummary = {
  id: string;
  destination: string;
  date_range: string;
  budget: BudgetMode;
  vibe: string;
  status: TripStatus;
  created_at: string;
};
