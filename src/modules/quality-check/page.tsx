import { count, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, requirePolicy } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/keys";
import { QualityCheckView } from "./view";

export default async function QualityCheckPage() {
  await requirePolicy("QUALITY_CHECK", "read");
  const me = await getCurrentUser();

  const rows = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
      orderStatus: schema.jobOrders.status,
      qualityCheckStatus: schema.jobOrders.qualityCheckStatus,
      qualityCheckNotes: schema.jobOrders.qualityCheckNotes,
      qualityCheckedBy: schema.jobOrders.qualityCheckedBy,
      itemsTotal: count(schema.jobOrderServices.id),
    })
    .from(schema.jobOrders)
    .leftJoin(schema.jobOrderServices, eq(schema.jobOrderServices.jobOrderId, schema.jobOrders.id))
    .where(inArray(schema.jobOrders.status, ["IN_PROGRESS", "READY", "COMPLETED"]))
    .groupBy(schema.jobOrders.id)
    .orderBy(desc(schema.jobOrders.createdAt));

  return (
    <QualityCheckView
      orders={rows}
      canApprove={!!me && can(me.policies, "QUALITY_CHECK", "approve", me.isRoot)}
    />
  );
}
