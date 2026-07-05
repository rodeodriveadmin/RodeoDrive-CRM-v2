// Strings owned by the dashboard cluster.

export const dashboardEn = {
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome",
  "dashboard.users": "Users",
  "dashboard.departments": "Departments",
  "dashboard.roles": "Roles",
  "dashboard.customers": "Customers",
  "dashboard.vehicles": "Vehicles",
  "dashboard.services": "Services",
  "dashboard.jobOrders": "Job Orders",
  "dashboard.phaseNote":
    "Phases 1–4 are live: administration & RBAC, customers, vehicles, service catalog, job orders, payments, quotations, vouchers, invoices, inspections, quality check, service execution and exit permits. Next: inventory, reports and dashboard analytics.",
} as const;

export const dashboardAr: Record<keyof typeof dashboardEn, string> = {
  "dashboard.title": "لوحة التحكم",
  "dashboard.welcome": "مرحباً",
  "dashboard.users": "المستخدمون",
  "dashboard.departments": "الأقسام",
  "dashboard.roles": "الأدوار",
  "dashboard.customers": "العملاء",
  "dashboard.vehicles": "المركبات",
  "dashboard.services": "الخدمات",
  "dashboard.jobOrders": "أوامر العمل",
  "dashboard.phaseNote":
    "المراحل من الأولى إلى الرابعة جاهزة: الإدارة والصلاحيات، العملاء، المركبات، كتالوج الخدمات، أوامر العمل، المدفوعات، عروض الأسعار، القسائم، الفواتير، الفحوصات، فحص الجودة، تنفيذ الخدمات وتصاريح الخروج. التالي: المخزون والتقارير وتحليلات لوحة التحكم.",
};
