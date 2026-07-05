// Shared enums of the job-orders cluster (importable from client and server —
// a "use server" file may only export async functions, so they live here).

export const JOB_STATUSES = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export const JOB_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "CHECK", "WALLET", "OTHER"] as const;
