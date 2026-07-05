"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button, Card, Input } from "@/components/ui";
import { sendChatMessage } from "./actions";
import { dmKey, GLOBAL_KEY } from "./shared";
import "./chat.css";

interface ChatUser {
  email: string;
  name: string;
}

interface Message {
  id: string;
  senderEmail: string;
  senderName: string | null;
  body: string;
  createdAt: string;
}

const POLL_MS = 4000;

export function ChatView({ me, users }: { me: ChatUser; users: ChatUser[] }) {
  const { t, lang } = useLang();
  const [conversation, setConversation] = useState(GLOBAL_KEY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | null>(null);

  const load = useCallback(
    async (key: string, incremental: boolean) => {
      const after = incremental && lastSeenRef.current ? `&after=${encodeURIComponent(lastSeenRef.current)}` : "";
      const res = await fetch(`/api/chat/messages?key=${encodeURIComponent(key)}${after}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data: { messages: Message[] } = await res.json();
      if (data.messages.length === 0) return;
      lastSeenRef.current = data.messages[data.messages.length - 1].createdAt;
      // dedupe by id: the post-send refresh can race the interval poll
      setMessages((prev) => {
        if (!incremental) return data.messages;
        const seen = new Set(prev.map((m) => m.id));
        const fresh = data.messages.filter((m) => !seen.has(m.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
    },
    []
  );

  // switch conversation: full reload, then poll incrementally
  useEffect(() => {
    lastSeenRef.current = null;
    setMessages([]);
    load(conversation, false);
    const timer = setInterval(() => load(conversation, true), POLL_MS);
    return () => clearInterval(timer);
  }, [conversation, load]);

  // stick to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    const res = await sendChatMessage(conversation, text);
    setBusy(false);
    if (!res.error) {
      setDraft("");
      await load(conversation, true);
    }
  }

  const timeFmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="page page--lg">
      <div className="chat">
        <Card className="chat__conversations">
          <button
            className={conversation === GLOBAL_KEY ? "chat__conv is-active" : "chat__conv"}
            onClick={() => setConversation(GLOBAL_KEY)}
          >
            {t("chat.global")}
          </button>
          {users.length > 0 && <div className="chat__conv-label">{t("chat.directMessages")}</div>}
          {users.map((u) => {
            const key = dmKey(me.email, u.email);
            return (
              <button
                key={u.email}
                className={conversation === key ? "chat__conv is-active" : "chat__conv"}
                onClick={() => setConversation(key)}
              >
                {u.name}
              </button>
            );
          })}
        </Card>

        <Card className="chat__pane">
          <div className="chat__messages thin-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="chat__empty">{t("chat.empty")}</div>
            ) : (
              messages.map((m) => {
                const mine = m.senderEmail === me.email;
                return (
                  <div key={m.id} className={mine ? "chat__msg chat__msg--mine" : "chat__msg"}>
                    <div className="chat__msg-meta">
                      {mine ? t("chat.you") : (m.senderName ?? m.senderEmail)} · {timeFmt(m.createdAt)}
                    </div>
                    <div className="chat__msg-body">{m.body}</div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={submit} className="chat__composer">
            <Input
              placeholder={t("chat.placeholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={busy || !draft.trim()}>
              <Send size={15} aria-hidden />
              {t("chat.send")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
