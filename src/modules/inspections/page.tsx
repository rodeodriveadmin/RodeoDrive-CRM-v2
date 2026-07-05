import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { InspectionsView } from "./view";

export default async function InspectionsPage() {
  await requirePolicy("INSPECTIONS", "read");

  const rows = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
      orderStatus: schema.jobOrders.status,
      inspectionStatus: schema.inspections.status,
      createdAt: schema.jobOrders.createdAt,
    })
    .from(schema.jobOrders)
    .leftJoin(schema.inspections, eq(schema.inspections.jobOrderId, schema.jobOrders.id))
    .where(inArray(schema.jobOrders.status, ["DRAFT", "OPEN", "IN_PROGRESS", "READY", "COMPLETED"]))
    .orderBy(desc(schema.jobOrders.createdAt));

  return (
    <InspectionsView
      orders={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}
