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
import { quotationsEn, quotationsAr } from "@/modules/quotations/i18n";
import { vouchersEn, vouchersAr } from "@/modules/vouchers/i18n";
import { inspectionsEn, inspectionsAr } from "@/modules/inspections/i18n";
import { qcEn, qcAr } from "@/modules/quality-check/i18n";
import { executionEn, executionAr } from "@/modules/service-execution/i18n";
import { permitsEn, permitsAr } from "@/modules/exit-permits/i18n";
import { employeesEn, employeesAr } from "@/modules/employees/i18n";
import { techniciansEn, techniciansAr } from "@/modules/technicians/i18n";
import { inventoryEn, inventoryAr } from "@/modules/inventory/i18n";
import { dailyEn, dailyAr } from "@/modules/daily-report/i18n";
import { ticketsEn, ticketsAr } from "@/modules/tickets/i18n";
import { dealsEn, dealsAr } from "@/modules/deals/i18n";
import { chatEn, chatAr } from "@/modules/chat/i18n";
import { driveEn, driveAr } from "@/modules/drive/i18n";
import { campaignsEn, campaignsAr } from "@/modules/campaigns/i18n";
import { smsEn, smsAr } from "@/modules/sms/i18n";
import { reportsEn, reportsAr } from "@/modules/scheduled-reports/i18n";

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
  ...quotationsEn,
  ...vouchersEn,
  ...inspectionsEn,
  ...qcEn,
  ...executionEn,
  ...permitsEn,
  ...employeesEn,
  ...techniciansEn,
  ...inventoryEn,
  ...dailyEn,
  ...ticketsEn,
  ...dealsEn,
  ...chatEn,
  ...driveEn,
  ...campaignsEn,
  ...smsEn,
  ...reportsEn,
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
  ...quotationsAr,
  ...vouchersAr,
  ...inspectionsAr,
  ...qcAr,
  ...executionAr,
  ...permitsAr,
  ...employeesAr,
  ...techniciansAr,
  ...inventoryAr,
  ...dailyAr,
  ...ticketsAr,
  ...dealsAr,
  ...chatAr,
  ...driveAr,
  ...campaignsAr,
  ...smsAr,
  ...reportsAr,
};

export const dictionaries: Record<Lang, Record<DictKey, string>> = { en, ar };
