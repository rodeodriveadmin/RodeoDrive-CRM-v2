import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { InvoiceView } from "./invoice-view";

export default async function JobOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("JOB_ORDERS", "read");
  const { id } = await params;

  const [order] = await db.select().from(schema.jobOrders).where(eq(schema.jobOrders.id, id));
  const items = order
    ? await db
        .select()
        .from(schema.jobOrderServices)
        .where(eq(schema.jobOrderServices.jobOrderId, id))
        .orderBy(asc(schema.jobOrderServices.createdAt))
    : [];

  return (
    <InvoiceView
      order={
        order
          ? {
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              vehicleMake: order.vehicleMake,
              vehicleModel: order.vehicleModel,
              vehicleType: order.vehicleType,
              plateNumber: order.plateNumber,
              subtotal: order.subtotal,
              discountAmount: order.discountAmount,
              vatRate: order.vatRate,
              vatAmount: order.vatAmount,
              totalAmount: order.totalAmount,
              amountPaid: order.amountPaid,
              balanceDue: order.balanceDue,
              notes: order.notes,
              createdBy: order.createdBy,
              createdAt: order.createdAt.toISOString(),
            }
          : null
      }
      items={items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        total: i.lineTotal,
      }))}
    />
  );
}
