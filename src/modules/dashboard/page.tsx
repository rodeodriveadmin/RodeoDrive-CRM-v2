import { and, count, gte, lt, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/rbac/server";
import { DashboardView } from "./view";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const chartStart = new Date(today);
  chartStart.setDate(chartStart.getDate() - 13);

  const [
    [users],
    [depts],
    [rolesCount],
    [customersCount],
    [vehiclesCount],
    [servicesCount],
    [ordersCount],
    [todayCollected],
    [monthCollected],
    [outstanding],
    statusRows,
    chartPayments,
  ] = await Promise.all([
    db.select({ c: count() }).from(schema.userProfiles),
    db.select({ c: count() }).from(schema.departments),
    db.select({ c: count() }).from(schema.roles),
    db.select({ c: count() }).from(schema.customers),
    db.select({ c: count() }).from(schema.vehicles),
    db.select({ c: count() }).from(schema.services),
    db.select({ c: count() }).from(schema.jobOrders),
    db
      .select({ s: sum(schema.jobOrderPayments.amount) })
      .from(schema.jobOrderPayments)
      .where(and(gte(schema.jobOrderPayments.paidAt, today), lt(schema.jobOrderPayments.paidAt, tomorrow))),
    db
      .select({ s: sum(schema.jobOrderPayments.amount) })
      .from(schema.jobOrderPayments)
      .where(gte(schema.jobOrderPayments.paidAt, monthStart)),
    db.select({ s: sum(schema.jobOrders.balanceDue) }).from(schema.jobOrders),
    db
      .select({ status: schema.jobOrders.status, c: count() })
      .from(schema.jobOrders)
      .groupBy(schema.jobOrders.status),
    db
      .select({ amount: schema.jobOrderPayments.amount, paidAt: schema.jobOrderPayments.paidAt })
      .from(schema.jobOrderPayments)
      .where(gte(schema.jobOrderPayments.paidAt, chartStart)),
  ]);

  // 14 daily buckets for the collected chart
  const chart: Array<{ date: string; total: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartStart);
    d.setDate(d.getDate() + i);
    chart.push({ date: d.toISOString().slice(0, 10), total: 0 });
  }
  for (const p of chartPayments) {
    const key = startOfDay(p.paidAt).toISOString().slice(0, 10);
    const bucket = chart.find((b) => b.date === key);
    if (bucket) bucket.total += p.amount;
  }

  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r.status] = r.c;

  return (
    <DashboardView
      userName={user.name}
      stats={{
        users: users.c,
        departments: depts.c,
        roles: rolesCount.c,
        customers: customersCount.c,
        vehicles: vehiclesCount.c,
        services: servicesCount.c,
        jobOrders: ordersCount.c,
      }}
      kpis={{
        todayCollected: Number(todayCollected?.s ?? 0),
        monthCollected: Number(monthCollected?.s ?? 0),
        outstanding: Number(outstanding?.s ?? 0),
        openOrders:
          (byStatus["OPEN"] ?? 0) + (byStatus["IN_PROGRESS"] ?? 0) + (byStatus["READY"] ?? 0),
      }}
      chart={chart}
      byStatus={byStatus}
    />
  );
}
