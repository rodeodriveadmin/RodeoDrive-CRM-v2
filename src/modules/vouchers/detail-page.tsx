import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { VoucherDetailView } from "./detail-view";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("VOUCHERS", "read");
  const { id } = await params;

  const [row] = await db.select().from(schema.vouchers).where(eq(schema.vouchers.id, id));

  return (
    <VoucherDetailView
      voucher={
        row
          ? {
              id: row.id,
              voucherNumber: row.voucherNumber,
              title: row.title,
              customerName: row.customerName,
              customerMobile: row.customerMobile,
              vehicleType: row.vehicleType,
              vehiclePlate: row.vehiclePlate,
              validUntil: row.validUntil,
              linesJson: row.linesJson,
              subtotal: row.subtotal,
              discountAmount: row.discountAmount,
              vatRate: row.vatRate,
              vatAmount: row.vatAmount,
              netAmount: row.netAmount,
              amountPaid: row.amountPaid,
              balanceDue: row.balanceDue,
              includePaymentInfo: row.includePaymentInfo,
              notes: row.notes,
              generatedBy: row.generatedBy,
              createdAt: row.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
