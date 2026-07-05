// Strings owned by the deals cluster.

export const dealsEn = {
  "deals.title": "Deals",
  "deals.add": "New deal",
  "deals.dealTitle": "Deal title",
  "deals.value": "Value",
  "deals.stage": "Stage",
  "deals.expectedClose": "Expected close",
  "deals.owner": "Owner",
  "deals.none": "No deals yet",
  "deals.pipeline": "Pipeline value (open)",
  "deals.won": "Won",
  "deals.stage.LEAD": "Lead",
  "deals.stage.QUALIFIED": "Qualified",
  "deals.stage.PROPOSAL": "Proposal",
  "deals.stage.NEGOTIATION": "Negotiation",
  "deals.stage.WON": "Won",
  "deals.stage.LOST": "Lost",
} as const;

export const dealsAr: Record<keyof typeof dealsEn, string> = {
  "deals.title": "الصفقات",
  "deals.add": "صفقة جديدة",
  "deals.dealTitle": "عنوان الصفقة",
  "deals.value": "القيمة",
  "deals.stage": "المرحلة",
  "deals.expectedClose": "الإغلاق المتوقع",
  "deals.owner": "المسؤول",
  "deals.none": "لا توجد صفقات بعد",
  "deals.pipeline": "قيمة الصفقات المفتوحة",
  "deals.won": "المكسوبة",
  "deals.stage.LEAD": "عميل محتمل",
  "deals.stage.QUALIFIED": "مؤهلة",
  "deals.stage.PROPOSAL": "عرض مقدم",
  "deals.stage.NEGOTIATION": "تفاوض",
  "deals.stage.WON": "مكسوبة",
  "deals.stage.LOST": "خاسرة",
};
