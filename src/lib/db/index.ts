import { randomUUID } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { type Itinerary } from "@/lib/planner/schema";

type DbUserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  provider_account_id: string;
  created_at: string;
  updated_at: string;
};

type UpsertGoogleUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
  googleSub: string;
};

type ApiLogInput = {
  route: string;
  statusCode: number;
  message: string;
  userId?: string | null;
};

type CreateTripInput = {
  userId: string;
  destination: string;
  dateRange: string;
  budget: "lean" | "standard" | "premium";
  vibe: string;
};

export type TripRecord = {
  id: string;
  user_id: string;
  destination: string;
  date_range: string;
  budget: "lean" | "standard" | "premium";
  vibe: string;
  status: "drafting" | "ready" | "failed";
  itinerary_json: Itinerary | null;
  created_at: string;
  updated_at: string;
};

const globalDb = globalThis as typeof globalThis & {
  __appPgPool?: Pool;
  __schemaReadyPromise?: Promise<void>;
};

function normalizeNullable(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const sanitized = value.trim();
  return sanitized.length > 0 ? sanitized : null;
}

function getConnectionString(): string {
  const env = getEnv();
  const conn = env.DB_URL || env.DATABASE_URL || env.POSTGRES_URL;

  if (!conn) {
    throw new Error("Missing DB_URL/DATABASE_URL/POSTGRES_URL for database connection.");
  }

  return conn;
}

function normalizeConnectionString(raw: string): string {
  const url = new URL(raw);
  // We control TLS behavior via Pool.ssl to avoid sslmode/parser mismatches.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslrootcert");
  return url.toString();
}

function getPool(): Pool {
  if (globalDb.__appPgPool) {
    return globalDb.__appPgPool;
  }

  const env = getEnv();
  const rawConnectionString = getConnectionString();
  const connectionString = normalizeConnectionString(rawConnectionString);
  const rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED === "true";
  const shouldUseSsl = rawConnectionString.startsWith("postgres://") || rawConnectionString.startsWith("postgresql://");

  globalDb.__appPgPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    ssl: shouldUseSsl ? { rejectUnauthorized } : undefined,
  });

  return globalDb.__appPgPool;
}

async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function initDatabase(): Promise<void> {
  if (globalDb.__schemaReadyPromise) {
    return globalDb.__schemaReadyPromise;
  }

  globalDb.__schemaReadyPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        image TEXT,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id BIGSERIAL PRIMARY KEY,
        route TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        message TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        destination TEXT NOT NULL,
        date_range TEXT NOT NULL,
        budget TEXT NOT NULL CHECK (budget IN ('lean', 'standard', 'premium')),
        vibe TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'ready', 'failed')),
        itinerary_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_api_logs_route ON api_logs(route)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC)`);
  })();

  return globalDb.__schemaReadyPromise;
}

export async function upsertGoogleUser(input: UpsertGoogleUserInput): Promise<string> {
  await initDatabase();

  const email = input.email.trim().toLowerCase();
  const name = normalizeNullable(input.name);
  const image = normalizeNullable(input.image);

  const existingByProvider = await query<{ id: string }>(
    `SELECT id FROM users WHERE provider = 'google' AND provider_account_id = $1 LIMIT 1`,
    [input.googleSub],
  );

  if (existingByProvider[0]?.id) {
    const userId = existingByProvider[0].id;

    await query(
      `UPDATE users SET email = $1, name = $2, image = $3, updated_at = NOW() WHERE id = $4`,
      [email, name, image, userId],
    );

    return userId;
  }

  const existingByEmail = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );

  if (existingByEmail[0]?.id) {
    const userId = existingByEmail[0].id;

    await query(
      `UPDATE users
       SET name = $1, image = $2, provider = 'google', provider_account_id = $3, updated_at = NOW()
       WHERE id = $4`,
      [name, image, input.googleSub, userId],
    );

    return userId;
  }

  const id = randomUUID();

  await query(
    `INSERT INTO users (id, email, name, image, provider, provider_account_id)
     VALUES ($1, $2, $3, $4, 'google', $5)`,
    [id, email, name, image, input.googleSub],
  );

  return id;
}

export async function findUserById(userId: string): Promise<DbUserRow | null> {
  await initDatabase();

  const rows = await query<DbUserRow>(
    `SELECT id, email, name, image, provider, provider_account_id, created_at::text, updated_at::text
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  return rows[0] ?? null;
}

export async function insertApiLog(input: ApiLogInput): Promise<void> {
  try {
    await initDatabase();

    await query(
      `INSERT INTO api_logs (route, status_code, message, user_id)
       VALUES ($1, $2, $3, $4)`,
      [input.route, input.statusCode, input.message, input.userId ?? null],
    );
  } catch (error) {
    logger.warn({ error, route: input.route }, "Failed to persist API log");
  }
}

export async function createTrip(input: CreateTripInput): Promise<TripRecord> {
  await initDatabase();

  const tripId = randomUUID();
  const rows = await query<TripRecord>(
    `INSERT INTO trips (id, user_id, destination, date_range, budget, vibe, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'drafting')
     RETURNING id, user_id, destination, date_range, budget, vibe, status, itinerary_json, created_at::text, updated_at::text`,
    [tripId, input.userId, input.destination, input.dateRange, input.budget, input.vibe],
  );

  return rows[0];
}

export async function listTripsByUser(userId: string): Promise<TripRecord[]> {
  await initDatabase();

  const rows = await query<TripRecord>(
    `SELECT id, user_id, destination, date_range, budget, vibe, status, itinerary_json, created_at::text, updated_at::text
     FROM trips
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows;
}

export async function findTripByIdForUser(tripId: string, userId: string): Promise<TripRecord | null> {
  await initDatabase();

  const rows = await query<TripRecord>(
    `SELECT id, user_id, destination, date_range, budget, vibe, status, itinerary_json, created_at::text, updated_at::text
     FROM trips
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [tripId, userId],
  );

  return rows[0] ?? null;
}

export async function updateTripItinerary(
  tripId: string,
  userId: string,
  itinerary: Itinerary,
  status: "ready" | "failed" = "ready",
): Promise<TripRecord | null> {
  await initDatabase();

  const rows = await query<TripRecord>(
    `UPDATE trips
     SET itinerary_json = $1::jsonb, status = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING id, user_id, destination, date_range, budget, vibe, status, itinerary_json, created_at::text, updated_at::text`,
    [JSON.stringify(itinerary), status, tripId, userId],
  );

  return rows[0] ?? null;
}
