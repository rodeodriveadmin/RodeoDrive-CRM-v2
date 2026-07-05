"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Card, EmptyState } from "@/components/ui";
import { PrintableDoc } from "@/components/PrintableDoc";
import type { DocLine } from "@/lib/document-lines";

interface InvoiceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleType: string;
  plateNumber: string | null;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export function InvoiceView({ order, items }: { order: InvoiceOrder | null; items: DocLine[] }) {
  const { t } = useLang();

  if (!order) {
    return (
      <div className="page page--md">
        <Link href="/job-orders" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("jobs.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("jobs.notFound")} />
        </Card>
      </div>
    );
  }

  return (
    <PrintableDoc
      docType={t("jobs.invoiceDocTitle")}
      number={order.orderNumber}
      date={order.createdAt}
      backHref={`/job-orders/${order.id}`}
      backLabel={t("jobs.backToList")}
      meta={[
        { label: t("doc.customer"), value: order.customerName },
        { label: t("doc.mobile"), value: order.customerPhone ?? "—" },
        {
          label: t("jobs.vehicle"),
          value: `${order.vehicleMake ?? ""} ${order.vehicleModel ?? ""}`.trim() || "—",
        },
        { label: t("doc.plate"), value: order.plateNumber ?? "—" },
        { label: t("doc.vehicleType"), value: t(`vehicles.type.${order.vehicleType}` as DictKey) },
      ]}
      lines={items}
      totals={{
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        netAmount: order.totalAmount,
        amountPaid: order.amountPaid,
        balanceDue: order.balanceDue,
      }}
      notes={order.notes}
      generatedBy={order.createdBy}
    />
  );
}
