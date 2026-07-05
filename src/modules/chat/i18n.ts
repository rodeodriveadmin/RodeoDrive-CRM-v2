// Strings owned by the chat cluster.

export const chatEn = {
  "chat.title": "Internal Chat",
  "chat.global": "# General",
  "chat.directMessages": "Direct messages",
  "chat.placeholder": "Type a message…",
  "chat.send": "Send",
  "chat.empty": "No messages yet — say hello!",
  "chat.you": "You",
} as const;

export const chatAr: Record<keyof typeof chatEn, string> = {
  "chat.title": "المحادثة الداخلية",
  "chat.global": "# عام",
  "chat.directMessages": "رسائل مباشرة",
  "chat.placeholder": "اكتب رسالة…",
  "chat.send": "إرسال",
  "chat.empty": "لا توجد رسائل بعد — ابدأ الحديث!",
  "chat.you": "أنت",
};
