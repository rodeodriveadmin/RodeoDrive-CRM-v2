"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { count, eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { RESOURCE_KEYS, type PolicyFlags, type ResourceKey } from "@/lib/rbac/keys";

export async function createRole(name: string, description: string): Promise<ActionResult> {
  const actor = await requirePolicy("ROLES_POLICIES_ADMIN", "create");
  const trimmed = name.trim();
  if (!trimmed) return { error: "EMPTY_NAME" };

  const [role] = await db
    .insert(schema.roles)
    .values({ name: trimmed, description: description.trim() || null })
    .returning();

  await logActivity({
    entityType: "role",
    entityId: role.id,
    action: "create",
    message: `Role "${trimmed}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/roles");
  return { ok: true, id: role.id };
}

export async function updateRole(id: string, name: string, description: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requirePolicy("ROLES_POLICIES_ADMIN", "update");
  await db
    .update(schema.roles)
    .set({ name: name.trim(), description: description.trim() || null, isActive })
    .where(eq(schema.roles.id, id));
  await logActivity({
    entityType: "role",
    entityId: id,
    action: "update",
    message: `Role "${name}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("ROLES_POLICIES_ADMIN", "delete");

  const [assigned] = await db
    .select({ c: count() })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.roleId, id));
  if (assigned.c > 0) return { error: "IN_USE" };

  await db.delete(schema.roles).where(eq(schema.roles.id, id));
  await logActivity({
    entityType: "role",
    entityId: id,
    action: "delete",
    message: "Role deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/roles");
  return { ok: true };
}

/** Replaces the full policy matrix of a role. */
export async function saveRolePolicies(
  roleId: string,
  policies: Partial<Record<ResourceKey, PolicyFlags>>
): Promise<ActionResult> {
  const actor = await requirePolicy("ROLES_POLICIES_ADMIN", "update");

  for (const key of RESOURCE_KEYS) {
    const flags = policies[key];
    if (!flags) continue;
    const existing = await db
      .select({ id: schema.rolePolicies.id })
      .from(schema.rolePolicies)
      .where(and(eq(schema.rolePolicies.roleId, roleId), eq(schema.rolePolicies.policyKey, key)));
    if (existing.length > 0) {
      await db
        .update(schema.rolePolicies)
        .set(flags)
        .where(eq(schema.rolePolicies.id, existing[0].id));
    } else {
      await db.insert(schema.rolePolicies).values({ roleId, policyKey: key, ...flags });
    }
  }

  await logActivity({
    entityType: "role",
    entityId: roleId,
    action: "update",
    message: "Role policies updated",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/roles");
  return { ok: true };
}
