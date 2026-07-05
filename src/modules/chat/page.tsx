import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { ChatView } from "./view";

export default async function ChatPage() {
  const me = await requirePolicy("INTERNAL_CHAT", "read");

  const users = await db
    .select({ email: schema.user.email, name: schema.user.name })
    .from(schema.user)
    .orderBy(schema.user.name);

  return (
    <ChatView
      me={{ email: me.email, name: me.name }}
      users={users.filter((u) => u.email !== me.email)}
    />
  );
}
