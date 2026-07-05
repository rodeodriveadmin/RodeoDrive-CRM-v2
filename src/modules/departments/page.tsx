import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { DepartmentsView } from "./view";

export default async function DepartmentsAdminPage() {
  await requirePolicy("DEPARTMENTS_ADMIN", "read");

  const rows = await db
    .select({
      id: schema.departments.id,
      key: schema.departments.key,
      name: schema.departments.name,
      createdAt: schema.departments.createdAt,
      members: count(schema.userProfiles.id),
    })
    .from(schema.departments)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.departmentId, schema.departments.id))
    .groupBy(schema.departments.id)
    .orderBy(schema.departments.name);

  return (
    <DepartmentsView
      departments={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}
