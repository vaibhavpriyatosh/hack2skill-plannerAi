import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TravelSearchPage } from "@/components/travel-search-page";
import { authOptions } from "@/lib/auth/options";
import { listTripSummariesByUser } from "@/lib/db";

export default async function TravelPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const trips = await listTripSummariesByUser(session.user.id);

  return (
    <TravelSearchPage
      email={session.user.email ?? "traveler@example.com"}
      name={session.user.name ?? "Traveler"}
      initialTrips={trips}
    />
  );
}
