import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { CustomerDetailView } from "./detail-view";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("CUSTOMERS", "read");
  const { id } = await params;

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id));

  const vehicleRows = customer
    ? await db
        .select()
        .from(schema.vehicles)
        .where(eq(schema.vehicles.customerId, id))
        .orderBy(desc(schema.vehicles.createdAt))
    : [];

  return (
    <CustomerDetailView
      customer={
        customer
          ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              company: customer.company,
              notes: customer.notes,
              heardFrom: customer.heardFrom,
              socialPlatform: customer.socialPlatform,
              referralName: customer.referralName,
              referralMobile: customer.referralMobile,
              heardFromOther: customer.heardFromOther,
              createdAt: customer.createdAt.toISOString(),
            }
          : null
      }
      vehicles={vehicleRows.map((v) => ({
        id: v.id,
        customerId: v.customerId,
        make: v.make,
        model: v.model,
        year: v.year,
        vehicleType: v.vehicleType,
        color: v.color,
        plateNumber: v.plateNumber,
        vin: v.vin,
        notes: v.notes,
        completedServicesCount: v.completedServicesCount,
      }))}
    />
  );
}
