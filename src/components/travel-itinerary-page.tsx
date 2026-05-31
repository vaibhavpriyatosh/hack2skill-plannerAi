"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { replanTripRequest } from "@/lib/trips/client";
import type { TripRecord } from "@/lib/trips/types";
import styles from "./travel-itinerary-page.module.css";

type TravelItineraryPageProps = {
  trip: TripRecord;
};

export function TravelItineraryPage({ trip: initialTrip }: TravelItineraryPageProps) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [replanReason, setReplanReason] = useState("");
  const [isReplanning, setIsReplanning] = useState(false);

  const dayPlans = useMemo(() => trip.itinerary_json?.days ?? [], [trip.itinerary_json]);

  const handleReplan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsReplanning(true);

    try {
      const updatedTrip = await replanTripRequest(trip.id, replanReason);
      setTrip(updatedTrip);
      setReplanReason("");
      router.refresh();
    } finally {
      setIsReplanning(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.topActions}>
          <Link href="/travel" className={styles.backLink}>
            Back to Search
          </Link>
        </section>

        <section className={styles.heroCard}>
          <p className={styles.badge}>Step 2 of 2</p>
          <h1>{trip.itinerary_json?.tripName ?? `${trip.destination} Itinerary`}</h1>
          <p>
            {trip.destination} | {trip.date_range} | {trip.budget} | {trip.vibe}
          </p>
        </section>

        <section className={styles.replanCard}>
          <h2>Refine This Plan</h2>
          <form className={styles.replanForm} onSubmit={handleReplan}>
            <label htmlFor="replan-reason">Tell us what changed</label>
            <input
              id="replan-reason"
              value={replanReason}
              onChange={(event) => setReplanReason(event.target.value)}
              placeholder="Rain expected after 2 PM, move outdoor places earlier"
              minLength={4}
              required
            />
            <button type="submit" disabled={isReplanning}>
              {isReplanning ? "Replanning..." : "Replan Itinerary"}
            </button>
          </form>
        </section>

        <section className={styles.itineraryCard}>
          <h2>Detailed Itinerary</h2>
          {dayPlans.length === 0 ? (
            <p>Itinerary is still being generated. Please refresh in a moment.</p>
          ) : (
            <div className={styles.dayPlans}>
              {dayPlans.map((day) => (
                <article key={day.date} className={styles.dayPanel}>
                  <h3>{day.date}</h3>
                  <ol>
                    {day.events.map((event) => (
                      <li key={`${day.date}-${event.time}-${event.title}`}>
                        <time>{event.time}</time>
                        <div>
                          <h4>{event.title}</h4>
                          <p className={styles.location}>{event.location}</p>
                          {event.notes ? <p>{event.notes}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
