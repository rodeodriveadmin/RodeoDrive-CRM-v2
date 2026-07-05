"use client";

import { Users, Building2, ShieldCheck, Rocket } from "lucide-react";
import { Card } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import "./dashboard.css";

export function DashboardView({
  userName,
  stats,
}: {
  userName: string;
  stats: { users: number; departments: number; roles: number };
}) {
  const { t } = useLang();

  const items = [
    { label: t("dashboard.users"), value: stats.users, icon: Users },
    { label: t("dashboard.departments"), value: stats.departments, icon: Building2 },
    { label: t("dashboard.roles"), value: stats.roles, icon: ShieldCheck },
  ];

  return (
    <div className="page page--lg">
      <h1 className="dashboard__title">
        {t("dashboard.welcome")}, {userName} 👋
      </h1>

      <div className="dashboard__stats">
        {items.map((item) => (
          <Card key={item.label} className="card--pad stat-card">
            <div className="stat-card__icon">
              <item.icon size={20} aria-hidden />
            </div>
            <div>
              <div className="stat-card__value">{item.value}</div>
              <div className="stat-card__label">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card--pad dashboard__note">
        <div className="dashboard__note-icon">
          <Rocket size={20} aria-hidden />
        </div>
        <p className="dashboard__note-text">{t("dashboard.phase1Note")}</p>
      </Card>
    </div>
  );
}
