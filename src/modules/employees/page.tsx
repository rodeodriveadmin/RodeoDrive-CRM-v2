import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { EmployeesView } from "./view";

export default async function EmployeesPage() {
  await requirePolicy("EMPLOYEES", "read");

  const rows = await db
    .select()
    .from(schema.employees)
    .orderBy(schema.employees.lastName, schema.employees.firstName);

  return (
    <EmployeesView
      employees={rows.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        position: r.position,
        email: r.email,
        phone: r.phone,
        salary: r.salary,
        isTechnician: r.isTechnician,
        isActive: r.isActive,
      }))}
    />
  );
}
