import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// ============ EMPLOYEES ============
// Staff records (separate from portal user accounts, like v1).
export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    position: text("position"),
    email: text("email"),
    phone: text("phone"),
    salary: doublePrecision("salary"),
    isTechnician: boolean("is_technician").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("employees_name_idx").on(t.lastName, t.firstName)]
);

// ============ INVENTORY ============
export const inventoryCategories = pgTable("inventory_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventorySubcategories = pgTable(
  "inventory_subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => inventoryCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("inv_subcategories_category_idx").on(t.categoryId)]
);

export const inventoryProducts = pgTable(
  "inventory_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => inventoryCategories.id, { onDelete: "cascade" }),
    subcategoryId: uuid("subcategory_id").references(() => inventorySubcategories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    serialNumber: text("serial_number"),
    barcode: text("barcode"),
    // current on-hand stock; changed only through inventory transactions
    quantity: integer("quantity").notNull().default(0),
    minQuantity: integer("min_quantity").notNull().default(0), // low-stock threshold
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("inv_products_category_idx").on(t.categoryId),
    index("inv_products_barcode_idx").on(t.barcode),
  ]
);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => inventoryProducts.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // ADD | CHECKOUT
    qty: integer("qty").notNull(),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("inv_transactions_product_idx").on(t.productId)]
);
