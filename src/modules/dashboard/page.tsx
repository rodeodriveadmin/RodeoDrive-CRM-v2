import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/rbac/server";
import { DashboardView } from "./view";

export default async function DashboardPage() {
  const user = await requireUser();

  const [[users], [depts], [rolesCount], [customersCount], [vehiclesCount], [servicesCount], [ordersCount]] =
    await Promise.all([
      db.select({ c: count() }).from(schema.userProfiles),
      db.select({ c: count() }).from(schema.departments),
      db.select({ c: count() }).from(schema.roles),
      db.select({ c: count() }).from(schema.customers),
      db.select({ c: count() }).from(schema.vehicles),
      db.select({ c: count() }).from(schema.services),
      db.select({ c: count() }).from(schema.jobOrders),
    ]);

  return (
    <DashboardView
      userName={user.name}
      stats={{
        users: users.c,
        departments: depts.c,
        roles: rolesCount.c,
        customers: customersCount.c,
        vehicles: vehiclesCount.c,
        services: servicesCount.c,
        jobOrders: ordersCount.c,
      }}
    />
  );
}
