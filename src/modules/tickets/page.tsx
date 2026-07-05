import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { TicketsView } from "./view";

export default async function TicketsPage() {
  await requirePolicy("TICKETS", "read");

  const rows = await db
    .select()
    .from(schema.tickets)
    .orderBy(desc(schema.tickets.updatedAt));

  const customerRows = await db
    .select({
      id: schema.customers.id,
      name: sql<string>`${schema.customers.firstName} || ' ' || ${schema.customers.lastName}`,
    })
    .from(schema.customers)
    .orderBy(schema.customers.lastName, schema.customers.firstName);

  return (
    <TicketsView
      tickets={rows.map((r) => ({
        id: r.id,
        title: r.title,
        customerName: r.customerName,
        status: r.status,
        priority: r.priority,
        assignedTo: r.assignedTo,
        updatedAt: r.updatedAt.toISOString(),
      }))}
      customers={customerRows}
    />
  );
}
