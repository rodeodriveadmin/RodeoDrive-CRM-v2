import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { customers, vehicles } from "./crm";
import { services } from "./crm";

// ============ JOB ORDERS ============
// Customer/vehicle fields are snapshots taken at creation time so the order
// stays historically correct even if the customer or vehicle changes later.
export const jobOrders = pgTable(
  "job_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull(),
    status: text("status").notNull().default("DRAFT"), // DRAFT|OPEN|IN_PROGRESS|READY|COMPLETED|CANCELLED
    paymentStatus: text("payment_status").notNull().default("UNPAID"), // UNPAID|PARTIAL|PAID
    priority: text("priority").notNull().default("NORMAL"), // LOW|NORMAL|HIGH|URGENT

    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),

    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    vehicleMake: text("vehicle_make"),
    vehicleModel: text("vehicle_model"),
    vehicleYear: text("vehicle_year"),
    vehicleType: text("vehicle_type").notNull().default("SEDAN"),
    vehicleColor: text("vehicle_color"),
    plateNumber: text("plate_number"),

    subtotal: doublePrecision("subtotal").notNull().default(0),
    discountAmount: doublePrecision("discount_amount").notNull().default(0),
    vatRate: doublePrecision("vat_rate").notNull().default(5),
    vatAmount: doublePrecision("vat_amount").notNull().default(0),
    totalAmount: doublePrecision("total_amount").notNull().default(0),
    amountPaid: doublePrecision("amount_paid").notNull().default(0),
    balanceDue: doublePrecision("balance_due").notNull().default(0),

    assignedTechnician: text("assigned_technician"),
    expectedDeliveryDate: text("expected_delivery_date"), // YYYY-MM-DD
    notes: text("notes"),
    internalNotes: text("internal_notes"),

    // quality check (order level)
    qualityCheckStatus: text("quality_check_status").notNull().default("PENDING"), // PENDING|PASSED|FAILED
    qualityCheckNotes: text("quality_check_notes"),
    qualityCheckedBy: text("quality_checked_by"),
    qualityCheckedAt: timestamp("quality_checked_at"),

    // exit permit
    exitPermitStatus: text("exit_permit_status").notNull().default("NOT_REQUIRED"), // NOT_REQUIRED|PENDING|APPROVED|REJECTED
    exitPermitNote: text("exit_permit_note"),
    exitPermitBy: text("exit_permit_by"),
    exitPermitAt: timestamp("exit_permit_at"),

    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("job_orders_number_unique").on(t.orderNumber),
    index("job_orders_status_idx").on(t.status),
    index("job_orders_customer_idx").on(t.customerId),
    index("job_orders_plate_idx").on(t.plateNumber),
  ]
);

// Line items — service name/price snapshotted from the catalog.
export const jobOrderServices = pgTable(
  "job_order_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobOrderId: uuid("job_order_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    qty: integer("qty").notNull().default(1),
    unitPrice: doublePrecision("unit_price").notNull().default(0),
    lineTotal: doublePrecision("line_total").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    technician: text("technician"),
    notes: text("notes"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("job_order_services_order_idx").on(t.jobOrderId)]
);

// Payments — NEVER stores cardholder data (see src/lib/compliance/pci.ts).
export const jobOrderPayments = pgTable(
  "job_order_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobOrderId: uuid("job_order_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    amount: doublePrecision("amount").notNull(),
    method: text("method").notNull().default("CASH"), // CASH|CARD|TRANSFER|CHECK|WALLET|OTHER
    reference: text("reference"),
    receiptNumber: text("receipt_number"),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("job_order_payments_order_idx").on(t.jobOrderId)]
);

// Roadmap / timeline — appended automatically on every meaningful event.
export const jobOrderSteps = pgTable(
  "job_order_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobOrderId: uuid("job_order_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    step: text("step").notNull(),
    detail: text("detail"),
    actorEmail: text("actor_email"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("job_order_steps_order_idx").on(t.jobOrderId)]
);
