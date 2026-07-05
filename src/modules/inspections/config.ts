// Vehicle-reception inspection checklist (bilingual). Mirrors the v1
// config-driven inspection module; sections/items are stable ids so saved
// state stays valid if labels are reworded.

export interface InspectionItem {
  id: string;
  en: string;
  ar: string;
}

export interface InspectionSection {
  id: string;
  en: string;
  ar: string;
  items: InspectionItem[];
}

export type InspectionResult = "OK" | "ISSUE" | "NA";

export interface InspectionItemState {
  result: InspectionResult;
  note?: string;
}

export const INSPECTION_SECTIONS: InspectionSection[] = [
  {
    id: "exterior",
    en: "Exterior",
    ar: "الهيكل الخارجي",
    items: [
      { id: "paint", en: "Paint condition", ar: "حالة الطلاء" },
      { id: "scratches", en: "Scratches / dents", ar: "خدوش / انبعاجات" },
      { id: "glass", en: "Glass & mirrors", ar: "الزجاج والمرايا" },
      { id: "lights", en: "Lights & indicators", ar: "الأنوار والإشارات" },
      { id: "wheels", en: "Wheels & rims", ar: "الإطارات والجنوط" },
      { id: "trim", en: "Trim & moldings", ar: "الزخارف والحواف" },
    ],
  },
  {
    id: "interior",
    en: "Interior",
    ar: "المقصورة الداخلية",
    items: [
      { id: "seats", en: "Seats & upholstery", ar: "المقاعد والفرش" },
      { id: "carpets", en: "Carpets & mats", ar: "الأرضيات والدواسات" },
      { id: "dashboard", en: "Dashboard & console", ar: "لوحة القيادة والكونسول" },
      { id: "electronics", en: "Electronics & screens", ar: "الإلكترونيات والشاشات" },
      { id: "odor", en: "Odors", ar: "الروائح" },
    ],
  },
  {
    id: "engine",
    en: "Engine bay",
    ar: "حجرة المحرك",
    items: [
      { id: "leaks", en: "Fluid leaks", ar: "تسريبات السوائل" },
      { id: "battery", en: "Battery condition", ar: "حالة البطارية" },
      { id: "belts", en: "Belts & hoses", ar: "الأحزمة والخراطيم" },
    ],
  },
  {
    id: "handover",
    en: "Handover",
    ar: "الاستلام",
    items: [
      { id: "key", en: "Key / spare key received", ar: "استلام المفتاح / الاحتياطي" },
      { id: "registration", en: "Registration documents", ar: "أوراق التسجيل" },
      { id: "personal", en: "Personal items noted", ar: "تدوين الأغراض الشخصية" },
      { id: "fuel", en: "Fuel level noted", ar: "تدوين مستوى الوقود" },
    ],
  },
];

export function parseInspectionState(json: string): Record<string, InspectionItemState> {
  try {
    const obj = JSON.parse(json);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
