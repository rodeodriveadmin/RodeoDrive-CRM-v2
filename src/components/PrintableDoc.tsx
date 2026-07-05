"use client";

// Printable numbered document (quotation / voucher / invoice).
// Branding (logo) comes from the organization theme via .brand-logo.

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui";
import type { DocLine } from "@/lib/document-lines";

export interface DocTotals {
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  amountPaid?: number;
  balanceDue?: number;
}

export function PrintableDoc({
  docType,
  number,
  date,
  backHref,
  backLabel,
  meta,
  lines,
  totals,
  notes,
  generatedBy,
  extraFooter,
}: {
  docType: string;
  number: string;
  date: string;
  backHref: string;
  backLabel: string;
  meta: Array<{ label: string; value: string }>;
  lines: DocLine[];
  totals: DocTotals;
  notes?: string | null;
  generatedBy?: string | null;
  extraFooter?: string;
}) {
  const { t, lang } = useLang();
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <>
      <div className="doc-actions">
        <Link href={backHref} className="back-link" style={{ marginBlockEnd: 0 }}>
          <ArrowLeft size={15} aria-hidden />
          {backLabel}
        </Link>
        <Button onClick={() => window.print()}>
          <Printer size={16} aria-hidden />
          {t("doc.print")}
        </Button>
      </div>

      <article className="doc">
        <header className="doc__header">
          <div className="doc__brand">
            <div className="doc__logo brand-logo" role="img" aria-label={t("app.name")} />
            <div>
              <div className="doc__org">{t("app.name")}</div>
              <div className="doc__org-sub">{t("app.tagline")}</div>
            </div>
          </div>
          <div className="doc__title">
            <div className="doc__type">{docType}</div>
            <div className="doc__number">{number}</div>
            <div className="doc__date">
              {new Date(date).toLocaleDateString(lang === "ar" ? "ar" : "en", { dateStyle: "long" })}
            </div>
          </div>
        </header>

        <div className="doc__meta">
          {meta.map((m) => (
            <div key={m.label} className="doc__meta-row">
              <span className="doc__meta-label">{m.label}</span>
              <span>{m.value}</span>
            </div>
          ))}
        </div>

        <table className="doc__table">
          <thead>
            <tr>
              <th>{t("doc.item")}</th>
              <th>{t("doc.qty")}</th>
              <th>{t("doc.unitPrice")}</th>
              <th>{t("doc.total")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td>{l.qty}</td>
                <td>{fmt(l.unitPrice)}</td>
                <td>{fmt(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc__totals">
          <div className="doc__totals-row">
            <span>{t("doc.subtotal")}</span>
            <span>{fmt(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="doc__totals-row">
              <span>{t("doc.discount")}</span>
              <span>-{fmt(totals.discountAmount)}</span>
            </div>
          )}
          <div className="doc__totals-row">
            <span>
              {t("doc.vat")} ({fmt(totals.vatRate)}%)
            </span>
            <span>{fmt(totals.vatAmount)}</span>
          </div>
          <div className="doc__totals-row doc__totals-row--grand">
            <span>{t("doc.grandTotal")}</span>
            <span>{fmt(totals.netAmount)}</span>
          </div>
          {totals.amountPaid !== undefined && (
            <div className="doc__totals-row">
              <span>{t("doc.paid")}</span>
              <span>{fmt(totals.amountPaid)}</span>
            </div>
          )}
          {totals.balanceDue !== undefined && (
            <div className="doc__totals-row">
              <span>{t("doc.balance")}</span>
              <span>{fmt(totals.balanceDue)}</span>
            </div>
          )}
        </div>

        {notes && <div className="doc__notes">{notes}</div>}

        <footer className="doc__footer">
          <span>
            {generatedBy ? `${t("doc.generatedBy")}: ${generatedBy}` : ""}
          </span>
          <span>{extraFooter ?? ""}</span>
        </footer>
      </article>
    </>
  );
}
