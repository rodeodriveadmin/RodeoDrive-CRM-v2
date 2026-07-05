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
    "Phases 1–3 are live: authentication, RBAC, administration, customers, vehicles, the service catalog, job orders and payments. Next: quotations, vouchers and inspections.",
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
    "المراحل من الأولى إلى الثالثة جاهزة: تسجيل الدخول، الصلاحيات، الإدارة، العملاء، المركبات، كتالوج الخدمات، أوامر العمل والمدفوعات. التالي: عروض الأسعار والقسائم والفحوصات.",
};
