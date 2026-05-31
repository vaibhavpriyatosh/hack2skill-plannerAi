import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TravelDashboard } from "@/components/travel-dashboard";
import { authOptions } from "@/lib/auth/options";

export default async function TravelPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <TravelDashboard
      userId={session.user.id}
      email={session.user.email ?? "traveler@example.com"}
      name={session.user.name ?? "Traveler"}
    />
  );
}
