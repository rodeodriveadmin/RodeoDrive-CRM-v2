"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { count, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { computeDocTotals, normalizeLines } from "@/lib/document-lines";

async function nextVoucherNumber(): Promise<string> {
  const ym = new Date().toISOString().slice(0, 7).replace("-", "");
  const prefix = `GV-${ym}-`;
  const [row] = await db
    .select({ c: count() })
    .from(schema.vouchers)
    .where(like(schema.vouchers.voucherNumber, `${prefix}%`));
  return `${prefix}${String((row?.c ?? 0) + 1).padStart(4, "0")}`;
}

export interface VoucherInput {
  title?: string;
  customerName: string;
  customerMobile?: string;
  customerEmail?: string;
  vehicleType: string;
  vehiclePlate?: string;
  validUntil?: string;
  lines: Array<{ name: string; qty: unknown; unitPrice: unknown }>;
  discountAmount: unknown;
  vatRate: unknown;
  amountPaid: unknown;
  includePaymentInfo: boolean;
  notes?: string;
}

export async function createVoucher(input: VoucherInput): Promise<ActionResult> {
  const actor = await requirePolicy("VOUCHERS", "create");
  const customerName = input.customerName.trim();
  const lines = normalizeLines(input.lines);
  if (!customerName) return { error: "INVALID_INPUT" };
  if (lines.length === 0) return { error: "NO_LINES" };

  const totals = computeDocTotals(lines, input.discountAmount, input.vatRate);
  const paidRaw = Number(input.amountPaid) || 0;
  const amountPaid = Math.min(Math.max(paidRaw, 0), totals.netAmount);
  const balanceDue = Math.round((totals.netAmount - amountPaid) * 100) / 100;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const voucherNumber = await nextVoucherNumber();
      const [row] = await db
        .insert(schema.vouchers)
        .values({
          voucherNumber,
          title: input.title?.trim() || null,
          customerName,
          customerMobile: input.customerMobile?.trim() || null,
          customerEmail: input.customerEmail?.trim() || null,
          vehicleType: input.vehicleType || "SEDAN",
          vehiclePlate: input.vehiclePlate?.trim().toUpperCase() || null,
          validUntil: input.validUntil?.trim() || null,
          linesJson: JSON.stringify(lines),
          ...totals,
          amountPaid,
          balanceDue,
          includePaymentInfo: !!input.includePaymentInfo,
          notes: input.notes?.trim() || null,
          generatedBy: actor.email,
        })
        .returning();

      await logActivity({
        entityType: "voucher",
        entityId: row.id,
        action: "create",
        message: `Voucher ${voucherNumber} created for ${customerName} (${totals.netAmount})`,
        actorEmail: actor.email,
        actorName: actor.name,
      });
      revalidatePath("/vouchers");
      return { ok: true, id: row.id };
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  return { error: "UNKNOWN" };
}

export async function deleteVoucher(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("VOUCHERS", "delete");
  const [existing] = await db
    .select({ voucherNumber: schema.vouchers.voucherNumber })
    .from(schema.vouchers)
    .where(eq(schema.vouchers.id, id));
  await db.delete(schema.vouchers).where(eq(schema.vouchers.id, id));
  await logActivity({
    entityType: "voucher",
    entityId: id,
    action: "delete",
    message: `Voucher ${existing?.voucherNumber ?? id} deleted`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/vouchers");
  return { ok: true };
}
