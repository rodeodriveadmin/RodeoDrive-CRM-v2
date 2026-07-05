"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DoorOpen, CheckCircle2, XCircle } from "lucide-react";
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
import { approveExitPermit, rejectExitPermit, requestExitPermit } from "./actions";

interface Row {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
  status: string;
  balanceDue: number;
  exitPermitStatus: string;
  exitPermitNote: string | null;
  exitPermitBy: string | null;
}

const TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  NOT_REQUIRED: "neutral",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function ExitPermitsView({
  orders,
  permissions,
}: {
  orders: Row[];
  permissions: { canRequest: boolean; canApprove: boolean };
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<{ row: Row; approve: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    const note = String(formData.get("note") ?? "");
    setBusy(true);
    setError(null);
    const res = decision.approve
      ? await approveExitPermit(decision.row.id, note)
      : await rejectExitPermit(decision.row.id, note);
    setBusy(false);
    if (res.error) {
      setError(res.error === "UNPAID" ? t("permits.unpaidBlock") : t("common.error"));
      return;
    }
    setDecision(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("permits.title")}
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
          <EmptyState message={t("permits.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("jobs.orderNumber")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("jobs.vehicle")}</Th>
                <Th>{t("permits.balance")}</Th>
                <Th>{t("permits.title")}</Th>
                <Th>{t("permits.by")}</Th>
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
                  <Td className={o.balanceDue > 0 ? "td--strong" : undefined}>
                    {o.balanceDue.toLocaleString()}
                  </Td>
                  <Td>
                    <Badge tone={TONE[o.exitPermitStatus] ?? "neutral"}>
                      {t(`permits.status.${o.exitPermitStatus}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{o.exitPermitBy ?? "—"}</Td>
                  <Td>
                    <div className="row-actions">
                      {o.exitPermitStatus === "NOT_REQUIRED" && permissions.canRequest && (
                        <Button variant="ghost" title={t("permits.require")} onClick={() => requestExitPermit(o.id)}>
                          <DoorOpen size={15} aria-hidden />
                        </Button>
                      )}
                      {o.exitPermitStatus === "PENDING" && permissions.canApprove && (
                        <>
                          <Button
                            variant="ghost"
                            title={t("permits.approve")}
                            onClick={() => { setError(null); setDecision({ row: o, approve: true }); }}
                          >
                            <CheckCircle2 size={16} aria-hidden className="icon-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            title={t("permits.reject")}
                            onClick={() => { setError(null); setDecision({ row: o, approve: false }); }}
                          >
                            <XCircle size={16} aria-hidden className="icon-danger" />
                          </Button>
                        </>
                      )}
                    </div>
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
        title={decision?.approve ? t("permits.approve") : t("permits.reject")}
      >
        {decision && (
          <form onSubmit={submitDecision} className="form-stack">
            <p className="form-hint">
              {decision.row.orderNumber} · {decision.row.customerName}
            </p>
            <div>
              <Label htmlFor="permit-note">{t("permits.note")}</Label>
              <Input id="permit-note" name="note" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setDecision(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy} variant={decision.approve ? "primary" : "danger"}>
                {decision.approve ? t("permits.approve") : t("permits.reject")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
