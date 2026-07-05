"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { createDeal, deleteDeal, setDealStage, updateDeal } from "./actions";
import { DEAL_STAGES } from "./constants";

interface Row {
  id: string;
  title: string;
  customerId: string | null;
  customerName: string | null;
  value: number | null;
  stage: string;
  expectedCloseDate: string | null;
  owner: string | null;
  notes: string | null;
}

const STAGE_TONE: Record<string, "neutral" | "brand" | "warning" | "success" | "danger"> = {
  LEAD: "neutral",
  QUALIFIED: "brand",
  PROPOSAL: "brand",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "danger",
};

export function DealsView({
  deals,
  customers,
}: {
  deals: Row[];
  customers: Array<{ id: string; name: string }>;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.customerName ?? "").toLowerCase().includes(q) ||
        (d.owner ?? "").toLowerCase().includes(q)
    );
  }, [deals, query]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const pipelineValue = deals
    .filter((d) => !["WON", "LOST"].includes(d.stage))
    .reduce((acc, d) => acc + (d.value ?? 0), 0);
  const wonValue = deals
    .filter((d) => d.stage === "WON")
    .reduce((acc, d) => acc + (d.value ?? 0), 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const input = {
      title: String(formData.get("title") ?? ""),
      customerId: String(formData.get("customerId") ?? "") || undefined,
      value: String(formData.get("value") ?? ""),
      stage: String(formData.get("stage") ?? "LEAD"),
      expectedCloseDate: String(formData.get("expectedCloseDate") ?? ""),
      owner: String(formData.get("owner") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    const res = editRow ? await updateDeal(editRow.id, input) : await createDeal(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={
            <>
              {t("deals.title")}{" "}
              <Badge tone="brand">
                {t("deals.pipeline")}: {fmt(pipelineValue)}
              </Badge>{" "}
              <Badge tone="success">
                {t("deals.won")}: {fmt(wonValue)}
              </Badge>
            </>
          }
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setEditRow(null); setError(null); setFormOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("deals.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("deals.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("deals.dealTitle")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("deals.value")}</Th>
                <Th>{t("deals.stage")}</Th>
                <Th>{t("deals.expectedClose")}</Th>
                <Th>{t("deals.owner")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <Td className="td--strong">{d.title}</Td>
                  <Td>{d.customerName ?? "—"}</Td>
                  <Td>{d.value !== null ? fmt(d.value) : "—"}</Td>
                  <Td>
                    <Select
                      value={d.stage}
                      onChange={(e) => setDealStage(d.id, e.target.value)}
                      aria-label={t("deals.stage")}
                    >
                      {DEAL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {t(`deals.stage.${s}` as DictKey)}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>{d.expectedCloseDate ?? "—"}</Td>
                  <Td>{d.owner ?? "—"}</Td>
                  <Td>
                    <div className="row-actions">
                      <Badge tone={STAGE_TONE[d.stage] ?? "neutral"}>
                        {t(`deals.stage.${d.stage}` as DictKey)}
                      </Badge>
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(d); setError(null); setFormOpen(true); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        title={t("common.delete")}
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) deleteDeal(d.id);
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
        title={editRow ? t("common.edit") : t("deals.add")}
      >
        <form onSubmit={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div>
            <Label htmlFor="d-title">{t("deals.dealTitle")}</Label>
            <Input id="d-title" name="title" defaultValue={editRow?.title ?? ""} required autoFocus />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="d-customer">{t("jobs.customer")}</Label>
              <Select id="d-customer" name="customerId" defaultValue={editRow?.customerId ?? ""}>
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="d-value">{t("deals.value")}</Label>
              <Input id="d-value" name="value" inputMode="decimal" defaultValue={editRow?.value ?? ""} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="d-stage">{t("deals.stage")}</Label>
              <Select id="d-stage" name="stage" defaultValue={editRow?.stage ?? "LEAD"}>
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(`deals.stage.${s}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="d-close">{t("deals.expectedClose")}</Label>
              <Input id="d-close" name="expectedCloseDate" type="date" defaultValue={editRow?.expectedCloseDate ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="d-owner">{t("deals.owner")}</Label>
            <Input id="d-owner" name="owner" defaultValue={editRow?.owner ?? ""} />
          </div>
          <div>
            <Label htmlFor="d-notes">{t("customers.notes")}</Label>
            <Input id="d-notes" name="notes" defaultValue={editRow?.notes ?? ""} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
