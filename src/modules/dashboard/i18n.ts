// Strings owned by the dashboard cluster.

export const dashboardEn = {
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome",
  "dashboard.users": "Users",
  "dashboard.departments": "Departments",
  "dashboard.roles": "Roles",
  "dashboard.phase1Note":
    "Phase 1 foundation is live: authentication, RBAC, users, departments and roles. Next phases add customers, vehicles, job orders and the rest.",
} as const;

export const dashboardAr: Record<keyof typeof dashboardEn, string> = {
  "dashboard.title": "لوحة التحكم",
  "dashboard.welcome": "مرحباً",
  "dashboard.users": "المستخدمون",
  "dashboard.departments": "الأقسام",
  "dashboard.roles": "الأدوار",
  "dashboard.phase1Note":
    "المرحلة الأولى جاهزة: تسجيل الدخول، الصلاحيات، المستخدمون، الأقسام والأدوار. المراحل القادمة تضيف العملاء والمركبات وأوامر العمل وبقية الوحدات.",
};
