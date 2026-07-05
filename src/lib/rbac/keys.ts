// Resource (policy) keys — superset of v1 RESOURCE_KEYS, one per module.
// Every role holds CRUD+approve flags per key; the sidebar and every server
// action are gated by these.

export const RESOURCE_KEYS = [
  // Operations
  "DASHBOARD",
  "CUSTOMERS",
  "VEHICLES",
  "JOB_ORDERS",
  "INSPECTIONS",
  "QUALITY_CHECK",
  "SERVICE_EXECUTION",
  "EXIT_PERMITS",
  // Finance
  "PAYMENTS",
  "INVOICES",
  "QUOTATIONS",
  "VOUCHERS",
  "DAILY_REPORT",
  // Catalog & assets
  "SERVICE_CATALOG",
  "INVENTORY",
  // People
  "EMPLOYEES",
  "TECHNICIANS",
  // Communication
  "TICKETS",
  "DEALS",
  "CAMPAIGNS",
  "SMS",
  "INTERNAL_CHAT",
  "DRIVE",
  "SCHEDULED_REPORTS",
  // Admin
  "ACTIVITY_LOG",
  "USERS_ADMIN",
  "DEPARTMENTS_ADMIN",
  "ROLES_POLICIES_ADMIN",
] as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export type PolicyAction = "read" | "create" | "update" | "delete" | "approve";

export interface PolicyFlags {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export type PolicySet = Partial<Record<ResourceKey, PolicyFlags>>;

export const FULL_ACCESS: PolicyFlags = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canApprove: true,
};

export function can(
  policies: PolicySet,
  key: ResourceKey,
  action: PolicyAction,
  isRoot = false
): boolean {
  if (isRoot) return true;
  const p = policies[key];
  if (!p) return false;
  switch (action) {
    case "read":
      return p.canRead;
    case "create":
      return p.canCreate;
    case "update":
      return p.canUpdate;
    case "delete":
      return p.canDelete;
    case "approve":
      return p.canApprove;
  }
}
