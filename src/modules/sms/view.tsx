"use client";

import { useState } from "react";
import { Send, Users } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Label,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { sendSmsBatch } from "./actions";

interface LogRow {
  id: string;
  message: string;
  recipientCount: number;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

const STATUS_TONE: Record<string, "warning" | "success" | "danger"> = {
  SIMULATED: "warning",
  SENT: "success",
  FAILED: "danger",
};

export function SmsView({ logs, leadPhones }: { logs: LogRow[]; leadPhones: string[] }) {
  const { t, lang } = useLang();
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendSmsBatch(message, recipients);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setMessage("");
    setRecipients("");
  }

  return (
    <div className="page page--md">
      <Card>
        <CardHeader title={t("sms.compose")} />
        <form onSubmit={submit} className="form-stack" style={{ padding: "16px 20px" }}>
          <p className="form-hint">{t("sms.simulatedNote")}</p>
          <div>
            <Label htmlFor="sms-message">{t("sms.message")}</Label>
            <Textarea
              id="sms-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="sms-recipients">{t("sms.recipients")}</Label>
            <Textarea
              id="sms-recipients"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="form-footer" style={{ justifyContent: "space-between" }}>
            <Button
              type="button"
              variant="secondary"
              disabled={leadPhones.length === 0}
              onClick={() => setRecipients(leadPhones.join("\n"))}
            >
              <Users size={15} aria-hidden />
              {t("sms.fromLeads")} ({leadPhones.length})
            </Button>
            <Button type="submit" disabled={busy || !message.trim() || !recipients.trim()}>
              <Send size={15} aria-hidden />
              {t("sms.send")}
            </Button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      </Card>

      <Card className="mt-card">
        <CardHeader title={t("sms.history")} />
        {logs.length === 0 ? (
          <EmptyState message={t("sms.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.createdAt")}</Th>
                <Th>{t("sms.message")}</Th>
                <Th>{t("sms.recipientsCount")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("sms.sentBy")}</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <Td>
                    {new Date(l.createdAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                  <Td className="td--wrap">{l.message}</Td>
                  <Td>{l.recipientCount}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[l.status] ?? "warning"}>
                      {t(`sms.status.${l.status}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{l.createdBy ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
