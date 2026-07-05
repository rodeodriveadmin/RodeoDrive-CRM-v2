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
  "dashboard.todayCollected": "Collected today",
  "dashboard.monthCollected": "Collected this month",
  "dashboard.outstanding": "Outstanding balance",
  "dashboard.openOrders": "Orders in the shop",
  "dashboard.chartTitle": "Collected — last 14 days",
  "dashboard.byStatus": "Orders by status",
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
  "dashboard.todayCollected": "محصّل اليوم",
  "dashboard.monthCollected": "محصّل هذا الشهر",
  "dashboard.outstanding": "المبالغ المستحقة",
  "dashboard.openOrders": "أوامر داخل الورشة",
  "dashboard.chartTitle": "المحصّل — آخر ١٤ يوماً",
  "dashboard.byStatus": "الأوامر حسب الحالة",
};
