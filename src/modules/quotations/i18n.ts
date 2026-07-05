// Strings owned by the quotations cluster.

export const quotationsEn = {
  "quotes.title": "Quotations",
  "quotes.add": "New quotation",
  "quotes.number": "Quote #",
  "quotes.none": "No quotations yet",
  "quotes.notFound": "Quotation not found",
  "quotes.backToList": "Back to quotations",
  "quotes.docTitle": "Quotation",
  "quotes.titleField": "Title",
  "quotes.footerNote": "Prices are valid until the date stated above.",
} as const;

export const quotationsAr: Record<keyof typeof quotationsEn, string> = {
  "quotes.title": "عروض الأسعار",
  "quotes.add": "عرض سعر جديد",
  "quotes.number": "رقم العرض",
  "quotes.none": "لا توجد عروض أسعار بعد",
  "quotes.notFound": "عرض السعر غير موجود",
  "quotes.backToList": "العودة إلى عروض الأسعار",
  "quotes.docTitle": "عرض سعر",
  "quotes.titleField": "العنوان",
  "quotes.footerNote": "الأسعار صالحة حتى التاريخ المذكور أعلاه.",
};
