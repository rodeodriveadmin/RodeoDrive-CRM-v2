"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .slice(0, 64) || `dept-${Date.now()}`
  );
}

export async function createDepartment(name: string): Promise<ActionResult> {
  const actor = await requirePolicy("DEPARTMENTS_ADMIN", "create");
  const trimmed = name.trim();
  if (!trimmed) return { error: "EMPTY_NAME" };

  const [dept] = await db
    .insert(schema.departments)
    .values({ name: trimmed, key: slugify(trimmed) })
    .returning();

  await logActivity({
    entityType: "department",
    entityId: dept.id,
    action: "create",
    message: `Department "${trimmed}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function renameDepartment(id: string, name: string): Promise<ActionResult> {
  const actor = await requirePolicy("DEPARTMENTS_ADMIN", "update");
  const trimmed = name.trim();
  if (!trimmed) return { error: "EMPTY_NAME" };

  await db.update(schema.departments).set({ name: trimmed }).where(eq(schema.departments.id, id));
  await logActivity({
    entityType: "department",
    entityId: id,
    action: "update",
    message: `Department renamed to "${trimmed}"`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("DEPARTMENTS_ADMIN", "delete");

  const [members] = await db
    .select({ c: count() })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.departmentId, id));
  if (members.c > 0) return { error: "HAS_MEMBERS" };

  await db.delete(schema.departments).where(eq(schema.departments.id, id));
  await logActivity({
    entityType: "department",
    entityId: id,
    action: "delete",
    message: "Department deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/departments");
  return { ok: true };
}
