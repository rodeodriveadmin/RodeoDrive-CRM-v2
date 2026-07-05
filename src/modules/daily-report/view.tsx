"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Badge, Card, CardHeader, EmptyState, Input, Table, Td, Th } from "@/components/ui";
import "./daily.css";

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  jobOrderId: string;
  orderNumber: string;
  customerName: string;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  balanceDue: number;
}

export function DailyReportView({
  date,
  kpis,
  byMethod,
  payments,
  orders,
}: {
  date: string;
  kpis: {
    ordersCreated: number;
    ordersCompleted: number;
    collected: number;
    newCustomers: number;
    servicesFinished: number;
  };
  byMethod: Record<string, number>;
  payments: PaymentRow[];
  orders: OrderRow[];
}) {
  const { t, lang } = useLang();
  const router = useRouter();

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const kpiItems = [
    { label: t("daily.ordersCreated"), value: String(kpis.ordersCreated) },
    { label: t("daily.ordersCompleted"), value: String(kpis.ordersCompleted) },
    { label: t("daily.collected"), value: fmt(kpis.collected) },
    { label: t("daily.newCustomers"), value: String(kpis.newCustomers) },
    { label: t("daily.servicesFinished"), value: String(kpis.servicesFinished) },
  ];

  const empty =
    kpis.ordersCreated === 0 && payments.length === 0 && kpis.newCustomers === 0 && kpis.servicesFinished === 0;

  return (
    <div className="page page--lg">
      <div className="daily__head">
        <h1 className="daily__title">{t("daily.title")}</h1>
        <Input
          type="date"
          value={date}
          className="daily__date-input"
          aria-label={t("daily.date")}
          onChange={(e) => router.push(`/daily-report?date=${e.target.value}`)}
        />
      </div>

      <div className="daily__kpis">
        {kpiItems.map((k) => (
          <Card key={k.label} className="daily__kpi">
            <div className="daily__kpi-value">{k.value}</div>
            <div className="daily__kpi-label">{k.label}</div>
          </Card>
        ))}
      </div>

      {empty ? (
        <Card>
          <EmptyState message={t("daily.nothing")} />
        </Card>
      ) : (
        <div className="daily__grid">
          <div>
            <Card>
              <CardHeader title={t("daily.paymentsOfDay")} />
              {payments.length === 0 ? (
                <EmptyState message={t("daily.nothing")} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("payments.order")}</Th>
                      <Th>{t("jobs.customer")}</Th>
                      <Th>{t("jobs.amount")}</Th>
                      <Th>{t("jobs.method")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <Td>
                          <Link href={`/job-orders/${p.jobOrderId}`} className="row-link">
                            {p.orderNumber}
                          </Link>
                        </Td>
                        <Td>{p.customerName}</Td>
                        <Td className="td--strong">{fmt(p.amount)}</Td>
                        <Td>
                          <Badge tone="neutral">{t(`jobs.method.${p.method}` as DictKey)}</Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>

            {Object.keys(byMethod).length > 0 && (
              <Card className="daily__mt">
                <CardHeader title={t("daily.byMethod")} />
                <div className="daily__methods">
                  {Object.entries(byMethod).map(([method, amount]) => (
                    <div key={method} className="daily__method-row">
                      <span>{t(`jobs.method.${method}` as DictKey)}</span>
                      <span className="td--strong">{fmt(amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader title={t("daily.ordersOfDay")} />
            {orders.length === 0 ? (
              <EmptyState message={t("daily.nothing")} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("jobs.orderNumber")}</Th>
                    <Th>{t("jobs.customer")}</Th>
                    <Th>{t("jobs.status")}</Th>
                    <Th>{t("jobs.total")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <Td>
                        <Link href={`/job-orders/${o.id}`} className="row-link">
                          {o.orderNumber}
                        </Link>
                      </Td>
                      <Td>{o.customerName}</Td>
                      <Td>
                        <Badge tone="neutral">{t(`jobs.status.${o.status}` as DictKey)}</Badge>
                      </Td>
                      <Td>{fmt(o.totalAmount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
