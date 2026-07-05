import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { SmsView } from "./view";

export default async function SmsPage() {
  await requirePolicy("SMS", "read");

  const [logs, leads] = await Promise.all([
    db.select().from(schema.smsLogs).orderBy(desc(schema.smsLogs.createdAt)).limit(100),
    db
      .select({ mobile: schema.campaignLeads.mobile })
      .from(schema.campaignLeads)
      .orderBy(desc(schema.campaignLeads.createdAt))
      .limit(1000),
  ]);

  return (
    <SmsView
      logs={logs.map((l) => ({
        id: l.id,
        message: l.message,
        recipientCount: l.recipientCount,
        status: l.status,
        createdBy: l.createdBy,
        createdAt: l.createdAt.toISOString(),
      }))}
      leadPhones={[...new Set(leads.map((l) => l.mobile))]}
    />
  );
}
