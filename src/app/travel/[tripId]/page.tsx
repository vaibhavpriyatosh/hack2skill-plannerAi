import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TravelItineraryPage } from "@/components/travel-itinerary-page";
import { authOptions } from "@/lib/auth/options";
import { findTripByIdForUser } from "@/lib/db";

type Context = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailsPage({ params }: Context) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { tripId } = await params;
  const trip = await findTripByIdForUser(tripId, session.user.id);

  if (!trip) {
    notFound();
  }

  return <TravelItineraryPage trip={trip} />;
}
