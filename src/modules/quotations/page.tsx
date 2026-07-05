import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { QuotationsView } from "./view";

export default async function QuotationsPage() {
  await requirePolicy("QUOTATIONS", "read");

  const rows = await db
    .select({
      id: schema.quotations.id,
      quoteNumber: schema.quotations.quoteNumber,
      title: schema.quotations.title,
      customerName: schema.quotations.customerName,
      customerMobile: schema.quotations.customerMobile,
      vehicleType: schema.quotations.vehicleType,
      validUntil: schema.quotations.validUntil,
      netAmount: schema.quotations.netAmount,
      createdAt: schema.quotations.createdAt,
    })
    .from(schema.quotations)
    .orderBy(desc(schema.quotations.createdAt));

  const catalog = await db
    .select({
      id: schema.services.id,
      code: schema.services.code,
      nameEn: schema.services.nameEn,
      nameAr: schema.services.nameAr,
      priceSedan: schema.services.priceSedan,
      priceSuv: schema.services.priceSuv,
      priceHatchback: schema.services.priceHatchback,
      priceTruck: schema.services.priceTruck,
      priceCoupe: schema.services.priceCoupe,
      priceMotorbike: schema.services.priceMotorbike,
      priceOther: schema.services.priceOther,
    })
    .from(schema.services)
    .where(eq(schema.services.isActive, true))
    .orderBy(schema.services.code);

  return (
    <QuotationsView
      quotations={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      catalog={catalog}
    />
  );
}
