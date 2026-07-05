import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import type { PolicyFlags, ResourceKey } from "@/lib/rbac/keys";
import { RolesView } from "./view";

export default async function RolesAdminPage() {
  await requirePolicy("ROLES_POLICIES_ADMIN", "read");

  const roleRows = await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      description: schema.roles.description,
      isActive: schema.roles.isActive,
      assigned: count(schema.userProfiles.id),
    })
    .from(schema.roles)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.roleId, schema.roles.id))
    .groupBy(schema.roles.id)
    .orderBy(schema.roles.name);

  const policyRows = await db.select().from(schema.rolePolicies);

  const policiesByRole: Record<string, Partial<Record<ResourceKey, PolicyFlags>>> = {};
  for (const p of policyRows) {
    (policiesByRole[p.roleId] ??= {})[p.policyKey as ResourceKey] = {
      canRead: p.canRead,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete,
      canApprove: p.canApprove,
    };
  }

  return <RolesView roles={roleRows} policiesByRole={policiesByRole} />;
}
