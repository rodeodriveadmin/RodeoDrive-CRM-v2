"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { and, count, eq, like, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { assertNoCardData, CardDataError } from "@/lib/compliance/pci";
import { JOB_PRIORITIES, JOB_STATUSES, PAYMENT_METHODS } from "./constants";

function money(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

function revalidate(id?: string) {
  revalidatePath("/job-orders");
  if (id) revalidatePath(`/job-orders/${id}`);
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}

async function addStep(jobOrderId: string, step: string, detail: string, actorEmail: string) {
  await db.insert(schema.jobOrderSteps).values({ jobOrderId, step, detail, actorEmail });
}

/** Recomputes billing + payment status from line items and payments. */
async function recompute(jobOrderId: string) {
  const [order] = await db
    .select({ discountAmount: schema.jobOrders.discountAmount, vatRate: schema.jobOrders.vatRate })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, jobOrderId));
  if (!order) return;

  const [svc] = await db
    .select({ s: sum(schema.jobOrderServices.lineTotal) })
    .from(schema.jobOrderServices)
    .where(eq(schema.jobOrderServices.jobOrderId, jobOrderId));
  const [pay] = await db
    .select({ s: sum(schema.jobOrderPayments.amount) })
    .from(schema.jobOrderPayments)
    .where(eq(schema.jobOrderPayments.jobOrderId, jobOrderId));

  const subtotal = money(svc?.s ?? 0);
  const discount = Math.min(money(order.discountAmount), subtotal);
  const vatBase = Math.max(subtotal - discount, 0);
  const vatAmount = money((vatBase * money(order.vatRate)) / 100);
  const totalAmount = money(vatBase + vatAmount);
  const amountPaid = money(pay?.s ?? 0);
  const balanceDue = money(Math.max(totalAmount - amountPaid, 0));
  const paymentStatus =
    amountPaid <= 0 ? "UNPAID" : amountPaid >= totalAmount && totalAmount > 0 ? "PAID" : "PARTIAL";

  await db
    .update(schema.jobOrders)
    .set({
      subtotal,
      discountAmount: discount,
      vatAmount,
      totalAmount,
      amountPaid,
      balanceDue,
      paymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobOrders.id, jobOrderId));
}

/** JO-YYYYMM-#### — sequential within the month. */
async function nextOrderNumber(): Promise<string> {
  const ym = new Date().toISOString().slice(0, 7).replace("-", "");
  const prefix = `JO-${ym}-`;
  const [row] = await db
    .select({ c: count() })
    .from(schema.jobOrders)
    .where(like(schema.jobOrders.orderNumber, `${prefix}%`));
  return `${prefix}${String((row?.c ?? 0) + 1).padStart(4, "0")}`;
}

/* ===================== CREATE ===================== */

export async function createJobOrder(input: {
  customerId: string;
  vehicleId: string;
  priority?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "create");
  if (!input.customerId || !input.vehicleId) return { error: "INVALID_INPUT" };

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, input.customerId));
  const [vehicle] = await db
    .select()
    .from(schema.vehicles)
    .where(
      and(eq(schema.vehicles.id, input.vehicleId), eq(schema.vehicles.customerId, input.customerId))
    );
  if (!customer || !vehicle) return { error: "INVALID_INPUT" };

  // retry once in the unlikely case of an order-number collision
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const orderNumber = await nextOrderNumber();
      const [row] = await db
        .insert(schema.jobOrders)
        .values({
          orderNumber,
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerPhone: customer.phone,
          vehicleId: vehicle.id,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          vehicleYear: vehicle.year,
          vehicleType: vehicle.vehicleType,
          vehicleColor: vehicle.color,
          plateNumber: vehicle.plateNumber,
          priority: (JOB_PRIORITIES as readonly string[]).includes(input.priority ?? "")
            ? input.priority
            : "NORMAL",
          expectedDeliveryDate: input.expectedDeliveryDate?.trim() || null,
          notes: input.notes?.trim() || null,
          createdBy: actor.email,
        })
        .returning();

      await addStep(row.id, "created", orderNumber, actor.email);
      await logActivity({
        entityType: "job_order",
        entityId: row.id,
        action: "create",
        message: `Job order ${orderNumber} created for ${row.customerName}`,
        actorEmail: actor.email,
        actorName: actor.name,
      });
      revalidate(row.id);
      return { ok: true, id: row.id };
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  return { error: "UNKNOWN" };
}

/* ===================== META / STATUS ===================== */

export async function updateJobOrderDetails(
  id: string,
  input: {
    priority?: string;
    assignedTechnician?: string;
    expectedDeliveryDate?: string;
    notes?: string;
    internalNotes?: string;
  }
): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "update");
  await db
    .update(schema.jobOrders)
    .set({
      priority: (JOB_PRIORITIES as readonly string[]).includes(input.priority ?? "")
        ? input.priority
        : "NORMAL",
      assignedTechnician: input.assignedTechnician?.trim() || null,
      expectedDeliveryDate: input.expectedDeliveryDate?.trim() || null,
      notes: input.notes?.trim() || null,
      internalNotes: input.internalNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobOrders.id, id));
  await addStep(id, "details", "", actor.email);
  revalidate(id);
  return { ok: true };
}

export async function setJobOrderStatus(id: string, status: string): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "update");
  if (!(JOB_STATUSES as readonly string[]).includes(status)) return { error: "INVALID_INPUT" };

  const [existing] = await db
    .select({ status: schema.jobOrders.status, vehicleId: schema.jobOrders.vehicleId, orderNumber: schema.jobOrders.orderNumber })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, id));
  if (!existing) return { error: "NOT_FOUND" };
  if (existing.status === status) return { ok: true };

  await db
    .update(schema.jobOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.jobOrders.id, id));

  // completing an order counts toward the vehicle's service history
  if (status === "COMPLETED" && existing.vehicleId) {
    const [v] = await db
      .select({ c: schema.vehicles.completedServicesCount })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, existing.vehicleId));
    if (v) {
      await db
        .update(schema.vehicles)
        .set({ completedServicesCount: v.c + 1, updatedAt: new Date() })
        .where(eq(schema.vehicles.id, existing.vehicleId));
    }
  }

  await addStep(id, "status", `${existing.status} → ${status}`, actor.email);
  await logActivity({
    entityType: "job_order",
    entityId: id,
    action: "update",
    message: `Job order ${existing.orderNumber}: status ${existing.status} → ${status}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(id);
  return { ok: true };
}

export async function deleteJobOrder(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "delete");
  const [existing] = await db
    .select({ orderNumber: schema.jobOrders.orderNumber })
    .from(schema.jobOrders)
    .where(eq(schema.jobOrders.id, id));
  await db.delete(schema.jobOrders).where(eq(schema.jobOrders.id, id));
  await logActivity({
    entityType: "job_order",
    entityId: id,
    action: "delete",
    message: `Job order ${existing?.orderNumber ?? id} deleted`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate();
  return { ok: true };
}

/* ===================== SERVICE ITEMS ===================== */

export async function addServiceItem(
  jobOrderId: string,
  input: { serviceId?: string; name: string; qty: number; unitPrice: number }
): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "update");
  const name = input.name.trim();
  const qty = Math.max(1, Math.floor(Number(input.qty) || 1));
  const unitPrice = money(input.unitPrice);
  if (!name) return { error: "INVALID_INPUT" };

  await db.insert(schema.jobOrderServices).values({
    jobOrderId,
    serviceId: input.serviceId || null,
    name,
    qty,
    unitPrice,
    lineTotal: money(qty * unitPrice),
  });
  await recompute(jobOrderId);
  await addStep(jobOrderId, "service_added", `${name} ×${qty}`, actor.email);
  revalidate(jobOrderId);
  return { ok: true };
}

export async function updateServiceItem(
  itemId: string,
  input: { qty: number; unitPrice: number; isCompleted: boolean; technician?: string }
): Promise<ActionResult> {
  await requirePolicy("JOB_ORDERS", "update");
  const [item] = await db
    .select({ jobOrderId: schema.jobOrderServices.jobOrderId })
    .from(schema.jobOrderServices)
    .where(eq(schema.jobOrderServices.id, itemId));
  if (!item) return { error: "NOT_FOUND" };

  const qty = Math.max(1, Math.floor(Number(input.qty) || 1));
  const unitPrice = money(input.unitPrice);
  await db
    .update(schema.jobOrderServices)
    .set({
      qty,
      unitPrice,
      lineTotal: money(qty * unitPrice),
      isCompleted: !!input.isCompleted,
      technician: input.technician?.trim() || null,
    })
    .where(eq(schema.jobOrderServices.id, itemId));
  await recompute(item.jobOrderId);
  revalidate(item.jobOrderId);
  return { ok: true };
}

export async function removeServiceItem(itemId: string): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "update");
  const [item] = await db
    .select({ jobOrderId: schema.jobOrderServices.jobOrderId, name: schema.jobOrderServices.name })
    .from(schema.jobOrderServices)
    .where(eq(schema.jobOrderServices.id, itemId));
  if (!item) return { error: "NOT_FOUND" };

  await db.delete(schema.jobOrderServices).where(eq(schema.jobOrderServices.id, itemId));
  await recompute(item.jobOrderId);
  await addStep(item.jobOrderId, "service_removed", item.name, actor.email);
  revalidate(item.jobOrderId);
  return { ok: true };
}

/* ===================== BILLING ===================== */

export async function setBilling(
  jobOrderId: string,
  input: { discountAmount: number; vatRate: number }
): Promise<ActionResult> {
  const actor = await requirePolicy("JOB_ORDERS", "update");
  const vatRate = Math.min(Math.max(Number(input.vatRate) || 0, 0), 100);
  await db
    .update(schema.jobOrders)
    .set({ discountAmount: money(input.discountAmount), vatRate, updatedAt: new Date() })
    .where(eq(schema.jobOrders.id, jobOrderId));
  await recompute(jobOrderId);
  await addStep(jobOrderId, "billing", "", actor.email);
  revalidate(jobOrderId);
  return { ok: true };
}

/* ===================== PAYMENTS (PCI-guarded) ===================== */

export interface PaymentInput {
  amount: number;
  method: string;
  reference?: string;
  receiptNumber?: string;
  paidAt?: string;
  notes?: string;
}

function normPayment(input: PaymentInput) {
  // PCI DSS: reject card-number-like content in every free-text field
  assertNoCardData(input.reference, input.notes, input.receiptNumber);
  return {
    amount: money(input.amount),
    method: (PAYMENT_METHODS as readonly string[]).includes(input.method) ? input.method : "OTHER",
    reference: input.reference?.trim() || null,
    receiptNumber: input.receiptNumber?.trim() || null,
    paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
    notes: input.notes?.trim() || null,
  };
}

export async function addPayment(jobOrderId: string, input: PaymentInput): Promise<ActionResult> {
  const actor = await requirePolicy("PAYMENTS", "create");
  let data;
  try {
    data = normPayment(input);
  } catch (err) {
    if (err instanceof CardDataError) return { error: "CARD_DATA" };
    throw err;
  }
  if (data.amount <= 0) return { error: "INVALID_INPUT" };

  await db.insert(schema.jobOrderPayments).values({ jobOrderId, ...data, createdBy: actor.email });
  await recompute(jobOrderId);
  await addStep(jobOrderId, "payment", `${data.amount} (${data.method})`, actor.email);
  await logActivity({
    entityType: "payment",
    entityId: jobOrderId,
    action: "create",
    message: `Payment of ${data.amount} (${data.method}) recorded`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(jobOrderId);
  return { ok: true };
}

export async function updatePayment(paymentId: string, input: PaymentInput): Promise<ActionResult> {
  const actor = await requirePolicy("PAYMENTS", "update");
  const [existing] = await db
    .select({ jobOrderId: schema.jobOrderPayments.jobOrderId })
    .from(schema.jobOrderPayments)
    .where(eq(schema.jobOrderPayments.id, paymentId));
  if (!existing) return { error: "NOT_FOUND" };

  let data;
  try {
    data = normPayment(input);
  } catch (err) {
    if (err instanceof CardDataError) return { error: "CARD_DATA" };
    throw err;
  }
  if (data.amount <= 0) return { error: "INVALID_INPUT" };

  await db
    .update(schema.jobOrderPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.jobOrderPayments.id, paymentId));
  await recompute(existing.jobOrderId);
  await addStep(existing.jobOrderId, "payment_updated", `${data.amount} (${data.method})`, actor.email);
  await logActivity({
    entityType: "payment",
    entityId: existing.jobOrderId,
    action: "update",
    message: `Payment updated to ${data.amount} (${data.method})`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(existing.jobOrderId);
  return { ok: true };
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  const actor = await requirePolicy("PAYMENTS", "delete");
  const [existing] = await db
    .select({
      jobOrderId: schema.jobOrderPayments.jobOrderId,
      amount: schema.jobOrderPayments.amount,
    })
    .from(schema.jobOrderPayments)
    .where(eq(schema.jobOrderPayments.id, paymentId));
  if (!existing) return { error: "NOT_FOUND" };

  await db.delete(schema.jobOrderPayments).where(eq(schema.jobOrderPayments.id, paymentId));
  await recompute(existing.jobOrderId);
  await addStep(existing.jobOrderId, "payment_deleted", String(existing.amount), actor.email);
  await logActivity({
    entityType: "payment",
    entityId: existing.jobOrderId,
    action: "delete",
    message: `Payment of ${existing.amount} deleted`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(existing.jobOrderId);
  return { ok: true };
}
