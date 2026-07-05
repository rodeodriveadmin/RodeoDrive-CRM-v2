import {
  pgTable,
  text,
  timestamp,
  boolean,
  doublePrecision,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Departments replace Cognito groups from v1.
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // slug, stable identifier
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Per-resource CRUD + approve flags for a role (same model as v1 RolePolicy).
export const rolePolicies = pgTable(
  "role_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    policyKey: text("policy_key").notNull(),
    canRead: boolean("can_read").default(false).notNull(),
    canCreate: boolean("can_create").default(false).notNull(),
    canUpdate: boolean("can_update").default(false).notNull(),
    canDelete: boolean("can_delete").default(false).notNull(),
    canApprove: boolean("can_approve").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("role_policy_unique").on(t.roleId, t.policyKey)]
);

// Option-level boolean switches, e.g. "PAYMENT::PAYMENT_PAY" (same model as v1 RoleOptionToggle).
export const roleOptionToggles = pgTable(
  "role_option_toggles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("role_option_toggle_unique").on(t.roleId, t.key)]
);

// Option-level numeric limits, e.g. "PAYMENT::PAYMENT_DISCOUNT_PERCENT" => 15.
export const roleOptionNumbers = pgTable(
  "role_option_numbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: doublePrecision("value").notNull(),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("role_option_number_unique").on(t.roleId, t.key)]
);

// Extended profile for each auth user (replaces v1 UserProfile).
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  employeeId: text("employee_id"),
  mobileNumber: text("mobile_number"),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  lineManagerEmail: text("line_manager_email"),
  lineManagerName: text("line_manager_name"),
  isActive: boolean("is_active").default(true).notNull(),
  isRoot: boolean("is_root").default(false).notNull(), // root admin bypasses RBAC
  dashboardAccessEnabled: boolean("dashboard_access_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
