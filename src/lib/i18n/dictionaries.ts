// Central i18n merger. Each module cluster owns its own strings in
// src/modules/<module>/i18n.ts — this file only assembles them, so adding
// or upgrading a module never touches another module's translations.

import { commonEn, commonAr } from "./common";
import { resourceEn, resourceAr } from "@/lib/rbac/resource-i18n";
import { shellEn, shellAr } from "@/modules/shell/i18n";
import { authEn, authAr } from "@/modules/auth/i18n";
import { dashboardEn, dashboardAr } from "@/modules/dashboard/i18n";
import { usersEn, usersAr } from "@/modules/users/i18n";
import { departmentsEn, departmentsAr } from "@/modules/departments/i18n";
import { rolesEn, rolesAr } from "@/modules/roles/i18n";

export type Lang = "en" | "ar";

const en = {
  ...commonEn,
  ...resourceEn,
  ...shellEn,
  ...authEn,
  ...dashboardEn,
  ...usersEn,
  ...departmentsEn,
  ...rolesEn,
} as const;

export type DictKey = keyof typeof en;

const ar: Record<DictKey, string> = {
  ...commonAr,
  ...resourceAr,
  ...shellAr,
  ...authAr,
  ...dashboardAr,
  ...usersAr,
  ...departmentsAr,
  ...rolesAr,
};

export const dictionaries: Record<Lang, Record<DictKey, string>> = { en, ar };
