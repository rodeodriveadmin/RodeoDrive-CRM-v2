"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

export interface CustomerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  heardFrom?: string;
  socialPlatform?: string;
  referralName?: string;
  referralMobile?: string;
  heardFromOther?: string;
}

function normalize(input: CustomerInput) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    notes: input.notes?.trim() || null,
    heardFrom: input.heardFrom || null,
    socialPlatform: input.socialPlatform?.trim() || null,
    referralName: input.referralName?.trim() || null,
    referralMobile: input.referralMobile?.trim() || null,
    heardFromOther: input.heardFromOther?.trim() || null,
  };
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult> {
  const actor = await requirePolicy("CUSTOMERS", "create");
  const data = normalize(input);
  if (!data.firstName || !data.lastName) return { error: "INVALID_INPUT" };

  const [row] = await db
    .insert(schema.customers)
    .values({ ...data, createdBy: actor.email })
    .returning();

  await logActivity({
    entityType: "customer",
    entityId: row.id,
    action: "create",
    message: `Customer "${data.firstName} ${data.lastName}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/customers");
  return { ok: true, id: row.id };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const actor = await requirePolicy("CUSTOMERS", "update");
  const data = normalize(input);
  if (!data.firstName || !data.lastName) return { error: "INVALID_INPUT" };

  await db
    .update(schema.customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.customers.id, id));

  await logActivity({
    entityType: "customer",
    entityId: id,
    action: "update",
    message: `Customer "${data.firstName} ${data.lastName}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("CUSTOMERS", "delete");

  // vehicles cascade-delete with the customer (FK on delete cascade)
  await db.delete(schema.customers).where(eq(schema.customers.id, id));

  await logActivity({
    entityType: "customer",
    entityId: id,
    action: "delete",
    message: "Customer deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/customers");
  return { ok: true };
}
