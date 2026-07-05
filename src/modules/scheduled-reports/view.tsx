"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Send } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import {
  createScheduledReport,
  deleteScheduledReport,
  runScheduledReportNow,
  updateScheduledReport,
} from "./actions";
import { REPORT_TYPES } from "./constants";

interface Row {
  id: string;
  title: string;
  recipientEmail: string;
  reportType: string;
  daysOfWeekJson: string;
  sendHour: number;
  isActive: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

const STATUS_TONE: Record<string, "warning" | "success" | "danger"> = {
  SIMULATED: "warning",
  SENT: "success",
  FAILED: "danger",
};

function parseDays(json: string): number[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(Number) : [];
  } catch {
    return [];
  }
}

export function ReportsView({
  reports,
  emailConfigured,
}: {
  reports: Row[];
  emailConfigured: boolean;
}) {
  const { t, lang } = useLang();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [busy, setBusy] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openForm(row: Row | null) {
    setEditRow(row);
    setDays(row ? parseDays(row.daysOfWeekJson) : [0, 1, 2, 3, 4, 5, 6]);
    setError(null);
    setFormOpen(true);
  }

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const input = {
      title: String(formData.get("title") ?? ""),
      recipientEmail: String(formData.get("recipientEmail") ?? ""),
      reportType: String(formData.get("reportType") ?? "DAILY_SUMMARY"),
      daysOfWeek: days,
      sendHour: Number(formData.get("sendHour") ?? 8),
      isActive: formData.get("isActive") === "on",
    };
    const res = editRow
      ? await updateScheduledReport(editRow.id, input)
      : await createScheduledReport(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  async function runNow(id: string) {
    setRunningId(id);
    await runScheduledReportNow(id);
    setRunningId(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("reports.title")}
          actions={
            <Button onClick={() => openForm(null)}>
              <Plus size={16} aria-hidden />
              {t("reports.add")}
            </Button>
          }
        />
        {!emailConfigured && (
          <p className="form-hint" style={{ padding: "8px 20px" }}>
            {t("reports.simulatedNote")}
          </p>
        )}
        {reports.length === 0 ? (
          <EmptyState message={t("reports.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("reports.recipient")}</Th>
                <Th>{t("reports.type")}</Th>
                <Th>{t("reports.days")}</Th>
                <Th>{t("reports.hour")}</Th>
                <Th>{t("reports.lastRun")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <Td className="td--strong">{r.title}</Td>
                  <Td>{r.recipientEmail}</Td>
                  <Td>{t(`reports.type.${r.reportType}` as DictKey)}</Td>
                  <Td>
                    {parseDays(r.daysOfWeekJson).length === 7
                      ? "✓ ×7"
                      : parseDays(r.daysOfWeekJson)
                          .map((d) => t(`reports.day.${d}` as DictKey))
                          .join(" ")}
                  </Td>
                  <Td>{String(r.sendHour).padStart(2, "0")}:00</Td>
                  <Td>
                    {r.lastRunAt
                      ? new Date(r.lastRunAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : t("reports.never")}
                  </Td>
                  <Td>
                    {r.lastStatus ? (
                      <Badge tone={STATUS_TONE[r.lastStatus] ?? "warning"} >
                        {t(`reports.status.${r.lastStatus}` as DictKey)}
                      </Badge>
                    ) : r.isActive ? (
                      <Badge tone="success">{t("common.active")}</Badge>
                    ) : (
                      <Badge tone="danger">{t("common.inactive")}</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        title={t("reports.runNow")}
                        disabled={runningId === r.id}
                        onClick={() => runNow(r.id)}
                      >
                        <Send size={15} aria-hidden className={runningId === r.id ? undefined : "icon-success"} />
                      </Button>
                      <Button variant="ghost" title={t("common.edit")} onClick={() => openForm(r)}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        title={t("common.delete")}
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) deleteScheduledReport(r.id);
                        }}
                      >
                        <Trash2 size={15} aria-hidden className="icon-danger" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("reports.add")}
      >
        <form onSubmit={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div>
            <Label htmlFor="r-title">{t("common.name")}</Label>
            <Input id="r-title" name="title" defaultValue={editRow?.title ?? ""} required autoFocus />
          </div>
          <div>
            <Label htmlFor="r-recipient">{t("reports.recipient")}</Label>
            <Input
              id="r-recipient"
              name="recipientEmail"
              type="email"
              defaultValue={editRow?.recipientEmail ?? ""}
              required
            />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="r-type">{t("reports.type")}</Label>
              <Select id="r-type" name="reportType" defaultValue={editRow?.reportType ?? "DAILY_SUMMARY"}>
                {REPORT_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {t(`reports.type.${rt}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="r-hour">{t("reports.hour")}</Label>
              <Select id="r-hour" name="sendHour" defaultValue={editRow?.sendHour ?? 8}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </Select>
              <p className="form-hint">{t("reports.hourHint")}</p>
            </div>
          </div>
          <div>
            <Label>{t("reports.days")}</Label>
            <div className="row-actions" style={{ flexWrap: "wrap", gap: 8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <label key={d} className="check-item">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={days.includes(d)}
                    onChange={() => toggleDay(d)}
                  />
                  {t(`reports.day.${d}` as DictKey)}
                </label>
              ))}
            </div>
          </div>
          <label className="check-item">
            <input
              type="checkbox"
              className="checkbox"
              name="isActive"
              defaultChecked={editRow?.isActive ?? true}
            />
            {t("common.active")}
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy || days.length === 0}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
