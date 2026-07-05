import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { InventoryView } from "./view";

export default async function InventoryPage() {
  await requirePolicy("INVENTORY", "read");

  const [categories, subcategories, products, transactions] = await Promise.all([
    db.select().from(schema.inventoryCategories).orderBy(schema.inventoryCategories.name),
    db.select().from(schema.inventorySubcategories).orderBy(schema.inventorySubcategories.name),
    db.select().from(schema.inventoryProducts).orderBy(schema.inventoryProducts.name),
    db
      .select({
        id: schema.inventoryTransactions.id,
        type: schema.inventoryTransactions.type,
        qty: schema.inventoryTransactions.qty,
        notes: schema.inventoryTransactions.notes,
        createdBy: schema.inventoryTransactions.createdBy,
        createdAt: schema.inventoryTransactions.createdAt,
        productName: schema.inventoryProducts.name,
      })
      .from(schema.inventoryTransactions)
      .innerJoin(
        schema.inventoryProducts,
        eq(schema.inventoryProducts.id, schema.inventoryTransactions.productId)
      )
      .orderBy(desc(schema.inventoryTransactions.createdAt))
      .limit(200),
  ]);

  return (
    <InventoryView
      categories={categories.map((c) => ({ id: c.id, name: c.name, description: c.description }))}
      subcategories={subcategories.map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name }))}
      products={products.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        name: p.name,
        serialNumber: p.serialNumber,
        barcode: p.barcode,
        quantity: p.quantity,
        minQuantity: p.minQuantity,
        notes: p.notes,
      }))}
      transactions={transactions.map((tx) => ({ ...tx, createdAt: tx.createdAt.toISOString() }))}
    />
  );
}
