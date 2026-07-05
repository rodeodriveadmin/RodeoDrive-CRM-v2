"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import {
  createCategory,
  createService,
  createSpec,
  deleteCategory,
  deleteService,
  deleteSpec,
  updateCategory,
  updateService,
  updateSpec,
} from "./actions";
import "./catalog.css";

/* ---------- data shapes (mirror page.tsx) ---------- */

interface CategoryRow {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  parentId: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isActive: boolean;
}

interface SpecRow {
  id: string;
  code: string;
  brandName: string;
  colorHex: string;
  specsJson: string;
  isActive: boolean;
}

interface ServiceRow {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  categoryId: string | null;
  specId: string | null;
  type: string;
  priceSedan: number | null;
  priceSuv: number | null;
  priceHatchback: number | null;
  priceTruck: number | null;
  priceCoupe: number | null;
  priceMotorbike: number | null;
  priceOther: number | null;
  includedServiceIdsJson: string;
  isActive: boolean;
}

type Tab = "services" | "categories" | "specs";

const PRICE_FIELDS = [
  { name: "sedan", key: "priceSedan", label: "vehicles.type.SEDAN" },
  { name: "suv", key: "priceSuv", label: "vehicles.type.SUV" },
  { name: "hatchback", key: "priceHatchback", label: "vehicles.type.HATCHBACK" },
  { name: "truck", key: "priceTruck", label: "vehicles.type.TRUCK" },
  { name: "coupe", key: "priceCoupe", label: "vehicles.type.COUPE" },
  { name: "motorbike", key: "priceMotorbike", label: "vehicles.type.MOTORBIKE" },
  { name: "other", key: "priceOther", label: "vehicles.type.OTHER" },
] as const;

export function CatalogView({
  categories,
  specs,
  services,
}: {
  categories: CategoryRow[];
  specs: SpecRow[];
  services: ServiceRow[];
}) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("services");

  const catName = (c: CategoryRow) => (lang === "ar" ? c.nameAr : c.nameEn);

  /** "Parent › Child" label for selects and table cells */
  const catPath = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return (id: string | null): string => {
      if (!id) return "—";
      const parts: string[] = [];
      let cur = byId.get(id);
      let guard = 0;
      while (cur && guard++ < 6) {
        parts.unshift(lang === "ar" ? cur.nameAr : cur.nameEn);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return parts.join(" › ");
    };
  }, [categories, lang]);

  const TABS: Array<{ id: Tab; label: DictKey }> = [
    { id: "services", label: "catalog.tab.services" },
    { id: "categories", label: "catalog.tab.categories" },
    { id: "specs", label: "catalog.tab.specs" },
  ];

  return (
    <div className="page page--lg">
      <div className="catalog__tabs" role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            className={tab === tb.id ? "catalog__tab is-active" : "catalog__tab"}
            onClick={() => setTab(tb.id)}
          >
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <ServicesTab services={services} categories={categories} specs={specs} catPath={catPath} />
      )}
      {tab === "categories" && <CategoriesTab categories={categories} catPath={catPath} catName={catName} />}
      {tab === "specs" && <SpecsTab specs={specs} />}
    </div>
  );
}

/* ===================== CATEGORIES TAB ===================== */

function CategoriesTab({
  categories,
  catPath,
  catName,
}: {
  categories: CategoryRow[];
  catPath: (id: string | null) => string;
  catName: (c: CategoryRow) => string;
}) {
  const { t } = useLang();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<CategoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const input = {
      code: String(formData.get("code") ?? ""),
      nameEn: String(formData.get("nameEn") ?? ""),
      nameAr: String(formData.get("nameAr") ?? ""),
      parentId: String(formData.get("parentId") ?? "") || null,
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      descriptionAr: String(formData.get("descriptionAr") ?? ""),
    };
    const res = editRow ? await updateCategory(editRow.id, input) : await createCategory(input);
    setBusy(false);
    if (res.error) {
      setError(res.error === "CODE_EXISTS" ? t("catalog.codeExists") : t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  async function onDelete(row: CategoryRow) {
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await deleteCategory(row.id);
    if (res.error === "HAS_CHILDREN") alert(t("catalog.categoryHasChildren"));
    else if (res.error === "IN_USE") alert(t("catalog.categoryInUse"));
  }

  return (
    <Card>
      <CardHeader
        title={t("catalog.tab.categories")}
        actions={
          <Button onClick={() => { setEditRow(null); setError(null); setFormOpen(true); }}>
            <Plus size={16} aria-hidden />
            {t("catalog.addCategory")}
          </Button>
        }
      />
      {categories.length === 0 ? (
        <EmptyState message={t("catalog.categoriesNone")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("catalog.code")}</Th>
              <Th>{t("catalog.nameEn")}</Th>
              <Th>{t("catalog.nameAr")}</Th>
              <Th>{t("catalog.parentCategory")}</Th>
              <Th>{t("common.actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <Td className="td--strong">{c.code}</Td>
                <Td>{c.nameEn}</Td>
                <Td>{c.nameAr}</Td>
                <Td className="catalog__cat-path">{catPath(c.parentId)}</Td>
                <Td>
                  <div className="row-actions">
                    <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(c); setError(null); setFormOpen(true); }}>
                      <Pencil size={15} aria-hidden />
                    </Button>
                    <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(c)}>
                      <Trash2 size={15} aria-hidden className="icon-danger" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("catalog.addCategory")}
      >
        <form action={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="cat-code">{t("catalog.code")}</Label>
              <Input id="cat-code" name="code" defaultValue={editRow?.code ?? ""} required />
            </div>
            <div>
              <Label htmlFor="cat-parent">{t("catalog.parentCategory")}</Label>
              <Select id="cat-parent" name="parentId" defaultValue={editRow?.parentId ?? ""}>
                <option value="">{t("catalog.noParent")}</option>
                {categories
                  .filter((c) => c.id !== editRow?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {catName(c)}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="cat-name-en">{t("catalog.nameEn")}</Label>
              <Input id="cat-name-en" name="nameEn" defaultValue={editRow?.nameEn ?? ""} required />
            </div>
            <div>
              <Label htmlFor="cat-name-ar">{t("catalog.nameAr")}</Label>
              <Input id="cat-name-ar" name="nameAr" dir="rtl" defaultValue={editRow?.nameAr ?? ""} required />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="cat-desc-en">{t("catalog.descriptionEn")}</Label>
              <Input id="cat-desc-en" name="descriptionEn" defaultValue={editRow?.descriptionEn ?? ""} />
            </div>
            <div>
              <Label htmlFor="cat-desc-ar">{t("catalog.descriptionAr")}</Label>
              <Input id="cat-desc-ar" name="descriptionAr" dir="rtl" defaultValue={editRow?.descriptionAr ?? ""} />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ===================== SPECS TAB ===================== */

function SpecsTab({ specs }: { specs: SpecRow[] }) {
  const { t } = useLang();
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<SpecRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function attributesOf(row: SpecRow | null): string {
    if (!row) return "";
    try {
      const arr = JSON.parse(row.specsJson);
      return Array.isArray(arr) ? arr.join("\n") : "";
    } catch {
      return "";
    }
  }

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const input = {
      code: String(formData.get("code") ?? ""),
      brandName: String(formData.get("brandName") ?? ""),
      colorHex: String(formData.get("colorHex") ?? "#c69a3f"),
      attributes: String(formData.get("attributes") ?? ""),
    };
    const res = editRow ? await updateSpec(editRow.id, input) : await createSpec(input);
    setBusy(false);
    if (res.error) {
      setError(res.error === "CODE_EXISTS" ? t("catalog.codeExists") : t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  async function onDelete(row: SpecRow) {
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await deleteSpec(row.id);
    if (res.error === "IN_USE") alert(t("catalog.specInUse"));
  }

  return (
    <Card>
      <CardHeader
        title={t("catalog.tab.specs")}
        actions={
          <Button onClick={() => { setEditRow(null); setError(null); setFormOpen(true); }}>
            <Plus size={16} aria-hidden />
            {t("catalog.addSpec")}
          </Button>
        }
      />
      {specs.length === 0 ? (
        <EmptyState message={t("catalog.specsNone")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("catalog.code")}</Th>
              <Th>{t("catalog.brandName")}</Th>
              <Th>{t("catalog.specAttributes")}</Th>
              <Th>{t("common.actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {specs.map((s) => (
              <tr key={s.id}>
                <Td className="td--strong">{s.code}</Td>
                <Td>
                  <span className="catalog__swatch" style={{ background: s.colorHex }} aria-hidden />
                  {s.brandName}
                </Td>
                <Td className="td--wrap">{attributesOf(s).split("\n").filter(Boolean).join(" · ") || "—"}</Td>
                <Td>
                  <div className="row-actions">
                    <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(s); setError(null); setFormOpen(true); }}>
                      <Pencil size={15} aria-hidden />
                    </Button>
                    <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(s)}>
                      <Trash2 size={15} aria-hidden className="icon-danger" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("catalog.addSpec")}
      >
        <form action={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="spec-code">{t("catalog.code")}</Label>
              <Input id="spec-code" name="code" defaultValue={editRow?.code ?? ""} required />
            </div>
            <div>
              <Label htmlFor="spec-color">{t("catalog.color")}</Label>
              <input
                id="spec-color"
                name="colorHex"
                type="color"
                className="catalog__color-input"
                defaultValue={editRow?.colorHex ?? "#c69a3f"}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="spec-brand">{t("catalog.brandName")}</Label>
            <Input id="spec-brand" name="brandName" defaultValue={editRow?.brandName ?? ""} required />
          </div>
          <div>
            <Label htmlFor="spec-attrs">{t("catalog.specAttributes")}</Label>
            <Textarea id="spec-attrs" name="attributes" rows={4} defaultValue={attributesOf(editRow)} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ===================== SERVICES TAB ===================== */

function ServicesTab({
  services,
  categories,
  specs,
  catPath,
}: {
  services: ServiceRow[];
  categories: CategoryRow[];
  specs: SpecRow[];
  catPath: (id: string | null) => string;
}) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<ServiceRow | null>(null);
  const [formType, setFormType] = useState<string>("SERVICE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svcName = (s: ServiceRow) => (lang === "ar" && s.nameAr ? s.nameAr : s.nameEn);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        (s.nameAr ?? "").toLowerCase().includes(q)
    );
  }, [services, query]);

  function minPrice(s: ServiceRow): number | null {
    const prices = [
      s.priceSedan, s.priceSuv, s.priceHatchback, s.priceTruck,
      s.priceCoupe, s.priceMotorbike, s.priceOther,
    ].filter((p): p is number => p !== null);
    return prices.length ? Math.min(...prices) : null;
  }

  function includedIds(row: ServiceRow | null): string[] {
    if (!row) return [];
    try {
      const arr = JSON.parse(row.includedServiceIdsJson);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function openForm(row: ServiceRow | null) {
    setEditRow(row);
    setFormType(row?.type ?? "SERVICE");
    setError(null);
    setFormOpen(true);
  }

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const input = {
      code: String(formData.get("code") ?? ""),
      nameEn: String(formData.get("nameEn") ?? ""),
      nameAr: String(formData.get("nameAr") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      descriptionAr: String(formData.get("descriptionAr") ?? ""),
      categoryId: String(formData.get("categoryId") ?? "") || null,
      specId: String(formData.get("specId") ?? "") || null,
      type: String(formData.get("type") ?? "SERVICE"),
      prices: {
        sedan: String(formData.get("price_sedan") ?? ""),
        suv: String(formData.get("price_suv") ?? ""),
        hatchback: String(formData.get("price_hatchback") ?? ""),
        truck: String(formData.get("price_truck") ?? ""),
        coupe: String(formData.get("price_coupe") ?? ""),
        motorbike: String(formData.get("price_motorbike") ?? ""),
        other: String(formData.get("price_other") ?? ""),
      },
      includedServiceIds: formData.getAll("included").map(String),
    };
    const res = editRow ? await updateService(editRow.id, input) : await createService(input);
    setBusy(false);
    if (res.error) {
      setError(res.error === "CODE_EXISTS" ? t("catalog.codeExists") : t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  async function onDelete(row: ServiceRow) {
    if (!confirm(t("common.confirmDelete"))) return;
    await deleteService(row.id);
  }

  return (
    <Card>
      <CardHeader
        title={t("catalog.tab.services")}
        actions={
          <>
            <Input
              placeholder={t("common.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="toolbar-search"
            />
            <Button onClick={() => openForm(null)}>
              <Plus size={16} aria-hidden />
              {t("catalog.addService")}
            </Button>
          </>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState message={t("catalog.servicesNone")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("catalog.code")}</Th>
              <Th>{t("common.name")}</Th>
              <Th>{t("catalog.type")}</Th>
              <Th>{t("catalog.category")}</Th>
              <Th>{t("catalog.spec")}</Th>
              <Th>{t("catalog.priceFrom")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const spec = specs.find((x) => x.id === s.specId);
              const from = minPrice(s);
              return (
                <tr key={s.id}>
                  <Td className="td--strong">{s.code}</Td>
                  <Td>{svcName(s)}</Td>
                  <Td>
                    <Badge tone={s.type === "PACKAGE" ? "brand" : "neutral"}>
                      {t(`catalog.type.${s.type}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td className="catalog__cat-path">{catPath(s.categoryId)}</Td>
                  <Td>
                    {spec ? (
                      <>
                        <span className="catalog__swatch" style={{ background: spec.colorHex }} aria-hidden />
                        {spec.brandName}
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{from !== null ? from.toLocaleString() : "—"}</Td>
                  <Td>
                    <Badge tone={s.isActive ? "success" : "danger"}>
                      {s.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("common.edit")} onClick={() => openForm(s)}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(s)}>
                        <Trash2 size={15} aria-hidden className="icon-danger" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("catalog.addService")}
        wide
      >
        <form action={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="svc-code">{t("catalog.code")}</Label>
              <Input id="svc-code" name="code" defaultValue={editRow?.code ?? ""} required />
            </div>
            <div>
              <Label htmlFor="svc-type">{t("catalog.type")}</Label>
              <Select
                id="svc-type"
                name="type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="SERVICE">{t("catalog.type.SERVICE")}</option>
                <option value="PACKAGE">{t("catalog.type.PACKAGE")}</option>
              </Select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="svc-name-en">{t("catalog.nameEn")}</Label>
              <Input id="svc-name-en" name="nameEn" defaultValue={editRow?.nameEn ?? ""} required />
            </div>
            <div>
              <Label htmlFor="svc-name-ar">{t("catalog.nameAr")}</Label>
              <Input id="svc-name-ar" name="nameAr" dir="rtl" defaultValue={editRow?.nameAr ?? ""} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="svc-desc-en">{t("catalog.descriptionEn")}</Label>
              <Input id="svc-desc-en" name="descriptionEn" defaultValue={editRow?.descriptionEn ?? ""} />
            </div>
            <div>
              <Label htmlFor="svc-desc-ar">{t("catalog.descriptionAr")}</Label>
              <Input id="svc-desc-ar" name="descriptionAr" dir="rtl" defaultValue={editRow?.descriptionAr ?? ""} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="svc-cat">{t("catalog.category")}</Label>
              <Select id="svc-cat" name="categoryId" defaultValue={editRow?.categoryId ?? ""}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {catPath(c.id)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="svc-spec">{t("catalog.spec")}</Label>
              <Select id="svc-spec" name="specId" defaultValue={editRow?.specId ?? ""}>
                <option value="">—</option>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.brandName} ({s.code})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("catalog.pricing")}</Label>
            <div className="catalog__price-grid">
              {PRICE_FIELDS.map((pf) => (
                <div key={pf.name}>
                  <Label htmlFor={`price-${pf.name}`}>{t(pf.label as DictKey)}</Label>
                  <Input
                    id={`price-${pf.name}`}
                    name={`price_${pf.name}`}
                    inputMode="decimal"
                    defaultValue={editRow?.[pf.key] ?? ""}
                  />
                </div>
              ))}
            </div>
            <p className="catalog__hint">{t("catalog.priceEmptyHint")}</p>
          </div>

          {formType === "PACKAGE" && (
            <div>
              <Label>{t("catalog.includedServices")}</Label>
              <div className="catalog__includes">
                {services
                  .filter((s) => s.type === "SERVICE" && s.id !== editRow?.id)
                  .map((s) => (
                    <label key={s.id} className="catalog__include-item">
                      <input
                        type="checkbox"
                        className="checkbox"
                        name="included"
                        value={s.id}
                        defaultChecked={includedIds(editRow).includes(s.id)}
                      />
                      {svcName(s)} ({s.code})
                    </label>
                  ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
