"use client";

import Link from "next/link";
import { Play, CheckCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Badge, Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { finishServiceItem, startServiceItem } from "./actions";
import "./execution.css";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
  status: string;
  priority: string;
}

interface ItemRow {
  id: string;
  jobOrderId: string;
  name: string;
  qty: number;
  technician: string | null;
  isCompleted: boolean;
  startedAt: string | null;
  endedAt: string | null;
}

export function ExecutionView({ orders, items }: { orders: OrderRow[]; items: ItemRow[] }) {
  const { t, lang } = useLang();

  const withItems = orders
    .map((o) => ({ order: o, items: items.filter((i) => i.jobOrderId === o.id) }))
    .filter((g) => g.items.length > 0);

  function itemState(i: ItemRow): { label: string; tone: "neutral" | "warning" | "success" } {
    if (i.isCompleted || i.endedAt) return { label: t("exec.done"), tone: "success" };
    if (i.startedAt) return { label: t("exec.running"), tone: "warning" };
    return { label: t("exec.notStarted"), tone: "neutral" };
  }

  function durationMin(i: ItemRow): number | null {
    if (!i.startedAt || !i.endedAt) return null;
    return Math.max(1, Math.round((new Date(i.endedAt).getTime() - new Date(i.startedAt).getTime()) / 60000));
  }

  if (withItems.length === 0) {
    return (
      <div className="page page--md">
        <Card>
          <CardHeader title={t("exec.title")} />
          <EmptyState message={t("exec.none")} />
        </Card>
      </div>
    );
  }

  return (
    <div className="page page--md">
      {withItems.map(({ order, items: orderItems }) => (
        <Card key={order.id} className="exec__order">
          <CardHeader
            title={
              <>
                <Link href={`/job-orders/${order.id}`} className="row-link">
                  {order.orderNumber}
                </Link>{" "}
                <span className="exec__order-sub">
                  {order.customerName} · {order.vehicleMake} {order.vehicleModel}
                  {order.plateNumber ? ` · ${order.plateNumber}` : ""}
                </span>
              </>
            }
            actions={
              <>
                {order.priority !== "NORMAL" && (
                  <Badge tone={order.priority === "URGENT" ? "danger" : "warning"}>
                    {t(`jobs.priority.${order.priority}` as DictKey)}
                  </Badge>
                )}
                <Badge tone="neutral">{t(`jobs.status.${order.status}` as DictKey)}</Badge>
              </>
            }
          />
          {orderItems.map((i) => {
            const state = itemState(i);
            const dur = durationMin(i);
            return (
              <div key={i.id} className="exec__item">
                <span className="exec__item-name">
                  {i.name}
                  {i.qty > 1 ? ` ×${i.qty}` : ""}
                </span>
                <span className="exec__item-meta">
                  {i.technician ?? ""}
                  {i.startedAt &&
                    ` · ${t("exec.startedAt")} ${new Date(i.startedAt).toLocaleTimeString(
                      lang === "ar" ? "ar" : "en",
                      { hour: "2-digit", minute: "2-digit" }
                    )}`}
                  {dur !== null && ` · ${t("exec.duration")}: ${dur} ${t("exec.minutes")}`}
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
                {!i.startedAt && !i.isCompleted && (
                  <Button variant="secondary" onClick={() => startServiceItem(i.id)}>
                    <Play size={14} aria-hidden />
                    {t("exec.start")}
                  </Button>
                )}
                {i.startedAt && !i.endedAt && !i.isCompleted && (
                  <Button onClick={() => finishServiceItem(i.id)}>
                    <CheckCheck size={14} aria-hidden />
                    {t("exec.finish")}
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
