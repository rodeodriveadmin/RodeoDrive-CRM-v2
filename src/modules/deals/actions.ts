"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { DEAL_STAGES } from "./constants";

export interface DealInput {
  title: string;
  customerId?: string;
  value?: string;
  stage: string;
  expectedCloseDate?: string;
  owner?: string;
  notes?: string;
}

async function normalize(input: DealInput) {
  let customerName: string | null = null;
  if (input.customerId) {
    const [c] = await db
      .select({ firstName: schema.customers.firstName, lastName: schema.customers.lastName })
      .from(schema.customers)
      .where(eq(schema.customers.id, input.customerId));
    if (c) customerName = `${c.firstName} ${c.lastName}`;
  }
  const value = Number(input.value);
  return {
    title: input.title.trim(),
    customerId: input.customerId || null,
    customerName,
    value: Number.isFinite(value) && value > 0 ? value : null,
    stage: (DEAL_STAGES as readonly string[]).includes(input.stage) ? input.stage : "LEAD",
    expectedCloseDate: input.expectedCloseDate?.trim() || null,
    owner: input.owner?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createDeal(input: DealInput): Promise<ActionResult> {
  const actor = await requirePolicy("DEALS", "create");
  const data = await normalize(input);
  if (!data.title) return { error: "INVALID_INPUT" };

  const [row] = await db.insert(schema.deals).values(data).returning();
  await logActivity({
    entityType: "deal",
    entityId: row.id,
    action: "create",
    message: `Deal "${data.title}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/deals");
  return { ok: true, id: row.id };
}

export async function updateDeal(id: string, input: DealInput): Promise<ActionResult> {
  const actor = await requirePolicy("DEALS", "update");
  const data = await normalize(input);
  if (!data.title) return { error: "INVALID_INPUT" };

  await db
    .update(schema.deals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.deals.id, id));
  await logActivity({
    entityType: "deal",
    entityId: id,
    action: "update",
    message: `Deal "${data.title}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/deals");
  return { ok: true };
}

export async function setDealStage(id: string, stage: string): Promise<ActionResult> {
  const actor = await requirePolicy("DEALS", "update");
  if (!(DEAL_STAGES as readonly string[]).includes(stage)) return { error: "INVALID_INPUT" };
  await db.update(schema.deals).set({ stage, updatedAt: new Date() }).where(eq(schema.deals.id, id));
  await logActivity({
    entityType: "deal",
    entityId: id,
    action: "update",
    message: `Deal stage → ${stage}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/deals");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("DEALS", "delete");
  await db.delete(schema.deals).where(eq(schema.deals.id, id));
  await logActivity({
    entityType: "deal",
    entityId: id,
    action: "delete",
    message: "Deal deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/deals");
  return { ok: true };
}
