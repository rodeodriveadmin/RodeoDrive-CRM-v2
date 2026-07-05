// Strings owned by the campaigns cluster.

export const campaignsEn = {
  "camp.title": "Campaigns",
  "camp.import": "Import leads (CSV)",
  "camp.leads": "Leads",
  "camp.batches": "Import batches",
  "camp.mobile": "Mobile",
  "camp.service": "Service",
  "camp.serviceDate": "Service date",
  "camp.batch": "Batch",
  "camp.rows": "Rows",
  "camp.imported": "Imported",
  "camp.duplicates": "Duplicates",
  "camp.skipped": "Skipped",
  "camp.none": "No leads yet — import a CSV file",
  "camp.csvHint":
    "CSV columns: name, mobile, service, date (first row = headers). Mobile is required.",
  "camp.csvFile": "CSV file",
  "camp.importDone": "Import finished",
} as const;

export const campaignsAr: Record<keyof typeof campaignsEn, string> = {
  "camp.title": "الحملات",
  "camp.import": "استيراد عملاء (CSV)",
  "camp.leads": "العملاء المحتملون",
  "camp.batches": "دفعات الاستيراد",
  "camp.mobile": "الجوال",
  "camp.service": "الخدمة",
  "camp.serviceDate": "تاريخ الخدمة",
  "camp.batch": "الدفعة",
  "camp.rows": "الصفوف",
  "camp.imported": "المستوردة",
  "camp.duplicates": "المكررة",
  "camp.skipped": "المتجاهلة",
  "camp.none": "لا يوجد عملاء محتملون بعد — استورد ملف CSV",
  "camp.csvHint": "أعمدة CSV: الاسم، الجوال، الخدمة، التاريخ (الصف الأول عناوين). الجوال إلزامي.",
  "camp.csvFile": "ملف CSV",
  "camp.importDone": "اكتمل الاستيراد",
};
