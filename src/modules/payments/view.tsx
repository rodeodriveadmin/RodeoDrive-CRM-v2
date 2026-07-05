"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, ReceiptText, AlertCircle } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { PAYMENT_METHODS } from "@/modules/job-orders/constants";
import "./payments.css";

interface Row {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  receiptNumber: string | null;
  paidAt: string;
  createdBy: string | null;
  jobOrderId: string;
  orderNumber: string;
  customerName: string;
}

export function PaymentsView({ payments, outstanding }: { payments: Row[]; outstanding: number }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (method && p.method !== method) return false;
      if (!q) return true;
      return (
        p.orderNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q) ||
        (p.receiptNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [payments, query, method]);

  const totalCollected = useMemo(
    () => filtered.reduce((acc, p) => acc + p.amount, 0),
    [filtered]
  );

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const stats = [
    { label: t("payments.totalCollected"), value: fmt(totalCollected), icon: Banknote, tone: "payments__stat-icon--success" },
    { label: t("payments.count"), value: String(filtered.length), icon: ReceiptText, tone: "" },
    { label: t("payments.outstanding"), value: fmt(outstanding), icon: AlertCircle, tone: "payments__stat-icon--danger" },
  ];

  return (
    <div className="page page--lg">
      <div className="payments__stats">
        {stats.map((s) => (
          <Card key={s.label} className="card--pad payments__stat">
            <div className={`payments__stat-icon ${s.tone}`}>
              <s.icon size={20} aria-hidden />
            </div>
            <div>
              <div className="payments__stat-value">{s.value}</div>
              <div className="payments__stat-label">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t("payments.title")}
          actions={
            <>
              <Select value={method} onChange={(e) => setMethod(e.target.value)} className="payments__filter">
                <option value="">{t("payments.allMethods")}</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`jobs.method.${m}` as DictKey)}
                  </option>
                ))}
              </Select>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("payments.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("jobs.paidAt")}</Th>
                <Th>{t("payments.order")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("jobs.amount")}</Th>
                <Th>{t("jobs.method")}</Th>
                <Th>{t("jobs.reference")}</Th>
                <Th>{t("jobs.createdBy")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <Td>
                    {new Date(p.paidAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                  <Td>
                    <Link href={`/job-orders/${p.jobOrderId}`} className="jobs__order-link">
                      {p.orderNumber}
                    </Link>
                  </Td>
                  <Td>{p.customerName}</Td>
                  <Td className="td--strong">{fmt(p.amount)}</Td>
                  <Td>
                    <Badge tone="neutral">{t(`jobs.method.${p.method}` as DictKey)}</Badge>
                  </Td>
                  <Td>{p.reference ?? p.receiptNumber ?? "—"}</Td>
                  <Td>{p.createdBy ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
