import "server-only";
import { db, schema } from "@/db";

/** Writes one audit-trail row. Never throws — logging must not break mutations. */
export async function logActivity(input: {
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  actorEmail?: string | null;
  actorName?: string | null;
}) {
  try {
    await db.insert(schema.activityLogs).values(input);
  } catch (err) {
    console.error("activity log failed", err);
  }
}
