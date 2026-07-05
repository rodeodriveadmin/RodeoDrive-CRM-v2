import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { QuotationDetailView } from "./detail-view";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("QUOTATIONS", "read");
  const { id } = await params;

  const [row] = await db.select().from(schema.quotations).where(eq(schema.quotations.id, id));

  return (
    <QuotationDetailView
      quotation={
        row
          ? {
              id: row.id,
              quoteNumber: row.quoteNumber,
              title: row.title,
              customerName: row.customerName,
              customerMobile: row.customerMobile,
              customerEmail: row.customerEmail,
              vehicleType: row.vehicleType,
              vehiclePlate: row.vehiclePlate,
              validUntil: row.validUntil,
              linesJson: row.linesJson,
              subtotal: row.subtotal,
              discountAmount: row.discountAmount,
              vatRate: row.vatRate,
              vatAmount: row.vatAmount,
              netAmount: row.netAmount,
              notes: row.notes,
              generatedBy: row.generatedBy,
              createdAt: row.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
