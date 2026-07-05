"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { NAV_GROUPS } from "./nav";
import { can, type PolicySet } from "@/lib/rbac/keys";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { signOut } from "@/lib/auth-client";
import { Badge } from "@/components/ui";
import "./shell.css";

interface ShellUser {
  name: string;
  email: string;
  roleName: string | null;
  departmentName: string | null;
  isRoot: boolean;
  policies: PolicySet;
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const { t, toggleLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-logo brand-logo" role="img" aria-label={t("app.name")} />
        <div>
          <div className="sidebar__brand-name">{t("app.name")}</div>
          <div className="sidebar__brand-tagline">{t("app.tagline")}</div>
        </div>
      </div>

      <nav className="sidebar__nav thin-scroll">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((item) =>
            can(user.policies, item.policy, "read", user.isRoot)
          );
          if (visible.length === 0) return null;
          return (
            <div key={group.labelKey}>
              <div className="sidebar__group-label">{t(group.labelKey)}</div>
              <ul className="sidebar__list">
                {visible.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      {item.ready ? (
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={active ? "sidebar__link is-active" : "sidebar__link"}
                        >
                          <Icon size={17} aria-hidden />
                          {t(item.labelKey)}
                        </Link>
                      ) : (
                        <span className="sidebar__link--disabled">
                          <Icon size={17} aria-hidden />
                          {t(item.labelKey)}
                          <span className="sidebar__soon">{t("common.comingSoon")}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__avatar" aria-hidden>
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="sidebar__user">
          <div className="sidebar__user-name">{user.name}</div>
          <div className="sidebar__user-role">
            {user.isRoot ? t("users.root") : (user.roleName ?? "—")}
          </div>
        </div>
        <button onClick={onSignOut} title={t("common.signOut")} className="sidebar__signout">
          <LogOut size={16} aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar--desktop">{sidebar}</aside>

      {mobileOpen && (
        <div className="shell__drawer">
          <div className="shell__drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="shell__drawer-panel">{sidebar}</aside>
        </div>
      )}

      <div className="shell__main">
        <header className="topbar">
          <button
            className="topbar__menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu size={20} aria-hidden />
          </button>
          <div className="topbar__end">
            {user.departmentName && <Badge tone="neutral">{user.departmentName}</Badge>}
            <button onClick={toggleLang} className="topbar__lang-btn">
              {t("common.language")}
            </button>
          </div>
        </header>
        <main className="shell__content">{children}</main>
      </div>
    </div>
  );
}
