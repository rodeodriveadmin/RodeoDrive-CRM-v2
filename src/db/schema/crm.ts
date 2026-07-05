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
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ============ CUSTOMERS ============
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    notes: text("notes"),
    // marketing attribution (same semantics as v1 heardFrom fields)
    heardFrom: text("heard_from"),
    socialPlatform: text("social_platform"),
    referralName: text("referral_name"),
    referralMobile: text("referral_mobile"),
    heardFromOther: text("heard_from_other"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("customers_phone_idx").on(t.phone),
    index("customers_email_idx").on(t.email),
    index("customers_name_idx").on(t.lastName, t.firstName),
  ]
);

// ============ VEHICLES ============
export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: text("year"),
    vehicleType: text("vehicle_type").notNull().default("SEDAN"),
    color: text("color"),
    plateNumber: text("plate_number").notNull(),
    vin: text("vin"),
    notes: text("notes"),
    completedServicesCount: integer("completed_services_count").default(0).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("vehicles_customer_idx").on(t.customerId),
    index("vehicles_plate_idx").on(t.plateNumber),
  ]
);

// ============ SERVICE CATALOG ============
export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => serviceCategories.id, {
      onDelete: "set null",
    }),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("service_categories_code_unique").on(t.code)]
);

export const serviceBrandSpecs = pgTable(
  "service_brand_specs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    brandName: text("brand_name").notNull(),
    colorHex: text("color_hex").notNull().default("#c69a3f"),
    // free-form specification attributes (label/value pairs), JSON text
    specsJson: text("specs_json").notNull().default("[]"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("service_brand_specs_code_unique").on(t.code)]
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar"),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    categoryId: uuid("category_id").references(() => serviceCategories.id, {
      onDelete: "set null",
    }),
    specId: uuid("spec_id").references(() => serviceBrandSpecs.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("SERVICE"), // SERVICE | PACKAGE
    // price per vehicle type (null = not offered for that type)
    priceSedan: doublePrecision("price_sedan"),
    priceSuv: doublePrecision("price_suv"),
    priceHatchback: doublePrecision("price_hatchback"),
    priceTruck: doublePrecision("price_truck"),
    priceCoupe: doublePrecision("price_coupe"),
    priceMotorbike: doublePrecision("price_motorbike"),
    priceOther: doublePrecision("price_other"),
    // for PACKAGE: JSON array of included service ids
    includedServiceIdsJson: text("included_service_ids_json").notNull().default("[]"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("services_code_unique").on(t.code),
    index("services_category_idx").on(t.categoryId),
    index("services_type_idx").on(t.type),
  ]
);
