"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  phone?: string;
  salary?: string;
  isTechnician: boolean;
  isActive: boolean;
}

function normalize(input: EmployeeInput) {
  const salary = Number(input.salary);
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    position: input.position?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    salary: Number.isFinite(salary) && salary > 0 ? salary : null,
    isTechnician: !!input.isTechnician,
    isActive: !!input.isActive,
  };
}

function revalidate() {
  revalidatePath("/employees");
  revalidatePath("/technicians");
}

export async function createEmployee(input: EmployeeInput): Promise<ActionResult> {
  const actor = await requirePolicy("EMPLOYEES", "create");
  const data = normalize(input);
  if (!data.firstName || !data.lastName) return { error: "INVALID_INPUT" };

  const [row] = await db.insert(schema.employees).values(data).returning();
  await logActivity({
    entityType: "employee",
    entityId: row.id,
    action: "create",
    message: `Employee "${data.firstName} ${data.lastName}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate();
  return { ok: true, id: row.id };
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<ActionResult> {
  const actor = await requirePolicy("EMPLOYEES", "update");
  const data = normalize(input);
  if (!data.firstName || !data.lastName) return { error: "INVALID_INPUT" };

  await db
    .update(schema.employees)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.employees.id, id));
  await logActivity({
    entityType: "employee",
    entityId: id,
    action: "update",
    message: `Employee "${data.firstName} ${data.lastName}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate();
  return { ok: true };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("EMPLOYEES", "delete");
  await db.delete(schema.employees).where(eq(schema.employees.id, id));
  await logActivity({
    entityType: "employee",
    entityId: id,
    action: "delete",
    message: "Employee deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate();
  return { ok: true };
}
