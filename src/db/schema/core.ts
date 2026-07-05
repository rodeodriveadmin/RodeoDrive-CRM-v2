import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

// Audit trail for every meaningful mutation (replaces v1 ActivityLog).
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    message: text("message").notNull(),
    actorEmail: text("actor_email"),
    actorName: text("actor_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("activity_entity_idx").on(t.entityType, t.entityId),
    index("activity_created_idx").on(t.createdAt),
  ]
);
