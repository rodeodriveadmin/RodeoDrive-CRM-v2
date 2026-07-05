import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { InspectionDetailView } from "./detail-view";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("INSPECTIONS", "read");
  const { id } = await params;

  const [order] = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
    })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, id));

  const [inspection] = order
    ? await db.select().from(schema.inspections).where(eq(schema.inspections.jobOrderId, id))
    : [];

  return (
    <InspectionDetailView
      order={order ?? null}
      inspection={
        inspection
          ? {
              status: inspection.status,
              stateJson: inspection.stateJson,
              generalNotes: inspection.generalNotes,
              completedBy: inspection.completedBy,
            }
          : null
      }
    />
  );
}
