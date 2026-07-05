import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { JobOrdersView } from "./view";

export default async function JobOrdersPage() {
  await requirePolicy("JOB_ORDERS", "read");

  const orders = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      status: schema.jobOrders.status,
      paymentStatus: schema.jobOrders.paymentStatus,
      priority: schema.jobOrders.priority,
      customerName: schema.jobOrders.customerName,
      customerPhone: schema.jobOrders.customerPhone,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
      totalAmount: schema.jobOrders.totalAmount,
      balanceDue: schema.jobOrders.balanceDue,
      createdAt: schema.jobOrders.createdAt,
    })
    .from(schema.jobOrders)
    .orderBy(desc(schema.jobOrders.createdAt));

  const customerRows = await db
    .select({
      id: schema.customers.id,
      firstName: schema.customers.firstName,
      lastName: schema.customers.lastName,
    })
    .from(schema.customers)
    .orderBy(schema.customers.lastName, schema.customers.firstName);

  const vehicleRows = await db
    .select({
      id: schema.vehicles.id,
      customerId: schema.vehicles.customerId,
      make: schema.vehicles.make,
      model: schema.vehicles.model,
      plateNumber: schema.vehicles.plateNumber,
    })
    .from(schema.vehicles);

  return (
    <JobOrdersView
      orders={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      customers={customerRows.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))}
      vehicles={vehicleRows}
    />
  );
}
