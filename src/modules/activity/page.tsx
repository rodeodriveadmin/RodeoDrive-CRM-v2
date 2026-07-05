import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { ActivityView } from "./view";

export default async function ActivityPage() {
  await requirePolicy("ACTIVITY_LOG", "read");

  const rows = await db
    .select()
    .from(schema.activityLogs)
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(200);

  return (
    <ActivityView
      logs={rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        action: r.action,
        message: r.message,
        actorEmail: r.actorEmail,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
