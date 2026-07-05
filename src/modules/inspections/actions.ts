"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import type { InspectionItemState } from "./config";

function revalidate(jobOrderId: string) {
  revalidatePath("/inspections");
  revalidatePath(`/inspections/${jobOrderId}`);
  revalidatePath(`/job-orders/${jobOrderId}`);
}

export async function startInspection(jobOrderId: string): Promise<ActionResult> {
  const actor = await requirePolicy("INSPECTIONS", "create");

  const [existing] = await db
    .select({ id: schema.inspections.id })
    .from(schema.inspections)
    .where(eq(schema.inspections.jobOrderId, jobOrderId));
  if (existing) return { ok: true, id: existing.id };

  const [row] = await db
    .insert(schema.inspections)
    .values({ jobOrderId, startedBy: actor.email })
    .returning();

  await db.insert(schema.jobOrderSteps).values({
    jobOrderId,
    step: "inspection_started",
    detail: "",
    actorEmail: actor.email,
  });
  await logActivity({
    entityType: "inspection",
    entityId: row.id,
    action: "create",
    message: "Inspection started",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(jobOrderId);
  return { ok: true, id: row.id };
}

export async function saveInspection(
  jobOrderId: string,
  state: Record<string, InspectionItemState>,
  generalNotes: string
): Promise<ActionResult> {
  const actor = await requirePolicy("INSPECTIONS", "update");

  await db
    .update(schema.inspections)
    .set({
      stateJson: JSON.stringify(state),
      generalNotes: generalNotes.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.inspections.jobOrderId, jobOrderId));

  await logActivity({
    entityType: "inspection",
    entityId: jobOrderId,
    action: "update",
    message: "Inspection saved",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(jobOrderId);
  return { ok: true };
}

export async function completeInspection(
  jobOrderId: string,
  state: Record<string, InspectionItemState>,
  generalNotes: string
): Promise<ActionResult> {
  const actor = await requirePolicy("INSPECTIONS", "update");

  await db
    .update(schema.inspections)
    .set({
      stateJson: JSON.stringify(state),
      generalNotes: generalNotes.trim() || null,
      status: "COMPLETED",
      completedBy: actor.email,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.inspections.jobOrderId, jobOrderId));

  await db.insert(schema.jobOrderSteps).values({
    jobOrderId,
    step: "inspection_completed",
    detail: "",
    actorEmail: actor.email,
  });
  await logActivity({
    entityType: "inspection",
    entityId: jobOrderId,
    action: "update",
    message: "Inspection completed",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(jobOrderId);
  return { ok: true };
}
