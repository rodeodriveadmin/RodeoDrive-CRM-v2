import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { ReportsView } from "./view";

export default async function ScheduledReportsPage() {
  await requirePolicy("SCHEDULED_REPORTS", "read");

  const rows = await db
    .select()
    .from(schema.scheduledReports)
    .orderBy(desc(schema.scheduledReports.createdAt));

  return (
    <ReportsView
      reports={rows.map((r) => ({
        id: r.id,
        title: r.title,
        recipientEmail: r.recipientEmail,
        reportType: r.reportType,
        daysOfWeekJson: r.daysOfWeekJson,
        sendHour: r.sendHour,
        isActive: r.isActive,
        lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
        lastStatus: r.lastStatus,
        lastError: r.lastError,
      }))}
      emailConfigured={!!process.env.RESEND_API_KEY}
    />
  );
}
