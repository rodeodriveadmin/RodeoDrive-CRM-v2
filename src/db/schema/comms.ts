import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { customers } from "./crm";

// ============ TICKETS ============
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name"),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("OPEN"), // OPEN|IN_PROGRESS|RESOLVED|CLOSED
    priority: text("priority").notNull().default("MEDIUM"), // LOW|MEDIUM|HIGH|URGENT
    assignedTo: text("assigned_to"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("tickets_status_idx").on(t.status)]
);

export const ticketComments = pgTable(
  "ticket_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorEmail: text("author_email"),
    authorName: text("author_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("ticket_comments_ticket_idx").on(t.ticketId)]
);

// ============ DEALS ============
export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name"),
    title: text("title").notNull(),
    value: doublePrecision("value"),
    stage: text("stage").notNull().default("LEAD"), // LEAD|QUALIFIED|PROPOSAL|NEGOTIATION|WON|LOST
    expectedCloseDate: text("expected_close_date"), // YYYY-MM-DD
    owner: text("owner"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("deals_stage_idx").on(t.stage)]
);

// ============ INTERNAL CHAT ============
// conversationKey: "GLOBAL" or "dm:a@x.com|b@y.com" (emails sorted)
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationKey: text("conversation_key").notNull(),
    senderEmail: text("sender_email").notNull(),
    senderName: text("sender_name"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("chat_conversation_idx").on(t.conversationKey, t.createdAt)]
);

// ============ DRIVE (file sharing) ============
// Bytes live in the storage backend (local dir in dev, S3-compatible in prod);
// this table is the metadata.
export const driveFiles = pgTable(
  "drive_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerEmail: text("owner_email").notNull(),
    ownerName: text("owner_name"),
    displayName: text("display_name").notNull(),
    folderPath: text("folder_path").notNull().default("/"),
    storagePath: text("storage_path").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    visibility: text("visibility").notNull().default("ORGANIZATION"), // PRIVATE|ORGANIZATION
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("drive_owner_idx").on(t.ownerEmail)]
);

// ============ CAMPAIGNS ============
export const campaignBatches = pgTable("campaign_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  importedRows: integer("imported_rows").notNull().default(0),
  duplicateRows: integer("duplicate_rows").notNull().default(0),
  skippedRows: integer("skipped_rows").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignLeads = pgTable(
  "campaign_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => campaignBatches.id, { onDelete: "cascade" }),
    customerName: text("customer_name"),
    mobile: text("mobile").notNull(),
    normalizedMobile: text("normalized_mobile").notNull(),
    serviceName: text("service_name"),
    serviceDate: text("service_date"),
    notes: text("notes"),
    dedupeKey: text("dedupe_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("campaign_leads_dedupe_unique").on(t.dedupeKey),
    index("campaign_leads_batch_idx").on(t.batchId),
    index("campaign_leads_mobile_idx").on(t.normalizedMobile),
  ]
);

// ============ SMS (provider interface — simulated until configured) ============
export const smsLogs = pgTable("sms_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  recipientsJson: text("recipients_json").notNull().default("[]"),
  recipientCount: integer("recipient_count").notNull().default(0),
  status: text("status").notNull().default("SIMULATED"), // SIMULATED|SENT|FAILED
  providerName: text("provider_name").notNull().default("none"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
