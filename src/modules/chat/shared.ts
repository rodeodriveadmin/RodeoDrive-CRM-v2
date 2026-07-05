// Conversation-key helpers shared by the chat UI, action, and API route.

export const GLOBAL_KEY = "GLOBAL";

export function dmKey(a: string, b: string): string {
  return `dm:${[a.toLowerCase(), b.toLowerCase()].sort().join("|")}`;
}

/** A user may only read GLOBAL or DMs they are part of. */
export function canAccessConversation(key: string, email: string): boolean {
  if (key === GLOBAL_KEY) return true;
  if (!key.startsWith("dm:")) return false;
  return key
    .slice(3)
    .split("|")
    .includes(email.toLowerCase());
}
