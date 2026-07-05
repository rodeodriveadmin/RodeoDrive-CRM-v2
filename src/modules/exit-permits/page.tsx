import { desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, requirePolicy } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/keys";
import { ExitPermitsView } from "./view";

export default async function ExitPermitsPage() {
  await requirePolicy("EXIT_PERMITS", "read");
  const me = await getCurrentUser();

  const rows = await db
    .select({
      id: schema.jobOrders.id,
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      vehicleMake: schema.jobOrders.vehicleMake,
      vehicleModel: schema.jobOrders.vehicleModel,
      plateNumber: schema.jobOrders.plateNumber,
      status: schema.jobOrders.status,
      balanceDue: schema.jobOrders.balanceDue,
      exitPermitStatus: schema.jobOrders.exitPermitStatus,
      exitPermitNote: schema.jobOrders.exitPermitNote,
      exitPermitBy: schema.jobOrders.exitPermitBy,
    })
    .from(schema.jobOrders)
    .where(inArray(schema.jobOrders.status, ["IN_PROGRESS", "READY", "COMPLETED"]))
    .orderBy(desc(schema.jobOrders.createdAt));

  return (
    <ExitPermitsView
      orders={rows}
      permissions={{
        canRequest: !!me && can(me.policies, "EXIT_PERMITS", "create", me.isRoot),
        canApprove: !!me && can(me.policies, "EXIT_PERMITS", "approve", me.isRoot),
      }}
    />
  );
}
