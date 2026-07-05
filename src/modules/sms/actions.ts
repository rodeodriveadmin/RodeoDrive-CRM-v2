"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { getSmsProvider, normalizePhone } from "@/lib/sms";

export async function sendSmsBatch(message: string, recipientsRaw: string): Promise<ActionResult> {
  const actor = await requirePolicy("SMS", "create");
  const text = message.trim();
  if (!text || text.length > 1000) return { error: "INVALID_INPUT" };

  const phones = [
    ...new Set(
      recipientsRaw
        .split("\n")
        .map((l) => normalizePhone(l))
        .filter((p) => p.length >= 7)
    ),
  ];
  if (phones.length === 0 || phones.length > 1000) return { error: "NO_RECIPIENTS" };

  const provider = getSmsProvider();
  const result = await provider.send(phones, text);

  const [row] = await db
    .insert(schema.smsLogs)
    .values({
      message: text,
      recipientsJson: JSON.stringify(phones),
      recipientCount: phones.length,
      status: result.status,
      providerName: result.providerName,
      createdBy: actor.email,
    })
    .returning();

  await logActivity({
    entityType: "sms_batch",
    entityId: row.id,
    action: "create",
    message: `SMS batch to ${phones.length} recipients (${result.status})`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/sms");
  return { ok: true, id: row.id };
}
