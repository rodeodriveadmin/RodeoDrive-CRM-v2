"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

const PAGE = "/inventory";

/* ===================== CATEGORIES ===================== */

export async function createInvCategory(name: string, description: string): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "create");
  const trimmed = name.trim();
  if (!trimmed) return { error: "INVALID_INPUT" };

  const [row] = await db
    .insert(schema.inventoryCategories)
    .values({ name: trimmed, description: description.trim() || null })
    .returning();
  await logActivity({
    entityType: "inventory_category",
    entityId: row.id,
    action: "create",
    message: `Inventory category "${trimmed}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function deleteInvCategory(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "delete");
  const [used] = await db
    .select({ c: count() })
    .from(schema.inventoryProducts)
    .where(eq(schema.inventoryProducts.categoryId, id));
  if (used.c > 0) return { error: "IN_USE" };

  await db.delete(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, id));
  await logActivity({
    entityType: "inventory_category",
    entityId: id,
    action: "delete",
    message: "Inventory category deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function createInvSubcategory(categoryId: string, name: string): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "create");
  const trimmed = name.trim();
  if (!trimmed || !categoryId) return { error: "INVALID_INPUT" };

  const [row] = await db
    .insert(schema.inventorySubcategories)
    .values({ categoryId, name: trimmed })
    .returning();
  await logActivity({
    entityType: "inventory_subcategory",
    entityId: row.id,
    action: "create",
    message: `Inventory subcategory "${trimmed}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function deleteInvSubcategory(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "delete");
  // products referencing it fall back to category-only (FK set null)
  await db.delete(schema.inventorySubcategories).where(eq(schema.inventorySubcategories.id, id));
  await logActivity({
    entityType: "inventory_subcategory",
    entityId: id,
    action: "delete",
    message: "Inventory subcategory deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

/* ===================== PRODUCTS ===================== */

export interface ProductInput {
  categoryId: string;
  subcategoryId?: string;
  name: string;
  serialNumber?: string;
  barcode?: string;
  minQuantity?: string;
  notes?: string;
}

function normProduct(input: ProductInput) {
  const minQ = Math.max(0, Math.floor(Number(input.minQuantity) || 0));
  return {
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId || null,
    name: input.name.trim(),
    serialNumber: input.serialNumber?.trim() || null,
    barcode: input.barcode?.trim() || null,
    minQuantity: minQ,
    notes: input.notes?.trim() || null,
  };
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "create");
  const data = normProduct(input);
  if (!data.name || !data.categoryId) return { error: "INVALID_INPUT" };

  const [row] = await db.insert(schema.inventoryProducts).values(data).returning();
  await logActivity({
    entityType: "inventory_product",
    entityId: row.id,
    action: "create",
    message: `Product "${data.name}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true, id: row.id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "update");
  const data = normProduct(input);
  if (!data.name || !data.categoryId) return { error: "INVALID_INPUT" };

  await db
    .update(schema.inventoryProducts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.inventoryProducts.id, id));
  await logActivity({
    entityType: "inventory_product",
    entityId: id,
    action: "update",
    message: `Product "${data.name}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "delete");
  await db.delete(schema.inventoryProducts).where(eq(schema.inventoryProducts.id, id));
  await logActivity({
    entityType: "inventory_product",
    entityId: id,
    action: "delete",
    message: "Product deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}

/* ===================== TRANSACTIONS (stock movements) ===================== */

export async function recordTransaction(
  productId: string,
  type: "ADD" | "CHECKOUT",
  qtyRaw: unknown,
  notes: string
): Promise<ActionResult> {
  const actor = await requirePolicy("INVENTORY", "update");
  const qty = Math.floor(Number(qtyRaw) || 0);
  if (qty <= 0 || (type !== "ADD" && type !== "CHECKOUT")) return { error: "INVALID_INPUT" };

  const [product] = await db
    .select({ name: schema.inventoryProducts.name, quantity: schema.inventoryProducts.quantity })
    .from(schema.inventoryProducts)
    .where(eq(schema.inventoryProducts.id, productId));
  if (!product) return { error: "NOT_FOUND" };

  const newQty = type === "ADD" ? product.quantity + qty : product.quantity - qty;
  if (newQty < 0) return { error: "INSUFFICIENT" };

  await db.insert(schema.inventoryTransactions).values({
    productId,
    type,
    qty,
    notes: notes.trim() || null,
    createdBy: actor.email,
  });
  await db
    .update(schema.inventoryProducts)
    .set({ quantity: newQty, updatedAt: new Date() })
    .where(eq(schema.inventoryProducts.id, productId));

  await logActivity({
    entityType: "inventory_product",
    entityId: productId,
    action: "update",
    message: `${type === "ADD" ? "Stock in" : "Checkout"} ${qty} × "${product.name}" (now ${newQty})`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath(PAGE);
  return { ok: true };
}
