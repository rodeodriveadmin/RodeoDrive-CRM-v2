"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

const QC_STATUSES = ["PENDING", "PASSED", "FAILED"] as const;

export async function setQualityCheck(
  jobOrderId: string,
  status: string,
  notes: string
): Promise<ActionResult> {
  // Passing/failing an order is an approval-level decision.
  const actor = await requirePolicy("QUALITY_CHECK", status === "PENDING" ? "update" : "approve");
  if (!(QC_STATUSES as readonly string[]).includes(status)) return { error: "INVALID_INPUT" };

  const [order] = await db
    .select({ orderNumber: schema.jobOrders.orderNumber })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, jobOrderId));
  if (!order) return { error: "NOT_FOUND" };

  await db
    .update(schema.jobOrders)
    .set({
      qualityCheckStatus: status,
      qualityCheckNotes: notes.trim() || null,
      qualityCheckedBy: status === "PENDING" ? null : actor.email,
      qualityCheckedAt: status === "PENDING" ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.jobOrders.id, jobOrderId));

  const step = status === "PASSED" ? "qc_passed" : status === "FAILED" ? "qc_failed" : "qc_reset";
  await db.insert(schema.jobOrderSteps).values({
    jobOrderId,
    step,
    detail: notes.trim(),
    actorEmail: actor.email,
  });
  await logActivity({
    entityType: "job_order",
    entityId: jobOrderId,
    action: "update",
    message: `Quality check ${status} for ${order.orderNumber}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });

  revalidatePath("/quality-check");
  revalidatePath(`/job-orders/${jobOrderId}`);
  return { ok: true };
}
