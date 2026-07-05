// Strings owned by the technicians cluster.

export const techniciansEn = {
  "tech.title": "Technicians",
  "tech.none": "No technicians yet — flag employees as technicians in the Employees module",
  "tech.completedItems": "Completed services",
  "tech.runningItems": "Running now",
  "tech.totalMinutes": "Total time",
  "tech.minutes": "min",
} as const;

export const techniciansAr: Record<keyof typeof techniciansEn, string> = {
  "tech.title": "الفنيون",
  "tech.none": "لا يوجد فنيون بعد — فعّل خيار (فني) للموظفين في وحدة الموظفين",
  "tech.completedItems": "الخدمات المنجزة",
  "tech.runningItems": "قيد التنفيذ الآن",
  "tech.totalMinutes": "إجمالي الوقت",
  "tech.minutes": "دقيقة",
};
