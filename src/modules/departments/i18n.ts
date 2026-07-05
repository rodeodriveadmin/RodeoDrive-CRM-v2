// Strings owned by the departments cluster.

export const departmentsEn = {
  "departments.title": "Departments",
  "departments.add": "Add department",
  "departments.rename": "Rename",
  "departments.members": "Members",
  "departments.none": "No departments yet",
  "departments.nameLabel": "Department name",
  "departments.hasMembers": "Move its members to another department first",
} as const;

export const departmentsAr: Record<keyof typeof departmentsEn, string> = {
  "departments.title": "الأقسام",
  "departments.add": "إضافة قسم",
  "departments.rename": "إعادة تسمية",
  "departments.members": "الأعضاء",
  "departments.none": "لا توجد أقسام بعد",
  "departments.nameLabel": "اسم القسم",
  "departments.hasMembers": "انقل الأعضاء إلى قسم آخر أولاً",
};
