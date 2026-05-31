"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { debounce } from "@/lib/utils/debounce";
import styles from "./travel-dashboard.module.css";

type TravelDashboardProps = {
  userId: string;
  email: string;
  name: string;
};

type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  provider: string;
};

type ItineraryEvent = {
  time: string;
  title: string;
  location: string;
  notes?: string;
};

type Itinerary = {
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    events: ItineraryEvent[];
  }>;
};

type TripRecord = {
  id: string;
  user_id: string;
  destination: string;
  date_range: string;
  budget: "lean" | "standard" | "premium";
  vibe: string;
  status: "drafting" | "ready" | "failed";
  itinerary_json: Itinerary | null;
  created_at: string;
  updated_at: string;
};

type Waypoint = {
  time: string;
  title: string;
  location: string;
  details: string;
};

type DayPlan = {
  date: string;
  waypoints: Waypoint[];
};

const EMPTY_DAY_PLANS: DayPlan[] = [];

function getFirstName(name: string, fallbackEmail: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? "Traveler";
  }

  const emailPrefix = fallbackEmail.split("@")[0]?.trim();
  return emailPrefix || "Traveler";
}

function itineraryToDayPlans(itinerary: Itinerary | null): DayPlan[] {
  if (!itinerary || itinerary.days.length === 0) {
    return EMPTY_DAY_PLANS;
  }

  return itinerary.days.map((day) => ({
    date: day.date,
    waypoints: day.events.map((event) => ({
      time: event.time,
      title: event.title,
      location: event.location,
      details: event.notes ?? "",
    })),
  }));
}

export function TravelDashboard({ userId, email, name }: TravelDashboardProps) {
  const today = useMemo(() => new Date(), []);
  const defaultDepartureDate = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const defaultReturnDate = useMemo(() => {
    const next = new Date(today);
    next.setDate(next.getDate() + 4);
    return next.toISOString().slice(0, 10);
  }, [today]);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [statusText, setStatusText] = useState("Dashboard ready.");
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [tripMode, setTripMode] = useState<"oneWay" | "roundTrip">("roundTrip");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(defaultDepartureDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [budget, setBudget] = useState("");
  const [vibe, setVibe] = useState("");

  const [replanReason, setReplanReason] = useState("");
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);

  const debouncedStatusUpdate = useMemo(
    () => debounce((value: string) => setStatusText(value), 200),
    [],
  );

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null;
  const dayPlans = itineraryToDayPlans(selectedTrip?.itinerary_json ?? null);

  const refreshTrips = async () => {
    const response = await fetch("/api/trips", { method: "GET" });
    if (!response.ok) {
      throw new Error("Could not load trips");
    }

    const payload = (await response.json()) as { trips: TripRecord[] };
    setTrips(payload.trips);

    if (!selectedTripId && payload.trips[0]?.id) {
      setSelectedTripId(payload.trips[0].id);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadRuntimeData() {
      try {
        const profileResponse = await fetch("/api/profile", { signal: controller.signal });

        if (profileResponse.ok) {
          const profilePayload = (await profileResponse.json()) as ProfileResponse;
          setProfile(profilePayload);
        }

        await refreshTrips();
        debouncedStatusUpdate("Profile and trips synced.");
      } catch {
        debouncedStatusUpdate("Some data failed to load. You can still plan manually.");
      }
    }

    void loadRuntimeData();

    return () => controller.abort();
  }, [debouncedStatusUpdate, selectedTripId]);

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingTrip(true);

    try {
      const dateRange =
        tripMode === "oneWay" || !returnDate
          ? departureDate
          : `${departureDate} to ${returnDate}`;

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destination, dateRange, budget, vibe }),
      });

      const payload = (await response.json()) as { trip?: TripRecord; error?: string };
      if (!response.ok || !payload.trip) {
        throw new Error(payload.error ?? "Trip creation failed");
      }

      await refreshTrips();
      setSelectedTripId(payload.trip.id);
      setReplanReason("");
      debouncedStatusUpdate("Trip created and itinerary generated.");
    } catch {
      debouncedStatusUpdate("Trip creation failed. Please retry.");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleReplan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTripId) {
      debouncedStatusUpdate("Select a trip before replanning.");
      return;
    }

    setIsReplanning(true);

    try {
      const response = await fetch(`/api/trips/${selectedTripId}/replan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: replanReason }),
      });

      const payload = (await response.json()) as { trip?: TripRecord; error?: string };
      if (!response.ok || !payload.trip) {
        throw new Error(payload.error ?? "Replan failed");
      }

      await refreshTrips();
      setSelectedTripId(payload.trip.id);
      debouncedStatusUpdate("Trip replanned with updated constraints.");
    } catch {
      debouncedStatusUpdate("Replan failed. Please retry.");
    } finally {
      setIsReplanning(false);
    }
  };

  const displayName = profile?.name ?? name;
  const firstName = getFirstName(displayName ?? "", profile?.email ?? email);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>PlannerAI</div>
        <div className={styles.userActions}>
          <span className={styles.userName}>Hi, {firstName}</span>
          <button
            type="button"
            className={styles.signOutButton}
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <article className={`${styles.mockCard} ${styles.leftCard}`} aria-hidden="true">
            <div className={styles.cardHeader}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.cardImageA} />
            <div className={styles.cardText} />
            <div className={styles.cardTextShort} />
          </article>

          <article className={styles.centerCard}>
            <p className={styles.badge}>Live Workspace</p>
            <h1>Journey To Explore World</h1>
            <p>
              Plan destination-ready itineraries with flexible constraints, adaptive schedules, and
              fast replanning when things shift.
            </p>
            <div className={styles.quickPills}>
              <span>Flexible Dates</span>
              <span>Smart Budgeting</span>
              <span>Realtime Replan</span>
            </div>
            <p className={styles.liveStatus} role="status" aria-live="polite">
              {statusText}
            </p>
          </article>

          <article className={`${styles.mockCard} ${styles.rightCard}`} aria-hidden="true">
            <div className={styles.cardHeader}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.cardImageB} />
            <div className={styles.cardText} />
            <div className={styles.cardTextShort} />
          </article>
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <h2>Plan Builder</h2>
            <form className={styles.form} onSubmit={handleCreateTrip}>
              <div className={styles.tripModes}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${tripMode === "oneWay" ? styles.modeButtonActive : ""}`}
                  onClick={() => setTripMode("oneWay")}
                >
                  One Way
                </button>
                <button
                  type="button"
                  className={`${styles.modeButton} ${tripMode === "roundTrip" ? styles.modeButtonActive : ""}`}
                  onClick={() => setTripMode("roundTrip")}
                >
                  Round Trip
                </button>
              </div>

              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Lisbon"
                required
              />

              <div className={styles.dateGrid}>
                <div className={styles.dateField}>
                  <label htmlFor="departure-date">Departure</label>
                  <input
                    id="departure-date"
                    type="date"
                    value={departureDate}
                    onChange={(event) => setDepartureDate(event.target.value)}
                    required
                  />
                </div>

                <div className={styles.dateField}>
                  <label htmlFor="return-date">Return</label>
                  <input
                    id="return-date"
                    type="date"
                    value={returnDate}
                    min={departureDate}
                    onChange={(event) => setReturnDate(event.target.value)}
                    disabled={tripMode === "oneWay"}
                    required={tripMode === "roundTrip"}
                  />
                </div>
              </div>

              <label htmlFor="budget">Budget Mode</label>
              <select id="budget" value={budget} onChange={(event) => setBudget(event.target.value)} required>
                <option value="">Choose budget profile</option>
                <option value="lean">Lean Explorer</option>
                <option value="standard">Comfort Standard</option>
                <option value="premium">Premium Pace</option>
              </select>

              <label htmlFor="vibe">Vibe</label>
              <input
                id="vibe"
                value={vibe}
                onChange={(event) => setVibe(event.target.value)}
                placeholder="Cultural + relaxed"
                required
              />

              <button type="submit" className={styles.primaryButton} disabled={isCreatingTrip}>
                {isCreatingTrip ? "Generating..." : "Generate AI Trip Plan"}
              </button>
            </form>
          </article>
        </section>

        <section className={styles.panel}>
          <h2>Saved Trips</h2>
          {trips.length === 0 ? (
            <p>No trips yet. Create your first AI-assisted itinerary above.</p>
          ) : (
            <div className={styles.tripList}>
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  className={`${styles.tripCard} ${selectedTripId === trip.id ? styles.tripCardActive : ""}`}
                  onClick={() => setSelectedTripId(trip.id)}
                >
                  <strong>{trip.destination}</strong>
                  <span>{trip.date_range}</span>
                  <span className={styles.tripMeta}>{trip.budget} | {trip.vibe}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.timelinePanel}>
          <h2>Drafted Waypoints</h2>
          {selectedTrip?.itinerary_json ? (
            <p className={styles.itineraryMeta}>
              {selectedTrip.itinerary_json.tripName} | {selectedTrip.itinerary_json.destination}
            </p>
          ) : null}
          {selectedTrip ? (
            <form className={styles.replanForm} onSubmit={handleReplan}>
              <label htmlFor="replan-reason">Replan reason</label>
              <input
                id="replan-reason"
                value={replanReason}
                onChange={(event) => setReplanReason(event.target.value)}
                placeholder="Rain expected after 2 PM, shift outdoors earlier"
                minLength={4}
                required
              />
              <button type="submit" className={styles.secondaryButton} disabled={isReplanning}>
                {isReplanning ? "Replanning..." : "Replan Selected Trip"}
              </button>
            </form>
          ) : null}

          {dayPlans.length === 0 ? (
            <p>Create or select a trip to visualize adaptive travel checkpoints.</p>
          ) : (
            <div className={styles.dayPlans}>
              {dayPlans.map((dayPlan) => (
                <section key={dayPlan.date} className={styles.dayCard}>
                  <h3 className={styles.dayTitle}>{dayPlan.date}</h3>
                  <ol>
                    {dayPlan.waypoints.map((waypoint) => (
                      <li key={`${dayPlan.date}-${waypoint.time}-${waypoint.title}`}>
                        <span>{waypoint.time}</span>
                        <div>
                          <h4>{waypoint.title}</h4>
                          <p className={styles.location}>{waypoint.location}</p>
                          {waypoint.details ? <p>{waypoint.details}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
