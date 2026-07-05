import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

// Production: PostgreSQL via DATABASE_URL. Development: embedded PGlite (./.pglite).
// Both go through Drizzle so the rest of the codebase never knows the difference.

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __rodeoDb?: Db };

function createDb(): Db {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzlePg(pool, { schema });
  }
  const client = new PGlite("./.pglite");
  return drizzlePglite(client, { schema }) as unknown as Db;
}

// Lazy proxy: the database is opened on first query, not at import time —
// build workers import route modules without touching the DB, and Next.js
// HMR reuses the instance cached on globalThis.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = (globalForDb.__rodeoDb ??= createDb());
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(instance) : value;
  },
});

export { schema };
