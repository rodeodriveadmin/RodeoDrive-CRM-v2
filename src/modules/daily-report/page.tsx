import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { DailyReportView } from "./view";

function dayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePolicy("DAILY_REPORT", "read");
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : new Date().toISOString().slice(0, 10);
  const { start, end } = dayRange(date);

  const [ordersCreated, payments, newCustomers, servicesFinished, steps] = await Promise.all([
    db
      .select({
        id: schema.jobOrders.id,
        orderNumber: schema.jobOrders.orderNumber,
        customerName: schema.jobOrders.customerName,
        status: schema.jobOrders.status,
        totalAmount: schema.jobOrders.totalAmount,
        balanceDue: schema.jobOrders.balanceDue,
      })
      .from(schema.jobOrders)
      .where(and(gte(schema.jobOrders.createdAt, start), lt(schema.jobOrders.createdAt, end)))
      .orderBy(desc(schema.jobOrders.createdAt)),
    db
      .select({
        id: schema.jobOrderPayments.id,
        amount: schema.jobOrderPayments.amount,
        method: schema.jobOrderPayments.method,
        paidAt: schema.jobOrderPayments.paidAt,
        jobOrderId: schema.jobOrderPayments.jobOrderId,
        orderNumber: schema.jobOrders.orderNumber,
        customerName: schema.jobOrders.customerName,
      })
      .from(schema.jobOrderPayments)
      .innerJoin(schema.jobOrders, eq(schema.jobOrders.id, schema.jobOrderPayments.jobOrderId))
      .where(and(gte(schema.jobOrderPayments.paidAt, start), lt(schema.jobOrderPayments.paidAt, end)))
      .orderBy(desc(schema.jobOrderPayments.paidAt)),
    db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(and(gte(schema.customers.createdAt, start), lt(schema.customers.createdAt, end))),
    db
      .select({ id: schema.jobOrderServices.id })
      .from(schema.jobOrderServices)
      .where(and(gte(schema.jobOrderServices.endedAt, start), lt(schema.jobOrderServices.endedAt, end))),
    // orders completed that day = status steps recording a transition to COMPLETED
    db
      .select({ id: schema.jobOrderSteps.id, detail: schema.jobOrderSteps.detail })
      .from(schema.jobOrderSteps)
      .where(
        and(
          eq(schema.jobOrderSteps.step, "status"),
          gte(schema.jobOrderSteps.createdAt, start),
          lt(schema.jobOrderSteps.createdAt, end)
        )
      ),
  ]);

  const completedCount = steps.filter((s) => (s.detail ?? "").endsWith("→ COMPLETED")).length;

  const byMethod: Record<string, number> = {};
  let collected = 0;
  for (const p of payments) {
    collected += p.amount;
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
  }

  return (
    <DailyReportView
      date={date}
      kpis={{
        ordersCreated: ordersCreated.length,
        ordersCompleted: completedCount,
        collected,
        newCustomers: newCustomers.length,
        servicesFinished: servicesFinished.length,
      }}
      byMethod={byMethod}
      payments={payments.map((p) => ({ ...p, paidAt: p.paidAt.toISOString() }))}
      orders={ordersCreated}
    />
  );
}
