"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";

function revalidate(jobOrderId: string) {
  revalidatePath("/service-execution");
  revalidatePath(`/job-orders/${jobOrderId}`);
}

export async function startServiceItem(itemId: string): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_EXECUTION", "update");
  const [item] = await db
    .select({
      jobOrderId: schema.jobOrderServices.jobOrderId,
      name: schema.jobOrderServices.name,
      startedAt: schema.jobOrderServices.startedAt,
    })
    .from(schema.jobOrderServices)
    .where(eq(schema.jobOrderServices.id, itemId));
  if (!item) return { error: "NOT_FOUND" };
  if (item.startedAt) return { ok: true };

  await db
    .update(schema.jobOrderServices)
    .set({ startedAt: new Date(), technician: actor.name })
    .where(eq(schema.jobOrderServices.id, itemId));

  await db.insert(schema.jobOrderSteps).values({
    jobOrderId: item.jobOrderId,
    step: "service_started",
    detail: item.name,
    actorEmail: actor.email,
  });
  revalidate(item.jobOrderId);
  return { ok: true };
}

export async function finishServiceItem(itemId: string): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_EXECUTION", "update");
  const [item] = await db
    .select({
      jobOrderId: schema.jobOrderServices.jobOrderId,
      name: schema.jobOrderServices.name,
      startedAt: schema.jobOrderServices.startedAt,
    })
    .from(schema.jobOrderServices)
    .where(eq(schema.jobOrderServices.id, itemId));
  if (!item) return { error: "NOT_FOUND" };

  await db
    .update(schema.jobOrderServices)
    .set({
      endedAt: new Date(),
      startedAt: item.startedAt ?? new Date(),
      isCompleted: true,
      technician: actor.name,
    })
    .where(eq(schema.jobOrderServices.id, itemId));

  await db.insert(schema.jobOrderSteps).values({
    jobOrderId: item.jobOrderId,
    step: "service_finished",
    detail: item.name,
    actorEmail: actor.email,
  });
  revalidate(item.jobOrderId);
  return { ok: true };
}
