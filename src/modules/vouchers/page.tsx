import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { VouchersView } from "./view";

export default async function VouchersPage() {
  await requirePolicy("VOUCHERS", "read");

  const rows = await db
    .select({
      id: schema.vouchers.id,
      voucherNumber: schema.vouchers.voucherNumber,
      title: schema.vouchers.title,
      customerName: schema.vouchers.customerName,
      customerMobile: schema.vouchers.customerMobile,
      vehicleType: schema.vouchers.vehicleType,
      validUntil: schema.vouchers.validUntil,
      netAmount: schema.vouchers.netAmount,
      balanceDue: schema.vouchers.balanceDue,
      createdAt: schema.vouchers.createdAt,
    })
    .from(schema.vouchers)
    .orderBy(desc(schema.vouchers.createdAt));

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
    <VouchersView
      vouchers={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      catalog={catalog}
    />
  );
}
