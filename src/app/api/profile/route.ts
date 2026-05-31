import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { findUserById, insertApiLog } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    insertApiLog({
      route: "/api/profile",
      statusCode: 401,
      message: "Unauthorized profile request",
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = findUserById(userId);
  if (!user) {
    insertApiLog({
      route: "/api/profile",
      statusCode: 404,
      message: "User not found",
      userId,
    });

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  insertApiLog({
    route: "/api/profile",
    statusCode: 200,
    message: "Profile fetched successfully",
    userId,
  });

  logger.info({ route: "/api/profile", userId }, "Profile response served");

  return NextResponse.json(payload, { status: 200 });
}
