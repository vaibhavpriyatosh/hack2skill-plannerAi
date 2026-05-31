"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { createTripRequest } from "@/lib/trips/client";
import type { BudgetMode, TripSummary } from "@/lib/trips/types";
import styles from "./travel-search-page.module.css";

type TravelSearchPageProps = {
  email: string;
  name: string;
  initialTrips: TripSummary[];
};

function getFirstName(name: string, fallbackEmail: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? "Traveler";
  }

  const emailPrefix = fallbackEmail.split("@")[0]?.trim();
  return emailPrefix || "Traveler";
}

export function TravelSearchPage({ email, name, initialTrips }: TravelSearchPageProps) {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const defaultDepartureDate = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const defaultReturnDate = useMemo(() => {
    const next = new Date(today);
    next.setDate(next.getDate() + 4);
    return next.toISOString().slice(0, 10);
  }, [today]);

  const [tripMode, setTripMode] = useState<"oneWay" | "roundTrip">("roundTrip");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(defaultDepartureDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [budget, setBudget] = useState<BudgetMode | "">("");
  const [vibe, setVibe] = useState("");
  const [statusText, setStatusText] = useState("Ready to build your itinerary.");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);

    const dateRange =
      tripMode === "oneWay" || !returnDate ? departureDate : `${departureDate} to ${returnDate}`;

    try {
      if (!budget) {
        throw new Error("Please choose a budget mode.");
      }

      const trip = await createTripRequest({
        destination,
        dateRange,
        budget,
        vibe,
      });

      setStatusText("Itinerary generated. Opening details...");
      router.push(`/travel/${trip.id}`);
    } catch {
      setIsSearching(false);
      setStatusText("Search failed. Please retry.");
    }
  };

  const firstName = getFirstName(name, email);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>PlannerAI</div>
        <div className={styles.userActions}>
          <span className={styles.userName}>Hi, {firstName}</span>
          <button type="button" className={styles.signOutButton} onClick={() => void signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.heroCard}>
          <p className={styles.badge}>Step 1 of 2</p>
          <h1>Search and build your itinerary</h1>
          <p>Choose destination, dates, budget and travel vibe. Press Search to generate with AI.</p>
          <p className={styles.status} role="status" aria-live="polite">
            {statusText}
          </p>
        </section>

        <section className={styles.searchCard}>
          <form className={styles.form} onSubmit={handleSearch}>
            <div className={styles.modeRow}>
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

            <div className={styles.fieldGrid}>
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Copenhagen"
                required
              />

              <div className={styles.dateGrid}>
                <div>
                  <label htmlFor="departure-date">Departure</label>
                  <input
                    id="departure-date"
                    type="date"
                    value={departureDate}
                    onChange={(event) => setDepartureDate(event.target.value)}
                    required
                  />
                </div>
                <div>
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

              <label htmlFor="budget">Budget</label>
              <select id="budget" value={budget} onChange={(event) => setBudget(event.target.value as BudgetMode)} required>
                <option value="">Select budget profile</option>
                <option value="lean">Lean Explorer</option>
                <option value="standard">Comfort Standard</option>
                <option value="premium">Premium Pace</option>
              </select>

              <label htmlFor="vibe">Travel vibe</label>
              <input
                id="vibe"
                value={vibe}
                onChange={(event) => setVibe(event.target.value)}
                placeholder="culture, local food, photography"
                required
              />
            </div>

            <button type="submit" className={styles.searchButton} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search Itinerary"}
            </button>
          </form>
        </section>

        <section className={styles.historyCard}>
          <h2>Previous Searches</h2>
          {initialTrips.length === 0 ? (
            <p>No searches yet. Your generated trips will appear here.</p>
          ) : (
            <div className={styles.resultsGrid}>
              {initialTrips.map((trip) => (
                <Link key={trip.id} href={`/travel/${trip.id}`} className={styles.resultCard}>
                  <h3>{trip.destination}</h3>
                  <p>{trip.date_range}</p>
                  <p>{trip.budget} | {trip.vibe}</p>
                  <span className={styles.resultStatus}>{trip.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
