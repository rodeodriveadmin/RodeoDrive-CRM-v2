"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { normalizePhone } from "@/lib/sms";

export interface LeadRow {
  name: string;
  mobile: string;
  service: string;
  date: string;
}

export async function importLeads(fileName: string, rows: LeadRow[]): Promise<ActionResult> {
  const actor = await requirePolicy("CAMPAIGNS", "create");
  if (rows.length === 0 || rows.length > 5000) return { error: "INVALID_INPUT" };

  const [batch] = await db
    .insert(schema.campaignBatches)
    .values({ fileName: fileName || "import.csv", totalRows: rows.length, createdBy: actor.email })
    .returning();

  let imported = 0;
  let duplicates = 0;
  let skipped = 0;

  for (const row of rows) {
    const mobile = row.mobile?.trim() ?? "";
    const normalized = normalizePhone(mobile);
    if (!normalized || normalized.length < 7) {
      skipped++;
      continue;
    }
    const dedupeKey = `${normalized}|${(row.service ?? "").trim().toLowerCase()}|${(row.date ?? "").trim()}`;

    const [existing] = await db
      .select({ id: schema.campaignLeads.id })
      .from(schema.campaignLeads)
      .where(eq(schema.campaignLeads.dedupeKey, dedupeKey));
    if (existing) {
      duplicates++;
      continue;
    }

    await db.insert(schema.campaignLeads).values({
      batchId: batch.id,
      customerName: row.name?.trim() || null,
      mobile,
      normalizedMobile: normalized,
      serviceName: row.service?.trim() || null,
      serviceDate: row.date?.trim() || null,
      dedupeKey,
    });
    imported++;
  }

  await db
    .update(schema.campaignBatches)
    .set({ importedRows: imported, duplicateRows: duplicates, skippedRows: skipped })
    .where(eq(schema.campaignBatches.id, batch.id));

  await logActivity({
    entityType: "campaign_batch",
    entityId: batch.id,
    action: "create",
    message: `Imported ${imported}/${rows.length} leads from ${fileName} (${duplicates} duplicates, ${skipped} skipped)`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/campaigns");
  return { ok: true, id: batch.id };
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("CAMPAIGNS", "delete");
  await db.delete(schema.campaignBatches).where(eq(schema.campaignBatches.id, id));
  await logActivity({
    entityType: "campaign_batch",
    entityId: id,
    action: "delete",
    message: "Import batch deleted (leads cascade)",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/campaigns");
  return { ok: true };
}
