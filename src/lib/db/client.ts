import { createClient, type Client } from "@libsql/client";
import { SCHEMA } from "./schema";

// One shared libSQL connection for the server.
//
// Locally this is a plain SQLite file (globalgig.db in the project root).
// On serverless hosts (Vercel, Render free tier) point TURSO_DATABASE_URL at a
// hosted Turso database, because those filesystems don't persist between
// requests. The SQL is identical either way.
//
// Server-only: never import this from a "use client" component.

let client: Client | undefined;

// Where the database lives. Order of preference:
// 1. TURSO_DATABASE_URL: a persistent hosted database (recommended for hosting).
// 2. On Vercel without Turso: /tmp, the only writable path in a serverless
//    function. This keeps a zero-config demo deploy working, but data is
//    per-instance and resets on cold starts, so it's for demos only.
// 3. Locally: globalgig.db in the project root.
function databaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  if (process.env.VERCEL) return "file:/tmp/globalgig.db";
  return "file:globalgig.db";
}
let ready: Promise<void> | undefined;

export async function getDb(): Promise<Client> {
  if (!client) {
    client = createClient({
      url: databaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  // Create tables on first use so a fresh clone works with zero setup steps.
  // CREATE TABLE IF NOT EXISTS makes this safe to run on every cold start.
  if (!ready) {
    const db = client;
    ready = db.executeMultiple(SCHEMA).catch((err) => {
      ready = undefined; // let the next request retry instead of caching the failure
      throw err;
    });
  }
  await ready;
  return client;
}
