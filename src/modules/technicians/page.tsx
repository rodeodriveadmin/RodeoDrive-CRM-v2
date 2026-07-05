import { eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { TechniciansView } from "./view";

export default async function TechniciansPage() {
  await requirePolicy("TECHNICIANS", "read");

  const technicians = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.isTechnician, true))
    .orderBy(schema.employees.lastName, schema.employees.firstName);

  // execution stats grouped client-side by technician name (items store the
  // executing user's display name)
  const items = await db
    .select({
      technician: schema.jobOrderServices.technician,
      isCompleted: schema.jobOrderServices.isCompleted,
      startedAt: schema.jobOrderServices.startedAt,
      endedAt: schema.jobOrderServices.endedAt,
    })
    .from(schema.jobOrderServices)
    .where(isNotNull(schema.jobOrderServices.technician));

  const stats: Record<string, { completed: number; running: number; minutes: number }> = {};
  for (const i of items) {
    const key = (i.technician ?? "").trim();
    if (!key) continue;
    const s = (stats[key] ??= { completed: 0, running: 0, minutes: 0 });
    if (i.isCompleted || i.endedAt) s.completed += 1;
    else if (i.startedAt) s.running += 1;
    if (i.startedAt && i.endedAt) {
      s.minutes += Math.max(1, Math.round((i.endedAt.getTime() - i.startedAt.getTime()) / 60000));
    }
  }

  return (
    <TechniciansView
      technicians={technicians.map((r) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`,
        position: r.position,
        phone: r.phone,
        isActive: r.isActive,
      }))}
      stats={stats}
    />
  );
}
