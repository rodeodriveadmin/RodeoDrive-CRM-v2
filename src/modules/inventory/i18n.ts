// Strings owned by the inventory cluster.

export const inventoryEn = {
  "inv.title": "Inventory",
  "inv.tab.products": "Products",
  "inv.tab.categories": "Categories",
  "inv.tab.transactions": "Transactions",

  "inv.addProduct": "Add product",
  "inv.product": "Product",
  "inv.serial": "Serial #",
  "inv.barcode": "Barcode",
  "inv.stock": "Stock",
  "inv.minStock": "Low-stock threshold",
  "inv.lowStock": "Low stock",
  "inv.outOfStock": "Out of stock",
  "inv.productsNone": "No products yet",

  "inv.addCategory": "Add category",
  "inv.addSubcategory": "Add subcategory",
  "inv.category": "Category",
  "inv.subcategory": "Subcategory",
  "inv.subcategories": "Subcategories",
  "inv.categoriesNone": "No categories yet",
  "inv.categoryInUse": "Category has products; move them first",

  "inv.addStock": "Add stock",
  "inv.checkout": "Check out",
  "inv.qty": "Quantity",
  "inv.type.ADD": "Stock in",
  "inv.type.CHECKOUT": "Checked out",
  "inv.transactionsNone": "No transactions yet",
  "inv.insufficient": "Not enough stock",
  "inv.by": "By",
} as const;

export const inventoryAr: Record<keyof typeof inventoryEn, string> = {
  "inv.title": "المخزون",
  "inv.tab.products": "المنتجات",
  "inv.tab.categories": "التصنيفات",
  "inv.tab.transactions": "الحركات",

  "inv.addProduct": "إضافة منتج",
  "inv.product": "المنتج",
  "inv.serial": "الرقم التسلسلي",
  "inv.barcode": "الباركود",
  "inv.stock": "المخزون",
  "inv.minStock": "حد التنبيه",
  "inv.lowStock": "مخزون منخفض",
  "inv.outOfStock": "نفد المخزون",
  "inv.productsNone": "لا توجد منتجات بعد",

  "inv.addCategory": "إضافة تصنيف",
  "inv.addSubcategory": "إضافة تصنيف فرعي",
  "inv.category": "التصنيف",
  "inv.subcategory": "التصنيف الفرعي",
  "inv.subcategories": "التصنيفات الفرعية",
  "inv.categoriesNone": "لا توجد تصنيفات بعد",
  "inv.categoryInUse": "التصنيف يحتوي منتجات؛ انقلها أولاً",

  "inv.addStock": "إضافة مخزون",
  "inv.checkout": "صرف",
  "inv.qty": "الكمية",
  "inv.type.ADD": "إدخال",
  "inv.type.CHECKOUT": "صرف",
  "inv.transactionsNone": "لا توجد حركات بعد",
  "inv.insufficient": "الكمية غير كافية",
  "inv.by": "بواسطة",
};
