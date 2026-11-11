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
let ready: Promise<void> | undefined;

export async function getDb(): Promise<Client> {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:globalgig.db",
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
