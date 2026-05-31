import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

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

const dbPath = resolve(process.cwd(), "data/app.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

const globalDb = globalThis as typeof globalThis & { __appDb?: DatabaseSync };

const db =
  globalDb.__appDb ??
  new DatabaseSync(dbPath, {
    open: true,
  });

if (!globalDb.__appDb) {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  globalDb.__appDb = db;
}

let initialized = false;

function normalizeNullable(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const sanitized = value.trim();
  return sanitized.length > 0 ? sanitized : null;
}

export function initDatabase(): void {
  if (initialized) {
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      message TEXT NOT NULL,
      user_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_api_logs_route ON api_logs(route);
    CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
  `);

  initialized = true;
}

export function upsertGoogleUser(input: UpsertGoogleUserInput): string {
  initDatabase();

  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const name = normalizeNullable(input.name);
  const image = normalizeNullable(input.image);

  const existingByProvider = db
    .prepare(`SELECT id FROM users WHERE provider = ? AND provider_account_id = ? LIMIT 1`)
    .get("google", input.googleSub) as { id: string } | undefined;

  if (existingByProvider?.id) {
    db.prepare(`UPDATE users SET email = ?, name = ?, image = ?, updated_at = ? WHERE id = ?`).run(
      email,
      name,
      image,
      now,
      existingByProvider.id,
    );
    return existingByProvider.id;
  }

  const existingByEmail = db
    .prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`)
    .get(email) as { id: string } | undefined;

  if (existingByEmail?.id) {
    db.prepare(
      `UPDATE users
       SET name = ?, image = ?, provider = ?, provider_account_id = ?, updated_at = ?
       WHERE id = ?`,
    ).run(name, image, "google", input.googleSub, now, existingByEmail.id);
    return existingByEmail.id;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, name, image, provider, provider_account_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, email, name, image, "google", input.googleSub, now, now);

  return id;
}

export function findUserById(userId: string): DbUserRow | null {
  initDatabase();

  const row = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(userId) as
    | DbUserRow
    | undefined;

  return row ?? null;
}

export function insertApiLog(input: ApiLogInput): void {
  initDatabase();

  db.prepare(
    `INSERT INTO api_logs (route, status_code, message, user_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(input.route, input.statusCode, input.message, input.userId ?? null, new Date().toISOString());
}
