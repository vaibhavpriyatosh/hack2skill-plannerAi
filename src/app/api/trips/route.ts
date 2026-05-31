import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createTrip, insertApiLog, listTripsByUser, updateTripItinerary } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateItinerary } from "@/lib/openai/itinerary";
import { createTripSchema } from "@/lib/validation/trip-schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await listTripsByUser(userId);

  await insertApiLog({
    route: "/api/trips",
    statusCode: 200,
    message: "Trip list fetched",
    userId,
  });

  return NextResponse.json({ trips }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = createTripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
      { status: 400 },
    );
  }

  const trip = await createTrip({
    userId,
    destination: parsed.data.destination,
    dateRange: parsed.data.dateRange,
    budget: parsed.data.budget,
    vibe: parsed.data.vibe,
  });

  try {
    const itinerary = await generateItinerary({
      destination: parsed.data.destination,
      dateRange: parsed.data.dateRange,
      budget: parsed.data.budget,
      vibe: parsed.data.vibe,
    });

    const updated = await updateTripItinerary(trip.id, userId, itinerary, "ready");

    await insertApiLog({
      route: "/api/trips",
      statusCode: 201,
      message: "Trip created",
      userId,
    });

    return NextResponse.json({ trip: updated ?? trip }, { status: 201 });
  } catch (error) {
    logger.error({ error, tripId: trip.id }, "Failed to generate itinerary after trip creation");

    await insertApiLog({
      route: "/api/trips",
      statusCode: 500,
      message: "Trip created but itinerary generation failed",
      userId,
    });

    return NextResponse.json({ trip, warning: "Trip saved. Itinerary generation failed." }, { status: 201 });
  }
}
