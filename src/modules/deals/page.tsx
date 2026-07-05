import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { DealsView } from "./view";

export default async function DealsPage() {
  await requirePolicy("DEALS", "read");

  const rows = await db.select().from(schema.deals).orderBy(desc(schema.deals.updatedAt));

  const customerRows = await db
    .select({
      id: schema.customers.id,
      name: sql<string>`${schema.customers.firstName} || ' ' || ${schema.customers.lastName}`,
    })
    .from(schema.customers)
    .orderBy(schema.customers.lastName, schema.customers.firstName);

  return (
    <DealsView
      deals={rows.map((r) => ({
        id: r.id,
        title: r.title,
        customerId: r.customerId,
        customerName: r.customerName,
        value: r.value,
        stage: r.stage,
        expectedCloseDate: r.expectedCloseDate,
        owner: r.owner,
        notes: r.notes,
      }))}
      customers={customerRows}
    />
  );
}
