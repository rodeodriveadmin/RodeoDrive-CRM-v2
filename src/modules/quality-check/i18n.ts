// Strings owned by the quality-check cluster.

export const qcEn = {
  "qc.title": "Quality Check",
  "qc.none": "No job orders awaiting quality check",
  "qc.status.PENDING": "Pending",
  "qc.status.PASSED": "Passed",
  "qc.status.FAILED": "Failed",
  "qc.pass": "Pass",
  "qc.fail": "Fail",
  "qc.reset": "Reset",
  "qc.notes": "QC notes",
  "qc.checkedBy": "Checked by",
  "qc.servicesDone": "Services done",
} as const;

export const qcAr: Record<keyof typeof qcEn, string> = {
  "qc.title": "فحص الجودة",
  "qc.none": "لا توجد أوامر عمل بانتظار فحص الجودة",
  "qc.status.PENDING": "قيد الانتظار",
  "qc.status.PASSED": "مجتاز",
  "qc.status.FAILED": "مرفوض",
  "qc.pass": "اجتياز",
  "qc.fail": "رفض",
  "qc.reset": "إعادة",
  "qc.notes": "ملاحظات الجودة",
  "qc.checkedBy": "فحصه",
  "qc.servicesDone": "الخدمات المنجزة",
};
