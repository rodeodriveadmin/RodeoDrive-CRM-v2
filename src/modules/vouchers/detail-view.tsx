"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Card, EmptyState } from "@/components/ui";
import { PrintableDoc } from "@/components/PrintableDoc";
import { parseLines } from "@/lib/document-lines";

interface Voucher {
  id: string;
  voucherNumber: string;
  title: string | null;
  customerName: string;
  customerMobile: string | null;
  vehicleType: string;
  vehiclePlate: string | null;
  validUntil: string | null;
  linesJson: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  amountPaid: number;
  balanceDue: number;
  includePaymentInfo: boolean;
  notes: string | null;
  generatedBy: string | null;
  createdAt: string;
}

export function VoucherDetailView({ voucher }: { voucher: Voucher | null }) {
  const { t } = useLang();

  if (!voucher) {
    return (
      <div className="page page--md">
        <Link href="/vouchers" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("vouchers.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("vouchers.notFound")} />
        </Card>
      </div>
    );
  }

  const meta = [
    { label: t("doc.customer"), value: voucher.customerName },
    { label: t("doc.mobile"), value: voucher.customerMobile ?? "—" },
    { label: t("doc.vehicleType"), value: t(`vehicles.type.${voucher.vehicleType}` as DictKey) },
    { label: t("doc.plate"), value: voucher.vehiclePlate ?? "—" },
    { label: t("doc.validUntil"), value: voucher.validUntil ?? "—" },
  ];
  if (voucher.title) meta.unshift({ label: t("vouchers.titleField"), value: voucher.title });

  return (
    <PrintableDoc
      docType={t("vouchers.docTitle")}
      number={voucher.voucherNumber}
      date={voucher.createdAt}
      backHref="/vouchers"
      backLabel={t("vouchers.backToList")}
      meta={meta}
      lines={parseLines(voucher.linesJson)}
      totals={{
        subtotal: voucher.subtotal,
        discountAmount: voucher.discountAmount,
        vatRate: voucher.vatRate,
        vatAmount: voucher.vatAmount,
        netAmount: voucher.netAmount,
        ...(voucher.includePaymentInfo
          ? { amountPaid: voucher.amountPaid, balanceDue: voucher.balanceDue }
          : {}),
      }}
      notes={voucher.notes}
      generatedBy={voucher.generatedBy}
      extraFooter={t("vouchers.footerNote")}
    />
  );
}
