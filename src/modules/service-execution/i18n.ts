// Strings owned by the service-execution cluster.

export const executionEn = {
  "exec.title": "Service Execution",
  "exec.none": "No orders in progress",
  "exec.start": "Start",
  "exec.finish": "Finish",
  "exec.notStarted": "Not started",
  "exec.running": "Running",
  "exec.done": "Done",
  "exec.startedAt": "Started",
  "exec.duration": "Duration",
  "exec.minutes": "min",
} as const;

export const executionAr: Record<keyof typeof executionEn, string> = {
  "exec.title": "تنفيذ الخدمات",
  "exec.none": "لا توجد أوامر قيد التنفيذ",
  "exec.start": "بدء",
  "exec.finish": "إنهاء",
  "exec.notStarted": "لم تبدأ",
  "exec.running": "جارية",
  "exec.done": "منجزة",
  "exec.startedAt": "بدأت",
  "exec.duration": "المدة",
  "exec.minutes": "دقيقة",
};
