"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

function revalidate(jobOrderId: string) {
  revalidatePath("/exit-permits");
  revalidatePath(`/job-orders/${jobOrderId}`);
}

async function setPermit(
  jobOrderId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_REQUIRED",
  note: string,
  actorEmail: string,
  actorName: string,
  step?: string
) {
  await db
    .update(schema.jobOrders)
    .set({
      exitPermitStatus: status,
      exitPermitNote: note.trim() || null,
      exitPermitBy: status === "PENDING" || status === "NOT_REQUIRED" ? null : actorEmail,
      exitPermitAt: status === "APPROVED" || status === "REJECTED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobOrders.id, jobOrderId));

  if (step) {
    await db.insert(schema.jobOrderSteps).values({
      jobOrderId,
      step,
      detail: note.trim(),
      actorEmail,
    });
  }
  await logActivity({
    entityType: "job_order",
    entityId: jobOrderId,
    action: "update",
    message: `Exit permit ${status}`,
    actorEmail,
    actorName,
  });
}

export async function requestExitPermit(jobOrderId: string): Promise<ActionResult> {
  const actor = await requirePolicy("EXIT_PERMITS", "create");
  await setPermit(jobOrderId, "PENDING", "", actor.email, actor.name, "permit_required");
  revalidate(jobOrderId);
  return { ok: true };
}

export async function approveExitPermit(jobOrderId: string, note: string): Promise<ActionResult> {
  const actor = await requirePolicy("EXIT_PERMITS", "approve");

  // A vehicle may not leave with an outstanding balance.
  const [order] = await db
    .select({ balanceDue: schema.jobOrders.balanceDue })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, jobOrderId));
  if (!order) return { error: "NOT_FOUND" };
  if (order.balanceDue > 0) return { error: "UNPAID" };

  await setPermit(jobOrderId, "APPROVED", note, actor.email, actor.name, "permit_approved");
  revalidate(jobOrderId);
  return { ok: true };
}

export async function rejectExitPermit(jobOrderId: string, note: string): Promise<ActionResult> {
  const actor = await requirePolicy("EXIT_PERMITS", "approve");
  await setPermit(jobOrderId, "REJECTED", note, actor.email, actor.name, "permit_rejected");
  revalidate(jobOrderId);
  return { ok: true };
}
