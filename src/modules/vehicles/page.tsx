import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { VehiclesView } from "./view";

export default async function VehiclesPage() {
  await requirePolicy("VEHICLES", "read");

  const rows = await db
    .select({
      id: schema.vehicles.id,
      customerId: schema.vehicles.customerId,
      make: schema.vehicles.make,
      model: schema.vehicles.model,
      year: schema.vehicles.year,
      vehicleType: schema.vehicles.vehicleType,
      color: schema.vehicles.color,
      plateNumber: schema.vehicles.plateNumber,
      vin: schema.vehicles.vin,
      notes: schema.vehicles.notes,
      completedServicesCount: schema.vehicles.completedServicesCount,
      ownerName: sql<string>`${schema.customers.firstName} || ' ' || ${schema.customers.lastName}`,
    })
    .from(schema.vehicles)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.vehicles.customerId))
    .orderBy(desc(schema.vehicles.createdAt));

  const customerRows = await db
    .select({
      id: schema.customers.id,
      name: sql<string>`${schema.customers.firstName} || ' ' || ${schema.customers.lastName}`,
    })
    .from(schema.customers)
    .orderBy(schema.customers.lastName, schema.customers.firstName);

  return <VehiclesView vehicles={rows} customers={customerRows} />;
}
