// Shared enums of the scheduled-reports cluster.

export const REPORT_TYPES = [
  "DAILY_SUMMARY",
  "OPEN_ORDERS",
  "OUTSTANDING_BALANCES",
  "LOW_STOCK",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
