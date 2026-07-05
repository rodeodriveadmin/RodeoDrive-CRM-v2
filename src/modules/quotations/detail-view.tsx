"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Card, EmptyState } from "@/components/ui";
import { PrintableDoc } from "@/components/PrintableDoc";
import { parseLines } from "@/lib/document-lines";

interface Quotation {
  id: string;
  quoteNumber: string;
  title: string | null;
  customerName: string;
  customerMobile: string | null;
  customerEmail: string | null;
  vehicleType: string;
  vehiclePlate: string | null;
  validUntil: string | null;
  linesJson: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  notes: string | null;
  generatedBy: string | null;
  createdAt: string;
}

export function QuotationDetailView({ quotation }: { quotation: Quotation | null }) {
  const { t } = useLang();

  if (!quotation) {
    return (
      <div className="page page--md">
        <Link href="/quotations" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("quotes.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("quotes.notFound")} />
        </Card>
      </div>
    );
  }

  const meta = [
    { label: t("doc.customer"), value: quotation.customerName },
    { label: t("doc.mobile"), value: quotation.customerMobile ?? "—" },
    { label: t("doc.vehicleType"), value: t(`vehicles.type.${quotation.vehicleType}` as DictKey) },
    { label: t("doc.plate"), value: quotation.vehiclePlate ?? "—" },
    { label: t("doc.validUntil"), value: quotation.validUntil ?? "—" },
  ];
  if (quotation.title) meta.unshift({ label: t("quotes.titleField"), value: quotation.title });

  return (
    <PrintableDoc
      docType={t("quotes.docTitle")}
      number={quotation.quoteNumber}
      date={quotation.createdAt}
      backHref="/quotations"
      backLabel={t("quotes.backToList")}
      meta={meta}
      lines={parseLines(quotation.linesJson)}
      totals={quotation}
      notes={quotation.notes}
      generatedBy={quotation.generatedBy}
      extraFooter={t("quotes.footerNote")}
    />
  );
}
