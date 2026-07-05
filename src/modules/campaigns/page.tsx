import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { CampaignsView } from "./view";

export default async function CampaignsPage() {
  await requirePolicy("CAMPAIGNS", "read");

  const [leads, batches] = await Promise.all([
    db
      .select()
      .from(schema.campaignLeads)
      .orderBy(desc(schema.campaignLeads.createdAt))
      .limit(500),
    db.select().from(schema.campaignBatches).orderBy(desc(schema.campaignBatches.createdAt)),
  ]);

  return (
    <CampaignsView
      leads={leads.map((l) => ({
        id: l.id,
        customerName: l.customerName,
        mobile: l.mobile,
        serviceName: l.serviceName,
        serviceDate: l.serviceDate,
      }))}
      batches={batches.map((b) => ({
        id: b.id,
        fileName: b.fileName,
        totalRows: b.totalRows,
        importedRows: b.importedRows,
        duplicateRows: b.duplicateRows,
        skippedRows: b.skippedRows,
        createdBy: b.createdBy,
        createdAt: b.createdAt.toISOString(),
      }))}
    />
  );
}
