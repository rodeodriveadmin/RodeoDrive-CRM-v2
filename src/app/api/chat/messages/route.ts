import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/keys";
import { canAccessConversation } from "@/modules/chat/shared";

// Polled by the chat view (lightweight JSON; ?after=ISO returns only new rows).
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.isActive || !can(user.policies, "INTERNAL_CHAT", "read", user.isRoot)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const key = request.nextUrl.searchParams.get("key") ?? "GLOBAL";
  if (!canAccessConversation(key, user.email)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const after = request.nextUrl.searchParams.get("after");
  const afterDate = after ? new Date(after) : null;

  const where =
    afterDate && !Number.isNaN(afterDate.getTime())
      ? and(eq(schema.chatMessages.conversationKey, key), gt(schema.chatMessages.createdAt, afterDate))
      : eq(schema.chatMessages.conversationKey, key);

  const rows = await db
    .select()
    .from(schema.chatMessages)
    .where(where)
    .orderBy(asc(schema.chatMessages.createdAt))
    .limit(200);

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      senderEmail: m.senderEmail,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
