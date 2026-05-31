import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  const hasGoogleClientId = env.GOOGLE_CLIENT_ID.trim().length > 0;
  const hasGoogleClientSecret = env.GOOGLE_CLIENT_SECRET.trim().length > 0;

  return NextResponse.json({
    googleAuthConfigured: hasGoogleClientId && hasGoogleClientSecret,
  });
}
