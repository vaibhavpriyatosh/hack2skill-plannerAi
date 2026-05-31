import { NextResponse } from "next/server";
import { z } from "zod";
import { insertApiLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { messageRequestSchema } from "@/lib/validation/message-schema";

const getResponseSchema = z.object({
  message: z.string(),
  time: z.string(),
});

export async function GET() {
  const payload = {
    message: "Backend is running with validation, logging, and hosted Postgres persistence.",
    time: new Date().toISOString(),
  };

  const parsed = getResponseSchema.safeParse(payload);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues }, "GET /api/message payload failed validation");
    await insertApiLog({
      route: "/api/message",
      statusCode: 500,
      message: "Response validation failed",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await insertApiLog({
    route: "/api/message",
    statusCode: 200,
    message: "GET message served",
  });

  return NextResponse.json(parsed.data);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = messageRequestSchema.safeParse(body);

    if (!parsed.success) {
      await insertApiLog({
        route: "/api/message",
        statusCode: 400,
        message: "Invalid POST payload",
      });

      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid request payload",
        },
        { status: 400 },
      );
    }

    const response = {
      reply: `Hello, ${parsed.data.name}! Your request passed validation and reached the backend.`,
      time: new Date().toISOString(),
    };

    await insertApiLog({
      route: "/api/message",
      statusCode: 200,
      message: "Validated POST message served",
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error({ error }, "POST /api/message failed unexpectedly");

    await insertApiLog({
      route: "/api/message",
      statusCode: 500,
      message: "Unhandled POST message error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
