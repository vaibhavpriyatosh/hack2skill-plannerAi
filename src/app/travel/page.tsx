import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function TravelPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #f3f8ff 0%, #e8f3ff 100%)",
      }}
    >
      <section
        style={{
          width: "min(840px, 100%)",
          background: "#ffffff",
          border: "1px solid #d9e4f5",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Travel Dashboard</h1>
        <p>
          Welcome, <strong>{session.user.email ?? "traveler"}</strong>. You are now on your
          authenticated travel landing page.
        </p>
        <p>Next step: we can plug itinerary generation, constraints, and realtime replanning here.</p>
        <Link href="/" style={{ color: "#0f766e", fontWeight: 700 }}>
          Back to Home
        </Link>
      </section>
    </main>
  );
}
