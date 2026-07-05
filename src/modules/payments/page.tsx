import { desc, eq, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { PaymentsView } from "./view";

export default async function PaymentsPage() {
  await requirePolicy("PAYMENTS", "read");

  const rows = await db
    .select({
      id: schema.jobOrderPayments.id,
      amount: schema.jobOrderPayments.amount,
      method: schema.jobOrderPayments.method,
      reference: schema.jobOrderPayments.reference,
      receiptNumber: schema.jobOrderPayments.receiptNumber,
      paidAt: schema.jobOrderPayments.paidAt,
      createdBy: schema.jobOrderPayments.createdBy,
      jobOrderId: schema.jobOrderPayments.jobOrderId,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
    })
    .from(schema.jobOrderPayments)
    .innerJoin(schema.jobOrders, eq(schema.jobOrders.id, schema.jobOrderPayments.jobOrderId))
    .orderBy(desc(schema.jobOrderPayments.paidAt));

  const [outstanding] = await db
    .select({ s: sum(schema.jobOrders.balanceDue) })
    .from(schema.jobOrders);

  return (
    <PaymentsView
      payments={rows.map((r) => ({ ...r, paidAt: r.paidAt.toISOString() }))}
      outstanding={Number(outstanding?.s ?? 0)}
    />
  );
}
