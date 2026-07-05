"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
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
  Table,
  Td,
  Th,
} from "@/components/ui";
import { setQualityCheck } from "./actions";

interface Row {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
  orderStatus: string;
  qualityCheckStatus: string;
  qualityCheckNotes: string | null;
  qualityCheckedBy: string | null;
  itemsTotal: number;
}

const TONE: Record<string, "neutral" | "success" | "danger"> = {
  PENDING: "neutral",
  PASSED: "success",
  FAILED: "danger",
};

export function QualityCheckView({ orders, canApprove }: { orders: Row[]; canApprove: boolean }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<{ row: Row; status: "PASSED" | "FAILED" } | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.plateNumber ?? "").toLowerCase().includes(q)
    );
  }, [orders, query]);

  async function submitDecision(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!decision) return;
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    await setQualityCheck(decision.row.id, decision.status, String(formData.get("notes") ?? ""));
    setBusy(false);
    setDecision(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("qc.title")}
          actions={
            <Input
              placeholder={t("common.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="toolbar-search"
            />
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("qc.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("jobs.orderNumber")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("jobs.vehicle")}</Th>
                <Th>{t("jobs.status")}</Th>
                <Th>{t("qc.title")}</Th>
                <Th>{t("qc.checkedBy")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <Link href={`/job-orders/${o.id}`} className="row-link">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{o.customerName}</Td>
                  <Td>
                    {o.vehicleMake} {o.vehicleModel}
                    {o.plateNumber ? ` · ${o.plateNumber}` : ""}
                  </Td>
                  <Td>
                    <Badge tone="neutral">{t(`jobs.status.${o.orderStatus}` as DictKey)}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={TONE[o.qualityCheckStatus] ?? "neutral"}>
                      {t(`qc.status.${o.qualityCheckStatus}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{o.qualityCheckedBy ?? "—"}</Td>
                  <Td>
                    {canApprove && (
                      <div className="row-actions">
                        {o.qualityCheckStatus === "PENDING" ? (
                          <>
                            <Button
                              variant="ghost"
                              title={t("qc.pass")}
                              onClick={() => setDecision({ row: o, status: "PASSED" })}
                            >
                              <CheckCircle2 size={16} aria-hidden className="icon-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              title={t("qc.fail")}
                              onClick={() => setDecision({ row: o, status: "FAILED" })}
                            >
                              <XCircle size={16} aria-hidden className="icon-danger" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            title={t("qc.reset")}
                            onClick={() => setQualityCheck(o.id, "PENDING", "")}
                          >
                            <RotateCcw size={15} aria-hidden />
                          </Button>
                        )}
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.status === "PASSED" ? t("qc.pass") : t("qc.fail")}
      >
        {decision && (
          <form onSubmit={submitDecision} className="form-stack">
            <p className="form-hint">
              {decision.row.orderNumber} · {decision.row.customerName}
            </p>
            <div>
              <Label htmlFor="qc-notes">{t("qc.notes")}</Label>
              <Input id="qc-notes" name="notes" defaultValue={decision.row.qualityCheckNotes ?? ""} />
            </div>
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setDecision(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy} variant={decision.status === "FAILED" ? "danger" : "primary"}>
                {decision.status === "PASSED" ? t("qc.pass") : t("qc.fail")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
