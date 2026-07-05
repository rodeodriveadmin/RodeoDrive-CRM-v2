// Strings owned by the exit-permits cluster.

export const permitsEn = {
  "permits.title": "Exit Permits",
  "permits.none": "No job orders",
  "permits.status.NOT_REQUIRED": "Not required",
  "permits.status.PENDING": "Pending",
  "permits.status.APPROVED": "Approved",
  "permits.status.REJECTED": "Rejected",
  "permits.require": "Request permit",
  "permits.approve": "Approve",
  "permits.reject": "Reject",
  "permits.note": "Note",
  "permits.by": "Decided by",
  "permits.unpaidBlock": "Cannot approve: the order still has an outstanding balance",
  "permits.balance": "Balance",
} as const;

export const permitsAr: Record<keyof typeof permitsEn, string> = {
  "permits.title": "تصاريح الخروج",
  "permits.none": "لا توجد أوامر عمل",
  "permits.status.NOT_REQUIRED": "غير مطلوب",
  "permits.status.PENDING": "قيد الانتظار",
  "permits.status.APPROVED": "معتمد",
  "permits.status.REJECTED": "مرفوض",
  "permits.require": "طلب تصريح",
  "permits.approve": "اعتماد",
  "permits.reject": "رفض",
  "permits.note": "ملاحظة",
  "permits.by": "قرار بواسطة",
  "permits.unpaidBlock": "لا يمكن الاعتماد: يوجد رصيد مستحق على الأمر",
  "permits.balance": "المتبقي",
};
