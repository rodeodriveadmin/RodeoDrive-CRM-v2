// Strings owned by the daily-report cluster.

export const dailyEn = {
  "daily.title": "Daily Report",
  "daily.date": "Date",
  "daily.ordersCreated": "Orders created",
  "daily.ordersCompleted": "Orders completed",
  "daily.collected": "Collected",
  "daily.newCustomers": "New customers",
  "daily.servicesFinished": "Services finished",
  "daily.byMethod": "Collected by method",
  "daily.paymentsOfDay": "Payments",
  "daily.ordersOfDay": "Orders",
  "daily.nothing": "Nothing recorded on this day",
} as const;

export const dailyAr: Record<keyof typeof dailyEn, string> = {
  "daily.title": "التقرير اليومي",
  "daily.date": "التاريخ",
  "daily.ordersCreated": "أوامر منشأة",
  "daily.ordersCompleted": "أوامر مكتملة",
  "daily.collected": "المحصّل",
  "daily.newCustomers": "عملاء جدد",
  "daily.servicesFinished": "خدمات منجزة",
  "daily.byMethod": "المحصّل حسب الطريقة",
  "daily.paymentsOfDay": "المدفوعات",
  "daily.ordersOfDay": "الأوامر",
  "daily.nothing": "لا توجد بيانات لهذا اليوم",
};
