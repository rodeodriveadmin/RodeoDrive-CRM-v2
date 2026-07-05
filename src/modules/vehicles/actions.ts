"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { VEHICLE_TYPES, type VehicleType } from "@/lib/vehicle-types";

export interface VehicleInput {
  customerId: string;
  make: string;
  model: string;
  year?: string;
  vehicleType: string;
  color?: string;
  plateNumber: string;
  vin?: string;
  notes?: string;
}

function normalize(input: VehicleInput) {
  const vehicleType = (VEHICLE_TYPES as readonly string[]).includes(input.vehicleType)
    ? (input.vehicleType as VehicleType)
    : "OTHER";
  return {
    customerId: input.customerId,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year?.trim() || null,
    vehicleType,
    color: input.color?.trim() || null,
    plateNumber: input.plateNumber.trim().toUpperCase(),
    vin: input.vin?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

function revalidate(customerId: string) {
  revalidatePath("/vehicles");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function createVehicle(input: VehicleInput): Promise<ActionResult> {
  const actor = await requirePolicy("VEHICLES", "create");
  const data = normalize(input);
  if (!data.customerId || !data.make || !data.model || !data.plateNumber) {
    return { error: "INVALID_INPUT" };
  }

  const [row] = await db
    .insert(schema.vehicles)
    .values({ ...data, createdBy: actor.email })
    .returning();

  await logActivity({
    entityType: "vehicle",
    entityId: row.id,
    action: "create",
    message: `Vehicle ${data.make} ${data.model} (${data.plateNumber}) created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(data.customerId);
  return { ok: true, id: row.id };
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<ActionResult> {
  const actor = await requirePolicy("VEHICLES", "update");
  const data = normalize(input);
  if (!data.customerId || !data.make || !data.model || !data.plateNumber) {
    return { error: "INVALID_INPUT" };
  }

  await db
    .update(schema.vehicles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.vehicles.id, id));

  await logActivity({
    entityType: "vehicle",
    entityId: id,
    action: "update",
    message: `Vehicle ${data.make} ${data.model} (${data.plateNumber}) updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(data.customerId);
  return { ok: true };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("VEHICLES", "delete");

  const [existing] = await db
    .select({ customerId: schema.vehicles.customerId })
    .from(schema.vehicles)
    .where(eq(schema.vehicles.id, id));

  await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));

  await logActivity({
    entityType: "vehicle",
    entityId: id,
    action: "delete",
    message: "Vehicle deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  if (existing) revalidate(existing.customerId);
  else revalidatePath("/vehicles");
  return { ok: true };
}
