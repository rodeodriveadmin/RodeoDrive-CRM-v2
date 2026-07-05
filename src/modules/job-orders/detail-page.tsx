import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy, getCurrentUser } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/keys";
import { JobOrderDetailView } from "./detail-view";

export default async function JobOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePolicy("JOB_ORDERS", "read");
  const { id } = await params;

  const [order] = await db.select().from(schema.jobOrders).where(eq(schema.jobOrders.id, id));

  if (!order) {
    return <JobOrderDetailView order={null} items={[]} payments={[]} steps={[]} catalog={[]} permissions={{ canEditOrder: false, canCreatePayment: false, canUpdatePayment: false, canDeletePayment: false }} />;
  }

  const [items, payments, steps, catalogRows, me] = await Promise.all([
    db
      .select()
      .from(schema.jobOrderServices)
      .where(eq(schema.jobOrderServices.jobOrderId, id))
      .orderBy(asc(schema.jobOrderServices.createdAt)),
    db
      .select()
      .from(schema.jobOrderPayments)
      .where(eq(schema.jobOrderPayments.jobOrderId, id))
      .orderBy(desc(schema.jobOrderPayments.paidAt)),
    db
      .select()
      .from(schema.jobOrderSteps)
      .where(eq(schema.jobOrderSteps.jobOrderId, id))
      .orderBy(desc(schema.jobOrderSteps.createdAt)),
    db
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
      .orderBy(schema.services.code),
    getCurrentUser(),
  ]);

  const permissions = {
    canEditOrder: !!me && can(me.policies, "JOB_ORDERS", "update", me.isRoot),
    canCreatePayment: !!me && can(me.policies, "PAYMENTS", "create", me.isRoot),
    canUpdatePayment: !!me && can(me.policies, "PAYMENTS", "update", me.isRoot),
    canDeletePayment: !!me && can(me.policies, "PAYMENTS", "delete", me.isRoot),
  };

  return (
    <JobOrderDetailView
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        priority: order.priority,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        vehicleMake: order.vehicleMake,
        vehicleModel: order.vehicleModel,
        vehicleYear: order.vehicleYear,
        vehicleType: order.vehicleType,
        vehicleColor: order.vehicleColor,
        plateNumber: order.plateNumber,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        totalAmount: order.totalAmount,
        amountPaid: order.amountPaid,
        balanceDue: order.balanceDue,
        assignedTechnician: order.assignedTechnician,
        expectedDeliveryDate: order.expectedDeliveryDate,
        notes: order.notes,
        internalNotes: order.internalNotes,
        createdBy: order.createdBy,
        createdAt: order.createdAt.toISOString(),
      }}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        isCompleted: i.isCompleted,
        technician: i.technician,
      }))}
      payments={payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        receiptNumber: p.receiptNumber,
        paidAt: p.paidAt.toISOString(),
        notes: p.notes,
        createdBy: p.createdBy,
      }))}
      steps={steps.map((s) => ({
        id: s.id,
        step: s.step,
        detail: s.detail,
        actorEmail: s.actorEmail,
        createdAt: s.createdAt.toISOString(),
      }))}
      catalog={catalogRows}
      permissions={permissions}
    />
  );
}
