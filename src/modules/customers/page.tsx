import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { CustomersView } from "./view";

export default async function CustomersPage() {
  await requirePolicy("CUSTOMERS", "read");

  const rows = await db
    .select({
      id: schema.customers.id,
      firstName: schema.customers.firstName,
      lastName: schema.customers.lastName,
      email: schema.customers.email,
      phone: schema.customers.phone,
      company: schema.customers.company,
      notes: schema.customers.notes,
      heardFrom: schema.customers.heardFrom,
      socialPlatform: schema.customers.socialPlatform,
      referralName: schema.customers.referralName,
      referralMobile: schema.customers.referralMobile,
      heardFromOther: schema.customers.heardFromOther,
      createdAt: schema.customers.createdAt,
      vehiclesCount: count(schema.vehicles.id),
    })
    .from(schema.customers)
    .leftJoin(schema.vehicles, eq(schema.vehicles.customerId, schema.customers.id))
    .groupBy(schema.customers.id)
    .orderBy(desc(schema.customers.createdAt));

  return (
    <CustomersView
      customers={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}
