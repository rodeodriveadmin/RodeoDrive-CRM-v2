import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { can, type PolicyAction, type PolicySet, type ResourceKey } from "./keys";

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  profileId: string | null;
  isActive: boolean;
  isRoot: boolean;
  departmentId: string | null;
  departmentName: string | null;
  roleId: string | null;
  roleName: string | null;
  policies: PolicySet;
}

/** Loads the signed-in user with profile, role and policy set. Request-cached. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [row] = await db
    .select({
      profileId: schema.userProfiles.id,
      isActive: schema.userProfiles.isActive,
      isRoot: schema.userProfiles.isRoot,
      departmentId: schema.userProfiles.departmentId,
      roleId: schema.userProfiles.roleId,
    })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, session.user.id));

  let departmentName: string | null = null;
  let roleName: string | null = null;
  const policies: PolicySet = {};

  if (row?.departmentId) {
    const [d] = await db
      .select({ name: schema.departments.name })
      .from(schema.departments)
      .where(eq(schema.departments.id, row.departmentId));
    departmentName = d?.name ?? null;
  }

  if (row?.roleId) {
    const [r] = await db
      .select({ name: schema.roles.name })
      .from(schema.roles)
      .where(eq(schema.roles.id, row.roleId));
    roleName = r?.name ?? null;

    const rows = await db
      .select()
      .from(schema.rolePolicies)
      .where(eq(schema.rolePolicies.roleId, row.roleId));
    for (const p of rows) {
      policies[p.policyKey as ResourceKey] = {
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
        canApprove: p.canApprove,
      };
    }
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    profileId: row?.profileId ?? null,
    isActive: row?.isActive ?? true,
    isRoot: row?.isRoot ?? false,
    departmentId: row?.departmentId ?? null,
    departmentName,
    roleId: row?.roleId ?? null,
    roleName,
    policies,
  };
});

/** Redirects to /login when unauthenticated or deactivated. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !user.isActive) redirect("/login");
  return user;
}

/** Server-action / page guard. Throws when the caller lacks the permission. */
export async function requirePolicy(
  key: ResourceKey,
  action: PolicyAction
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.policies, key, action, user.isRoot)) {
    throw new Error(`FORBIDDEN: ${key}.${action}`);
  }
  return user;
}
