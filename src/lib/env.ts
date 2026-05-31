import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(16).default("dev-only-secret-change-me"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  DB_URL: z.string().default(""),
  DATABASE_URL: z.string().default(""),
  POSTGRES_URL: z.string().default(""),
  DB_SSL_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).default("false"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type AppEnv = z.infer<typeof baseSchema>;

export function getEnv(): AppEnv {
  const parsed = baseSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}

export function validateProductionEnv(env: AppEnv): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (env.NEXTAUTH_SECRET.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be at least 32 characters in production.");
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials are required in production.");
  }

  if (!env.DB_URL && !env.DATABASE_URL && !env.POSTGRES_URL) {
    throw new Error("DB_URL or DATABASE_URL or POSTGRES_URL is required in production.");
  }
}
