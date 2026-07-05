import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getEmailProvider } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { generateReport } from "./generator";
import type { ReportType } from "./constants";

// In-app replacement for v1's EventBridge cron: instrumentation.ts starts
// this once per server process; every minute we send whatever is due.

const TICK_MS = 60_000;

function parseDays(json: string): number[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(Number) : [];
  } catch {
    return [];
  }
}

/** Sends one report immediately and records the outcome on the row. */
export async function runReport(reportId: string, actorEmail?: string): Promise<{
  status: string;
  error?: string;
}> {
  const [report] = await db
    .select()
    .from(schema.scheduledReports)
    .where(eq(schema.scheduledReports.id, reportId));
  if (!report) return { status: "FAILED", error: "NOT_FOUND" };

  let status = "FAILED";
  let error: string | undefined;
  try {
    const { subject, html } = await generateReport(report.reportType as ReportType);
    const result = await getEmailProvider().send(report.recipientEmail, subject, html);
    status = result.status;
    error = result.error;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  await db
    .update(schema.scheduledReports)
    .set({
      lastRunAt: new Date(),
      lastStatus: status,
      lastError: error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.scheduledReports.id, reportId));

  await logActivity({
    entityType: "scheduled_report",
    entityId: reportId,
    action: "update",
    message: `Report "${report.title}" → ${report.recipientEmail}: ${status}${error ? ` (${error})` : ""}`,
    actorEmail: actorEmail ?? "scheduler",
    actorName: actorEmail ? undefined : "Scheduler",
  });

  return { status, error };
}

/** One scheduler tick: send every active report due in the current hour. */
export async function processDueReports(now = new Date()): Promise<number> {
  const reports = await db
    .select()
    .from(schema.scheduledReports)
    .where(eq(schema.scheduledReports.isActive, true));

  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  let sent = 0;
  for (const r of reports) {
    if (r.sendHour !== now.getHours()) continue;
    if (!parseDays(r.daysOfWeekJson).includes(now.getDay())) continue;
    if (r.lastRunAt && r.lastRunAt >= hourStart) continue; // already ran this hour
    await runReport(r.id);
    sent++;
  }
  return sent;
}

const globalForScheduler = globalThis as unknown as { __reportScheduler?: boolean };

export function startReportScheduler(): void {
  if (globalForScheduler.__reportScheduler) return; // HMR / double-register guard
  globalForScheduler.__reportScheduler = true;

  setInterval(() => {
    processDueReports().catch((err) => console.error("[scheduled-reports]", err));
  }, TICK_MS);
  console.log("✓ Scheduled-reports scheduler running (1 min tick)");
}
