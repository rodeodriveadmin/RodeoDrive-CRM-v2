"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { REPORT_TYPES } from "./constants";
import { runReport } from "./scheduler";

export interface ReportInput {
  title: string;
  recipientEmail: string;
  reportType: string;
  daysOfWeek: number[];
  sendHour: number;
  isActive: boolean;
}

function normalize(input: ReportInput) {
  const days = [...new Set(input.daysOfWeek.map(Number).filter((d) => d >= 0 && d <= 6))].sort();
  return {
    title: input.title.trim(),
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    reportType: (REPORT_TYPES as readonly string[]).includes(input.reportType)
      ? input.reportType
      : "DAILY_SUMMARY",
    daysOfWeekJson: JSON.stringify(days),
    sendHour: Math.min(Math.max(Math.floor(Number(input.sendHour) || 0), 0), 23),
    isActive: !!input.isActive,
  };
}

export async function createScheduledReport(input: ReportInput): Promise<ActionResult> {
  const actor = await requirePolicy("SCHEDULED_REPORTS", "create");
  const data = normalize(input);
  if (!data.title || !data.recipientEmail.includes("@") || data.daysOfWeekJson === "[]") {
    return { error: "INVALID_INPUT" };
  }

  const [row] = await db
    .insert(schema.scheduledReports)
    .values({ ...data, createdBy: actor.email })
    .returning();
  await logActivity({
    entityType: "scheduled_report",
    entityId: row.id,
    action: "create",
    message: `Scheduled report "${data.title}" → ${data.recipientEmail}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/scheduled-reports");
  return { ok: true, id: row.id };
}

export async function updateScheduledReport(id: string, input: ReportInput): Promise<ActionResult> {
  const actor = await requirePolicy("SCHEDULED_REPORTS", "update");
  const data = normalize(input);
  if (!data.title || !data.recipientEmail.includes("@") || data.daysOfWeekJson === "[]") {
    return { error: "INVALID_INPUT" };
  }

  await db
    .update(schema.scheduledReports)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.scheduledReports.id, id));
  await logActivity({
    entityType: "scheduled_report",
    entityId: id,
    action: "update",
    message: `Scheduled report "${data.title}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/scheduled-reports");
  return { ok: true };
}

export async function deleteScheduledReport(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("SCHEDULED_REPORTS", "delete");
  await db.delete(schema.scheduledReports).where(eq(schema.scheduledReports.id, id));
  await logActivity({
    entityType: "scheduled_report",
    entityId: id,
    action: "delete",
    message: "Scheduled report deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/scheduled-reports");
  return { ok: true };
}

export async function runScheduledReportNow(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("SCHEDULED_REPORTS", "update");
  const result = await runReport(id, actor.email);
  revalidatePath("/scheduled-reports");
  if (result.status === "FAILED") return { error: result.error ?? "FAILED" };
  return { ok: true };
}
