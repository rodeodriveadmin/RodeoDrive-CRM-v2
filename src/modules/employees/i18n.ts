// Strings owned by the employees cluster.

export const employeesEn = {
  "emp.title": "Employees",
  "emp.add": "Add employee",
  "emp.firstName": "First name",
  "emp.lastName": "Last name",
  "emp.position": "Position",
  "emp.salary": "Salary",
  "emp.isTechnician": "Technician (executes services)",
  "emp.technicianBadge": "Technician",
  "emp.none": "No employees yet",
} as const;

export const employeesAr: Record<keyof typeof employeesEn, string> = {
  "emp.title": "الموظفون",
  "emp.add": "إضافة موظف",
  "emp.firstName": "الاسم الأول",
  "emp.lastName": "اسم العائلة",
  "emp.position": "المسمى الوظيفي",
  "emp.salary": "الراتب",
  "emp.isTechnician": "فني (ينفذ الخدمات)",
  "emp.technicianBadge": "فني",
  "emp.none": "لا يوجد موظفون بعد",
};
