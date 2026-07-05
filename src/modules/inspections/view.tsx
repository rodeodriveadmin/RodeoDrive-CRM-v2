"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Table,
  Td,
  Th,
} from "@/components/ui";

interface Row {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
  orderStatus: string;
  inspectionStatus: string | null;
  createdAt: string;
}

const TONE: Record<string, "neutral" | "warning" | "success"> = {
  NONE: "neutral",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
};

export function InspectionsView({ orders }: { orders: Row[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");

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

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("insp.title")}
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
          <EmptyState message={t("insp.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("jobs.orderNumber")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("jobs.vehicle")}</Th>
                <Th>{t("jobs.status")}</Th>
                <Th>{t("insp.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const insp = o.inspectionStatus ?? "NONE";
                return (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/inspections/${o.id}`} className="row-link">
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
                      <Badge tone={TONE[insp] ?? "neutral"}>
                        {t(`insp.status.${insp}` as DictKey)}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
