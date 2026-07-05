"use client";

import Link from "next/link";
import { Users, Building2, ShieldCheck, Rocket, Contact, Car, BookOpen, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import "./dashboard.css";

export function DashboardView({
  userName,
  stats,
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
}) {
  const { t } = useLang();

  const items = [
    { label: t("dashboard.jobOrders"), value: stats.jobOrders, icon: ClipboardList, href: "/job-orders" },
    { label: t("dashboard.customers"), value: stats.customers, icon: Contact, href: "/customers" },
    { label: t("dashboard.vehicles"), value: stats.vehicles, icon: Car, href: "/vehicles" },
    { label: t("dashboard.services"), value: stats.services, icon: BookOpen, href: "/service-catalog" },
    { label: t("dashboard.users"), value: stats.users, icon: Users, href: "/admin/users" },
    { label: t("dashboard.departments"), value: stats.departments, icon: Building2, href: "/admin/departments" },
    { label: t("dashboard.roles"), value: stats.roles, icon: ShieldCheck, href: "/admin/roles" },
  ];

  return (
    <div className="page page--lg">
      <h1 className="dashboard__title">
        {t("dashboard.welcome")}, {userName} 👋
      </h1>

      <div className="dashboard__stats">
        {items.map((item) => (
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

      <Card className="card--pad dashboard__note">
        <div className="dashboard__note-icon">
          <Rocket size={20} aria-hidden />
        </div>
        <p className="dashboard__note-text">{t("dashboard.phaseNote")}</p>
      </Card>
    </div>
  );
}
