import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { UsersView } from "./view";

export default async function UsersAdminPage() {
  await requirePolicy("USERS_ADMIN", "read");

  const rows = await db
    .select({
      userId: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      createdAt: schema.user.createdAt,
      employeeId: schema.userProfiles.employeeId,
      mobileNumber: schema.userProfiles.mobileNumber,
      departmentId: schema.userProfiles.departmentId,
      roleId: schema.userProfiles.roleId,
      isActive: schema.userProfiles.isActive,
      isRoot: schema.userProfiles.isRoot,
      isBlocked: schema.userProfiles.isBlocked,
    })
    .from(schema.user)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .orderBy(schema.user.createdAt);

  const departments = await db.select().from(schema.departments).orderBy(schema.departments.name);
  const roles = await db.select().from(schema.roles).orderBy(schema.roles.name);

  return (
    <UsersView
      users={rows.map((r) => ({
        ...r,
        isActive: r.isActive ?? true,
        isRoot: r.isRoot ?? false,
        isBlocked: r.isBlocked ?? false,
        createdAt: r.createdAt.toISOString(),
      }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      roles={roles.map((r) => ({ id: r.id, name: r.name }))}
    />
  );
}
