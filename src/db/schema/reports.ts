import { pgTable, text, timestamp, integer, boolean, uuid, index } from "drizzle-orm/pg-core";

// ============ SCHEDULED REPORTS ============
// Processed by the in-app scheduler (instrumentation.ts → scheduler.ts)
// every minute; emails go through src/lib/email.ts (Resend when
// RESEND_API_KEY is set, otherwise recorded as SIMULATED).
export const scheduledReports = pgTable(
  "scheduled_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    reportType: text("report_type").notNull().default("DAILY_SUMMARY"),
    // JSON array of weekday numbers, 0 (Sunday) … 6 (Saturday)
    daysOfWeekJson: text("days_of_week_json").notNull().default("[0,1,2,3,4,5,6]"),
    sendHour: integer("send_hour").notNull().default(8), // server-local hour 0–23
    isActive: boolean("is_active").notNull().default(true),
    lastRunAt: timestamp("last_run_at"),
    lastStatus: text("last_status"), // SIMULATED | SENT | FAILED
    lastError: text("last_error"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("scheduled_reports_active_idx").on(t.isActive)]
);
