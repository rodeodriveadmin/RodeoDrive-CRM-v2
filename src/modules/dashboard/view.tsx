"use client";

import Link from "next/link";
import {
  Users,
  Building2,
  ShieldCheck,
  Contact,
  Car,
  BookOpen,
  ClipboardList,
  Banknote,
  CalendarRange,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import "./dashboard.css";

interface ChartPoint {
  date: string;
  total: number;
}

export function DashboardView({
  userName,
  stats,
  kpis,
  chart,
  byStatus,
}: {
  userName: string;
  stats: {
    users: number;
    departments: number;
    roles: number;
    customers: number;
    vehicles: number;
    services: number;
    jobOrders: number;
  };
  kpis: {
    todayCollected: number;
    monthCollected: number;
    outstanding: number;
    openOrders: number;
  };
  chart: ChartPoint[];
  byStatus: Record<string, number>;
}) {
  const { t, lang } = useLang();
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const kpiItems = [
    { label: t("dashboard.todayCollected"), value: fmt(kpis.todayCollected), icon: Banknote, tone: "stat-card__icon--success" },
    { label: t("dashboard.monthCollected"), value: fmt(kpis.monthCollected), icon: CalendarRange, tone: "" },
    { label: t("dashboard.outstanding"), value: fmt(kpis.outstanding), icon: AlertCircle, tone: "stat-card__icon--danger" },
    { label: t("dashboard.openOrders"), value: String(kpis.openOrders), icon: Wrench, tone: "" },
  ];

  const countItems = [
    { label: t("dashboard.jobOrders"), value: stats.jobOrders, icon: ClipboardList, href: "/job-orders" },
    { label: t("dashboard.customers"), value: stats.customers, icon: Contact, href: "/customers" },
    { label: t("dashboard.vehicles"), value: stats.vehicles, icon: Car, href: "/vehicles" },
    { label: t("dashboard.services"), value: stats.services, icon: BookOpen, href: "/service-catalog" },
    { label: t("dashboard.users"), value: stats.users, icon: Users, href: "/admin/users" },
    { label: t("dashboard.departments"), value: stats.departments, icon: Building2, href: "/admin/departments" },
    { label: t("dashboard.roles"), value: stats.roles, icon: ShieldCheck, href: "/admin/roles" },
  ];

  /* --- dependency-free SVG bar chart --- */
  const W = 700;
  const H = 180;
  const PAD = 8;
  const max = Math.max(...chart.map((c) => c.total), 1);
  const barW = (W - PAD * 2) / chart.length;

  const statusOrder = ["DRAFT", "OPEN", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"];

  return (
    <div className="page page--lg">
      <h1 className="dashboard__title">
        {t("dashboard.welcome")}, {userName} 👋
      </h1>

      {/* financial KPIs */}
      <div className="dashboard__kpis">
        {kpiItems.map((item) => (
          <Card key={item.label} className="card--pad stat-card">
            <div className={`stat-card__icon ${item.tone}`}>
              <item.icon size={20} aria-hidden />
            </div>
            <div>
              <div className="stat-card__value">{item.value}</div>
              <div className="stat-card__label">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* collected chart + status breakdown */}
      <div className="dashboard__row">
        <Card>
          <CardHeader title={t("dashboard.chartTitle")} />
          <div className="dashboard__chart-wrap">
            <svg
              viewBox={`0 0 ${W} ${H + 24}`}
              className="dashboard__chart"
              role="img"
              aria-label={t("dashboard.chartTitle")}
            >
              {chart.map((c, i) => {
                const h = Math.round((c.total / max) * (H - 20));
                const x = PAD + i * barW;
                const day = c.date.slice(8, 10);
                return (
                  <g key={c.date}>
                    <rect
                      x={x + barW * 0.15}
                      y={H - h}
                      width={barW * 0.7}
                      height={Math.max(h, 2)}
                      rx="3"
                      className={c.total > 0 ? "dashboard__bar" : "dashboard__bar dashboard__bar--empty"}
                    />
                    {c.total > 0 && (
                      <text x={x + barW / 2} y={H - h - 6} textAnchor="middle" className="dashboard__bar-value">
                        {fmt(c.total)}
                      </text>
                    )}
                    <text x={x + barW / 2} y={H + 16} textAnchor="middle" className="dashboard__bar-label">
                      {day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.byStatus")} />
          <div className="dashboard__statuses">
            {statusOrder.map((s) => (
              <div key={s} className="dashboard__status-row">
                <Badge tone="neutral">{t(`jobs.status.${s}` as DictKey)}</Badge>
                <span className="td--strong">{byStatus[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* entity counts */}
      <div className="dashboard__stats">
        {countItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="card--pad stat-card">
              <div className="stat-card__icon">
                <item.icon size={20} aria-hidden />
              </div>
              <div>
                <div className="stat-card__value">{item.value}</div>
                <div className="stat-card__label">{item.label}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
