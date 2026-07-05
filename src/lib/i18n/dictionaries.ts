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
import { customersEn, customersAr } from "@/modules/customers/i18n";
import { vehiclesEn, vehiclesAr } from "@/modules/vehicles/i18n";
import { catalogEn, catalogAr } from "@/modules/service-catalog/i18n";
import { jobOrdersEn, jobOrdersAr } from "@/modules/job-orders/i18n";
import { paymentsEn, paymentsAr } from "@/modules/payments/i18n";

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
  ...customersEn,
  ...vehiclesEn,
  ...catalogEn,
  ...jobOrdersEn,
  ...paymentsEn,
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
  ...customersAr,
  ...vehiclesAr,
  ...catalogAr,
  ...jobOrdersAr,
  ...paymentsAr,
};

export const dictionaries: Record<Lang, Record<DictKey, string>> = { en, ar };
