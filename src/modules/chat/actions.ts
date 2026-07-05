"use server";

import type { ActionResult } from "@/lib/action-result";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { canAccessConversation } from "./shared";

export async function sendChatMessage(conversationKey: string, body: string): Promise<ActionResult> {
  const actor = await requirePolicy("INTERNAL_CHAT", "create");
  const text = body.trim();
  if (!text || text.length > 4000) return { error: "INVALID_INPUT" };
  if (!canAccessConversation(conversationKey, actor.email)) return { error: "FORBIDDEN" };

  await db.insert(schema.chatMessages).values({
    conversationKey,
    senderEmail: actor.email,
    senderName: actor.name,
    body: text,
  });
  return { ok: true };
}
