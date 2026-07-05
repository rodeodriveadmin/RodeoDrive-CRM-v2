// Strings owned by the payments cluster (cross-order overview).

export const paymentsEn = {
  "payments.title": "Payments & Invoices",
  "payments.none": "No payments yet",
  "payments.order": "Job order",
  "payments.totalCollected": "Total collected",
  "payments.count": "Payments",
  "payments.outstanding": "Outstanding balance",
  "payments.allMethods": "All methods",
} as const;

export const paymentsAr: Record<keyof typeof paymentsEn, string> = {
  "payments.title": "المدفوعات والفواتير",
  "payments.none": "لا توجد مدفوعات بعد",
  "payments.order": "أمر العمل",
  "payments.totalCollected": "إجمالي المحصّل",
  "payments.count": "عدد الدفعات",
  "payments.outstanding": "المبالغ المستحقة",
  "payments.allMethods": "كل الطرق",
};
