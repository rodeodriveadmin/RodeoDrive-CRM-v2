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
  "dashboard.phaseNote":
    "Phases 1–2 are live: authentication, RBAC, users, departments, roles, customers, vehicles and the service catalog. Next: job orders, payments and invoicing.",
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
  "dashboard.phaseNote":
    "المرحلتان الأولى والثانية جاهزتان: تسجيل الدخول، الصلاحيات، المستخدمون، الأقسام، الأدوار، العملاء، المركبات وكتالوج الخدمات. التالي: أوامر العمل والمدفوعات والفواتير.",
};
