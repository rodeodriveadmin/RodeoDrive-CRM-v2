import { asc, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { ExecutionView } from "./view";

export default async function ServiceExecutionPage() {
  await requirePolicy("SERVICE_EXECUTION", "read");

  const orders = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
      status: schema.jobOrders.status,
      priority: schema.jobOrders.priority,
    })
    .from(schema.jobOrders)
    .where(inArray(schema.jobOrders.status, ["OPEN", "IN_PROGRESS", "READY"]))
    .orderBy(desc(schema.jobOrders.createdAt));

  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length
    ? await db
        .select()
        .from(schema.jobOrderServices)
        .where(inArray(schema.jobOrderServices.jobOrderId, orderIds))
        .orderBy(asc(schema.jobOrderServices.createdAt))
    : [];

  return (
    <ExecutionView
      orders={orders}
      items={items.map((i) => ({
        id: i.id,
        jobOrderId: i.jobOrderId,
        name: i.name,
        qty: i.qty,
        technician: i.technician,
        isCompleted: i.isCompleted,
        startedAt: i.startedAt ? i.startedAt.toISOString() : null,
        endedAt: i.endedAt ? i.endedAt.toISOString() : null,
      }))}
    />
  );
}
