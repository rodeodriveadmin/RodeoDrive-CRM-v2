import {
  pgTable,
  text,
  timestamp,
  boolean,
  doublePrecision,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { jobOrders } from "./jobs";

// ============ QUOTATIONS ============
// Numbered price offers; service lines are a JSON snapshot (they must stay
// frozen even when catalog prices change).
export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteNumber: text("quote_number").notNull(),
    title: text("title"),
    customerName: text("customer_name").notNull(),
    customerMobile: text("customer_mobile"),
    customerEmail: text("customer_email"),
    vehicleType: text("vehicle_type").notNull().default("SEDAN"),
    vehiclePlate: text("vehicle_plate"),
    validUntil: text("valid_until"), // YYYY-MM-DD
    // JSON array of { name, qty, unitPrice, total }
    linesJson: text("lines_json").notNull().default("[]"),
    subtotal: doublePrecision("subtotal").notNull().default(0),
    discountAmount: doublePrecision("discount_amount").notNull().default(0),
    vatRate: doublePrecision("vat_rate").notNull().default(5),
    vatAmount: doublePrecision("vat_amount").notNull().default(0),
    netAmount: doublePrecision("net_amount").notNull().default(0),
    notes: text("notes"),
    generatedBy: text("generated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("quotations_number_unique").on(t.quoteNumber),
    index("quotations_mobile_idx").on(t.customerMobile),
  ]
);

// ============ VOUCHERS / GIFTS ============
export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voucherNumber: text("voucher_number").notNull(),
    title: text("title"),
    customerName: text("customer_name").notNull(),
    customerMobile: text("customer_mobile"),
    customerEmail: text("customer_email"),
    vehicleType: text("vehicle_type").notNull().default("SEDAN"),
    vehiclePlate: text("vehicle_plate"),
    validUntil: text("valid_until"),
    linesJson: text("lines_json").notNull().default("[]"),
    subtotal: doublePrecision("subtotal").notNull().default(0),
    discountAmount: doublePrecision("discount_amount").notNull().default(0),
    vatRate: doublePrecision("vat_rate").notNull().default(5),
    vatAmount: doublePrecision("vat_amount").notNull().default(0),
    netAmount: doublePrecision("net_amount").notNull().default(0),
    includePaymentInfo: boolean("include_payment_info").notNull().default(true),
    amountPaid: doublePrecision("amount_paid").notNull().default(0),
    balanceDue: doublePrecision("balance_due").notNull().default(0),
    notes: text("notes"),
    generatedBy: text("generated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("vouchers_number_unique").on(t.voucherNumber),
    index("vouchers_mobile_idx").on(t.customerMobile),
  ]
);

// ============ INSPECTIONS ============
// One inspection per job order; the checklist state is a JSON document keyed
// by section/item ids from the inspection config.
export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobOrderId: uuid("job_order_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS|COMPLETED
    // { "<sectionId>.<itemId>": { result: "OK"|"ISSUE"|"NA", note?: string } }
    stateJson: text("state_json").notNull().default("{}"),
    generalNotes: text("general_notes"),
    startedBy: text("started_by"),
    completedBy: text("completed_by"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("inspections_order_unique").on(t.jobOrderId)]
);
