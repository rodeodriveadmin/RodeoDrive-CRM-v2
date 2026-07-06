import { sql } from "drizzle-orm";
import { db } from "@/db";

// Idempotent bootstrap for the 2026-07 auth-security release: the brute-force
// columns must exist before any sign-in hook runs. IF NOT EXISTS makes this a
// no-op once applied (and on dev PGlite where drizzle push already added them).
export async function ensureAuthSecurityColumns() {
  try {
    await db.execute(
      sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0 NOT NULL`
    );
    await db.execute(
      sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false NOT NULL`
    );
    console.log("[bootstrap] auth security columns ensured");
  } catch (err) {
    console.error("[bootstrap] failed to ensure auth security columns:", err);
  }
}
