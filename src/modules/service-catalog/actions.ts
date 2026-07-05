"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

const PAGE = "/service-catalog";

/* ===================== CATEGORIES ===================== */

export interface CategoryInput {
  code: string;
  nameEn: string;
  nameAr: string;
  parentId?: string | null;
  descriptionEn?: string;
  descriptionAr?: string;
}

function normCategory(input: CategoryInput) {
  return {
    code: input.code.trim().toUpperCase(),
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    parentId: input.parentId || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
  };
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "create");
  const data = normCategory(input);
  if (!data.code || !data.nameEn || !data.nameAr) return { error: "INVALID_INPUT" };

  const [dup] = await db
    .select({ id: schema.serviceCategories.id })
    .from(schema.serviceCategories)
    .where(eq(schema.serviceCategories.code, data.code));
  if (dup) return { error: "CODE_EXISTS" };

  const [row] = await db.insert(schema.serviceCategories).values(data).returning();
  await logActivity({
    entityType: "service_category",
    entityId: row.id,
    action: "create",
    message: `Category "${data.nameEn}" (${data.code}) created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "update");
  const data = normCategory(input);
  if (!data.code || !data.nameEn || !data.nameAr) return { error: "INVALID_INPUT" };
  if (data.parentId === id) return { error: "INVALID_INPUT" }; // cannot be its own parent

  const [dup] = await db
    .select({ id: schema.serviceCategories.id })
    .from(schema.serviceCategories)
    .where(and(eq(schema.serviceCategories.code, data.code), ne(schema.serviceCategories.id, id)));
  if (dup) return { error: "CODE_EXISTS" };

  await db
    .update(schema.serviceCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.serviceCategories.id, id));
  await logActivity({
    entityType: "service_category",
    entityId: id,
    action: "update",
    message: `Category "${data.nameEn}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "delete");

  const [children] = await db
    .select({ c: count() })
    .from(schema.serviceCategories)
    .where(eq(schema.serviceCategories.parentId, id));
  if (children.c > 0) return { error: "HAS_CHILDREN" };

  const [used] = await db
    .select({ c: count() })
    .from(schema.services)
    .where(eq(schema.services.categoryId, id));
  if (used.c > 0) return { error: "IN_USE" };

  await db.delete(schema.serviceCategories).where(eq(schema.serviceCategories.id, id));
  await logActivity({
    entityType: "service_category",
    entityId: id,
    action: "delete",
    message: "Category deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

/* ===================== BRAND SPECS ===================== */

export interface SpecInput {
  code: string;
  brandName: string;
  colorHex: string;
  /** attribute lines, "Label: value" */
  attributes: string;
}

export async function createSpec(input: SpecInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "create");
  const code = input.code.trim().toUpperCase();
  const brandName = input.brandName.trim();
  if (!code || !brandName) return { error: "INVALID_INPUT" };

  const [dup] = await db
    .select({ id: schema.serviceBrandSpecs.id })
    .from(schema.serviceBrandSpecs)
    .where(eq(schema.serviceBrandSpecs.code, code));
  if (dup) return { error: "CODE_EXISTS" };

  const specs = input.attributes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const [row] = await db
    .insert(schema.serviceBrandSpecs)
    .values({
      code,
      brandName,
      colorHex: input.colorHex || "#c69a3f",
      specsJson: JSON.stringify(specs),
    })
    .returning();
  await logActivity({
    entityType: "brand_spec",
    entityId: row.id,
    action: "create",
    message: `Brand spec "${brandName}" (${code}) created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function updateSpec(id: string, input: SpecInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "update");
  const code = input.code.trim().toUpperCase();
  const brandName = input.brandName.trim();
  if (!code || !brandName) return { error: "INVALID_INPUT" };

  const [dup] = await db
    .select({ id: schema.serviceBrandSpecs.id })
    .from(schema.serviceBrandSpecs)
    .where(and(eq(schema.serviceBrandSpecs.code, code), ne(schema.serviceBrandSpecs.id, id)));
  if (dup) return { error: "CODE_EXISTS" };

  const specs = input.attributes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  await db
    .update(schema.serviceBrandSpecs)
    .set({
      code,
      brandName,
      colorHex: input.colorHex || "#c69a3f",
      specsJson: JSON.stringify(specs),
      updatedAt: new Date(),
    })
    .where(eq(schema.serviceBrandSpecs.id, id));
  await logActivity({
    entityType: "brand_spec",
    entityId: id,
    action: "update",
    message: `Brand spec "${brandName}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function deleteSpec(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "delete");

  const [used] = await db
    .select({ c: count() })
    .from(schema.services)
    .where(eq(schema.services.specId, id));
  if (used.c > 0) return { error: "IN_USE" };

  await db.delete(schema.serviceBrandSpecs).where(eq(schema.serviceBrandSpecs.id, id));
  await logActivity({
    entityType: "brand_spec",
    entityId: id,
    action: "delete",
    message: "Brand spec deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

/* ===================== SERVICES / PACKAGES ===================== */

export interface ServiceInput {
  code: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryId?: string | null;
  specId?: string | null;
  type: string; // SERVICE | PACKAGE
  prices: Partial<
    Record<"sedan" | "suv" | "hatchback" | "truck" | "coupe" | "motorbike" | "other", string>
  >;
  includedServiceIds?: string[];
  isActive?: boolean;
}

function parsePrice(v: string | undefined): number | null {
  if (v === undefined || v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normService(input: ServiceInput) {
  return {
    code: input.code.trim().toUpperCase(),
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr?.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
    categoryId: input.categoryId || null,
    specId: input.specId || null,
    type: input.type === "PACKAGE" ? "PACKAGE" : "SERVICE",
    priceSedan: parsePrice(input.prices.sedan),
    priceSuv: parsePrice(input.prices.suv),
    priceHatchback: parsePrice(input.prices.hatchback),
    priceTruck: parsePrice(input.prices.truck),
    priceCoupe: parsePrice(input.prices.coupe),
    priceMotorbike: parsePrice(input.prices.motorbike),
    priceOther: parsePrice(input.prices.other),
    includedServiceIdsJson: JSON.stringify(input.includedServiceIds ?? []),
    isActive: input.isActive ?? true,
  };
}

export async function createService(input: ServiceInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "create");
  const data = normService(input);
  if (!data.code || !data.nameEn) return { error: "INVALID_INPUT" };

  const [dup] = await db
    .select({ id: schema.services.id })
    .from(schema.services)
    .where(eq(schema.services.code, data.code));
  if (dup) return { error: "CODE_EXISTS" };

  const [row] = await db.insert(schema.services).values(data).returning();
  await logActivity({
    entityType: "service",
    entityId: row.id,
    action: "create",
    message: `${data.type === "PACKAGE" ? "Package" : "Service"} "${data.nameEn}" (${data.code}) created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function updateService(id: string, input: ServiceInput): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "update");
  const data = normService(input);
  if (!data.code || !data.nameEn) return { error: "INVALID_INPUT" };

  const [dup] = await db
    .select({ id: schema.services.id })
    .from(schema.services)
    .where(and(eq(schema.services.code, data.code), ne(schema.services.id, id)));
  if (dup) return { error: "CODE_EXISTS" };

  // a package cannot include itself
  const included = (input.includedServiceIds ?? []).filter((sid) => sid !== id);
  data.includedServiceIdsJson = JSON.stringify(included);

  await db
    .update(schema.services)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.services.id, id));
  await logActivity({
    entityType: "service",
    entityId: id,
    action: "update",
    message: `Service "${data.nameEn}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("SERVICE_CATALOG", "delete");
  await db.delete(schema.services).where(eq(schema.services.id, id));
  await logActivity({
    entityType: "service",
    entityId: id,
    action: "delete",
    message: "Service deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}
