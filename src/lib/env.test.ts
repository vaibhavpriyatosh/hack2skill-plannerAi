import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv, validateProductionEnv } from "@/lib/env";

const originalEnv = { ...process.env };

describe("env configuration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("returns defaults for optional values", () => {
    process.env = {
      NODE_ENV: "development",
    };

    const env = getEnv();
    expect(env.NODE_ENV).toBe("development");
    expect(env.OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("throws in production when required OAuth and DB values are missing", () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "12345678901234567890123456789012",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      DB_URL: "",
      DATABASE_URL: "",
      POSTGRES_URL: "",
    };

    const env = getEnv();
    expect(() => validateProductionEnv(env)).toThrow("Google OAuth credentials are required in production.");
  });

  it("passes production validation with secure auth and database config", () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "12345678901234567890123456789012",
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      DATABASE_URL: "postgres://user:pass@host:5432/db",
    };

    const env = getEnv();
    expect(() => validateProductionEnv(env)).not.toThrow();
  });
});
