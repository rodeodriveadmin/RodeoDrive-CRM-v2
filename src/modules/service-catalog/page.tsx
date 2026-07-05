import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { CatalogView } from "./view";

export default async function ServiceCatalogPage() {
  await requirePolicy("SERVICE_CATALOG", "read");

  const [categories, specs, serviceRows] = await Promise.all([
    db.select().from(schema.serviceCategories).orderBy(schema.serviceCategories.code),
    db.select().from(schema.serviceBrandSpecs).orderBy(schema.serviceBrandSpecs.brandName),
    db.select().from(schema.services).orderBy(schema.services.code),
  ]);

  return (
    <CatalogView
      categories={categories.map((c) => ({
        id: c.id,
        code: c.code,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        parentId: c.parentId,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        isActive: c.isActive,
      }))}
      specs={specs.map((s) => ({
        id: s.id,
        code: s.code,
        brandName: s.brandName,
        colorHex: s.colorHex,
        specsJson: s.specsJson,
        isActive: s.isActive,
      }))}
      services={serviceRows.map((s) => ({
        id: s.id,
        code: s.code,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        descriptionEn: s.descriptionEn,
        descriptionAr: s.descriptionAr,
        categoryId: s.categoryId,
        specId: s.specId,
        type: s.type,
        priceSedan: s.priceSedan,
        priceSuv: s.priceSuv,
        priceHatchback: s.priceHatchback,
        priceTruck: s.priceTruck,
        priceCoupe: s.priceCoupe,
        priceMotorbike: s.priceMotorbike,
        priceOther: s.priceOther,
        includedServiceIdsJson: s.includedServiceIdsJson,
        isActive: s.isActive,
      }))}
    />
  );
}
