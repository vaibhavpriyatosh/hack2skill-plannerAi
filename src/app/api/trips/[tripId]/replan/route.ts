import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { findTripByIdForUser, insertApiLog, updateTripItinerary } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateItinerary } from "@/lib/openai/itinerary";
import { replanTripSchema } from "@/lib/validation/trip-schema";

type Context = {
  params: Promise<{ tripId: string }>;
};

export async function POST(request: Request, context: Context) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await context.params;

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = replanTripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
      { status: 400 },
    );
  }

  const trip = await findTripByIdForUser(tripId, userId);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  try {
    const itinerary = await generateItinerary({
      destination: trip.destination,
      dateRange: trip.date_range,
      budget: trip.budget,
      vibe: trip.vibe,
      replanReason: parsed.data.reason,
      previousItinerary: trip.itinerary_json,
    });

    const updated = await updateTripItinerary(trip.id, userId, itinerary, "ready");

    await insertApiLog({
      route: `/api/trips/${tripId}/replan`,
      statusCode: 200,
      message: "Trip replanned",
      userId,
    });

    return NextResponse.json({ trip: updated ?? trip }, { status: 200 });
  } catch (error) {
    logger.error({ error, tripId }, "Trip replan failed");

    await insertApiLog({
      route: `/api/trips/${tripId}/replan`,
      statusCode: 500,
      message: "Trip replan failed",
      userId,
    });

    return NextResponse.json({ error: "Replan failed" }, { status: 500 });
  }
}
