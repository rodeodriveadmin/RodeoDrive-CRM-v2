"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Select } from "@/components/ui";
import { addTicketComment, setTicketStatus } from "./actions";
import { TICKET_STATUSES } from "./constants";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "./view";
import "./tickets.css";

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  customerId: string | null;
  customerName: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface Comment {
  id: string;
  body: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
}

export function TicketDetailView({
  ticket,
  comments,
}: {
  ticket: Ticket | null;
  comments: Comment[];
}) {
  const { t, lang } = useLang();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ticket) {
    return (
      <div className="page page--md">
        <Link href="/tickets" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("tickets.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("tickets.notFound")} />
        </Card>
      </div>
    );
  }

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  async function sendComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    await addTicketComment(ticket!.id, comment);
    setBusy(false);
    setComment("");
  }

  return (
    <div className="page page--md">
      <Link href="/tickets" className="back-link">
        <ArrowLeft size={15} aria-hidden />
        {t("tickets.backToList")}
      </Link>

      <div className="ticket__head">
        <div className="ticket__title">
          {ticket.title}
          <Badge tone={TICKET_STATUS_TONE[ticket.status] ?? "neutral"}>
            {t(`tickets.status.${ticket.status}` as DictKey)}
          </Badge>
          <Badge tone={TICKET_PRIORITY_TONE[ticket.priority] ?? "neutral"}>
            {t(`tickets.priority.${ticket.priority}` as DictKey)}
          </Badge>
        </div>
        <Select
          value={ticket.status}
          onChange={(e) => setTicketStatus(ticket.id, e.target.value)}
          className="toolbar-search"
          aria-label={t("common.status")}
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`tickets.status.${s}` as DictKey)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <div className="ticket__meta">
          <div className="ticket__meta-row">
            <span className="ticket__meta-label">{t("jobs.customer")}</span>
            {ticket.customerId ? (
              <Link href={`/customers/${ticket.customerId}`} className="row-link">
                {ticket.customerName}
              </Link>
            ) : (
              <span>{ticket.customerName ?? "—"}</span>
            )}
          </div>
          <div className="ticket__meta-row">
            <span className="ticket__meta-label">{t("tickets.assignedTo")}</span>
            <span>{ticket.assignedTo ?? "—"}</span>
          </div>
          <div className="ticket__meta-row">
            <span className="ticket__meta-label">{t("jobs.createdBy")}</span>
            <span>
              {ticket.createdBy ?? "—"} · {dateFmt(ticket.createdAt)}
            </span>
          </div>
        </div>
        {ticket.description && <div className="ticket__description">{ticket.description}</div>}
      </Card>

      <Card className="mt-card">
        <CardHeader title={t("tickets.comments")} />
        {comments.length === 0 ? (
          <EmptyState message={t("tickets.noComments")} />
        ) : (
          <div className="ticket__comments">
            {comments.map((c) => (
              <div key={c.id} className="ticket__comment">
                <div className="ticket__comment-meta">
                  {c.authorName ?? c.authorEmail ?? "—"} · {dateFmt(c.createdAt)}
                </div>
                <div className="ticket__comment-body">{c.body}</div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={sendComment} className="ticket__composer">
          <Input
            placeholder={t("tickets.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={busy || !comment.trim()}>
            <Send size={15} aria-hidden />
            {t("tickets.send")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
