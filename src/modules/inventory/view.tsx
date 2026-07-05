"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, PackagePlus, PackageMinus, X } from "lucide-react";
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
  Th,
} from "@/components/ui";
import {
  createInvCategory,
  createInvSubcategory,
  createProduct,
  deleteInvCategory,
  deleteInvSubcategory,
  deleteProduct,
  recordTransaction,
  updateProduct,
} from "./actions";
import "./inventory.css";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
}
interface SubcategoryRow {
  id: string;
  categoryId: string;
  name: string;
}
interface ProductRow {
  id: string;
  categoryId: string;
  subcategoryId: string | null;
  name: string;
  serialNumber: string | null;
  barcode: string | null;
  quantity: number;
  minQuantity: number;
  notes: string | null;
}
interface TxRow {
  id: string;
  type: string;
  qty: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  productName: string;
}

type Tab = "products" | "categories" | "transactions";

export function InventoryView({
  categories,
  subcategories,
  products,
  transactions,
}: {
  categories: CategoryRow[];
  subcategories: SubcategoryRow[];
  products: ProductRow[];
  transactions: TxRow[];
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("products");

  const TABS: Array<{ id: Tab; label: DictKey }> = [
    { id: "products", label: "inv.tab.products" },
    { id: "categories", label: "inv.tab.categories" },
    { id: "transactions", label: "inv.tab.transactions" },
  ];

  return (
    <div className="page page--lg">
      <div className="inv__tabs" role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            className={tab === tb.id ? "inv__tab is-active" : "inv__tab"}
            onClick={() => setTab(tb.id)}
          >
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <ProductsTab categories={categories} subcategories={subcategories} products={products} />
      )}
      {tab === "categories" && <CategoriesTab categories={categories} subcategories={subcategories} />}
      {tab === "transactions" && <TransactionsTab transactions={transactions} />}
    </div>
  );
}

/* ===================== PRODUCTS ===================== */

function ProductsTab({
  categories,
  subcategories,
  products,
}: {
  categories: CategoryRow[];
  subcategories: SubcategoryRow[];
  products: ProductRow[];
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProductRow | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [move, setMove] = useState<{ row: ProductRow; type: "ADD" | "CHECKOUT" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const subName = (id: string | null) => subcategories.find((s) => s.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.serialNumber ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  function stockBadge(p: ProductRow) {
    if (p.quantity <= 0) return <Badge tone="danger">{t("inv.outOfStock")}</Badge>;
    if (p.quantity <= p.minQuantity) return <Badge tone="warning">{t("inv.lowStock")}</Badge>;
    return <Badge tone="success">{p.quantity}</Badge>;
  }

  function openForm(row: ProductRow | null) {
    setEditRow(row);
    setFormCategory(row?.categoryId ?? "");
    setError(null);
    setFormOpen(true);
  }

  async function submitProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const input = {
      categoryId: String(formData.get("categoryId") ?? ""),
      subcategoryId: String(formData.get("subcategoryId") ?? "") || undefined,
      name: String(formData.get("name") ?? ""),
      serialNumber: String(formData.get("serialNumber") ?? ""),
      barcode: String(formData.get("barcode") ?? ""),
      minQuantity: String(formData.get("minQuantity") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    const res = editRow ? await updateProduct(editRow.id, input) : await createProduct(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  async function submitMove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!move) return;
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await recordTransaction(
      move.row.id,
      move.type,
      formData.get("qty"),
      String(formData.get("notes") ?? "")
    );
    setBusy(false);
    if (res.error) {
      setError(res.error === "INSUFFICIENT" ? t("inv.insufficient") : t("common.error"));
      return;
    }
    setMove(null);
  }

  return (
    <Card>
      <CardHeader
        title={t("inv.tab.products")}
        actions={
          <>
            <Input
              placeholder={t("common.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="toolbar-search"
            />
            <Button onClick={() => openForm(null)} disabled={categories.length === 0}>
              <Plus size={16} aria-hidden />
              {t("inv.addProduct")}
            </Button>
          </>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState message={t("inv.productsNone")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("inv.product")}</Th>
              <Th>{t("inv.category")}</Th>
              <Th>{t("inv.subcategory")}</Th>
              <Th>{t("inv.serial")}</Th>
              <Th>{t("inv.stock")}</Th>
              <Th>{t("common.actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <Td className="td--strong">{p.name}</Td>
                <Td>{catName(p.categoryId)}</Td>
                <Td>{subName(p.subcategoryId)}</Td>
                <Td>{p.serialNumber ?? p.barcode ?? "—"}</Td>
                <Td>{stockBadge(p)}</Td>
                <Td>
                  <div className="row-actions">
                    <Button
                      variant="ghost"
                      title={t("inv.addStock")}
                      onClick={() => { setError(null); setMove({ row: p, type: "ADD" }); }}
                    >
                      <PackagePlus size={15} aria-hidden className="icon-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      title={t("inv.checkout")}
                      onClick={() => { setError(null); setMove({ row: p, type: "CHECKOUT" }); }}
                    >
                      <PackageMinus size={15} aria-hidden className="icon-danger" />
                    </Button>
                    <Button variant="ghost" title={t("common.edit")} onClick={() => openForm(p)}>
                      <Pencil size={15} aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      title={t("common.delete")}
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteProduct(p.id);
                      }}
                    >
                      <Trash2 size={15} aria-hidden className="icon-danger" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* product form */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("inv.addProduct")}
      >
        <form onSubmit={submitProduct} className="form-stack" key={editRow?.id ?? "new"}>
          <div>
            <Label htmlFor="p-name">{t("common.name")}</Label>
            <Input id="p-name" name="name" defaultValue={editRow?.name ?? ""} required />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="p-cat">{t("inv.category")}</Label>
              <Select
                id="p-cat"
                name="categoryId"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
              >
                <option value="" disabled>
                  —
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="p-sub">{t("inv.subcategory")}</Label>
              <Select id="p-sub" name="subcategoryId" defaultValue={editRow?.subcategoryId ?? ""}>
                <option value="">—</option>
                {subcategories
                  .filter((s) => s.categoryId === formCategory)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="p-serial">{t("inv.serial")}</Label>
              <Input id="p-serial" name="serialNumber" defaultValue={editRow?.serialNumber ?? ""} />
            </div>
            <div>
              <Label htmlFor="p-barcode">{t("inv.barcode")}</Label>
              <Input id="p-barcode" name="barcode" defaultValue={editRow?.barcode ?? ""} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="p-min">{t("inv.minStock")}</Label>
              <Input id="p-min" name="minQuantity" inputMode="numeric" defaultValue={editRow?.minQuantity ?? 0} />
            </div>
            <div>
              <Label htmlFor="p-notes">{t("customers.notes")}</Label>
              <Input id="p-notes" name="notes" defaultValue={editRow?.notes ?? ""} />
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

      {/* stock movement */}
      <Modal
        open={!!move}
        onClose={() => setMove(null)}
        title={move?.type === "ADD" ? t("inv.addStock") : t("inv.checkout")}
      >
        {move && (
          <form onSubmit={submitMove} className="form-stack">
            <p className="form-hint">
              {move.row.name} · {t("inv.stock")}: {move.row.quantity}
            </p>
            <div>
              <Label htmlFor="m-qty">{t("inv.qty")}</Label>
              <Input id="m-qty" name="qty" inputMode="numeric" defaultValue="1" required autoFocus />
            </div>
            <div>
              <Label htmlFor="m-notes">{t("customers.notes")}</Label>
              <Input id="m-notes" name="notes" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setMove(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy} variant={move.type === "CHECKOUT" ? "danger" : "primary"}>
                {move.type === "ADD" ? t("inv.addStock") : t("inv.checkout")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  );
}

/* ===================== CATEGORIES ===================== */

function CategoriesTab({
  categories,
  subcategories,
}: {
  categories: CategoryRow[];
  subcategories: SubcategoryRow[];
}) {
  const { t } = useLang();
  const [addOpen, setAddOpen] = useState(false);
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submitCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    await createInvCategory(
      String(formData.get("name") ?? ""),
      String(formData.get("description") ?? "")
    );
    setBusy(false);
    setAddOpen(false);
  }

  async function addSub(categoryId: string) {
    const name = (subDrafts[categoryId] ?? "").trim();
    if (!name) return;
    await createInvSubcategory(categoryId, name);
    setSubDrafts((prev) => ({ ...prev, [categoryId]: "" }));
  }

  async function onDeleteCategory(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await deleteInvCategory(id);
    if (res.error === "IN_USE") alert(t("inv.categoryInUse"));
  }

  return (
    <Card>
      <CardHeader
        title={t("inv.tab.categories")}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} aria-hidden />
            {t("inv.addCategory")}
          </Button>
        }
      />
      {categories.length === 0 ? (
        <EmptyState message={t("inv.categoriesNone")} />
      ) : (
        categories.map((c) => (
          <div key={c.id} className="inv__cat-row">
            <div>
              <div className="inv__cat-name">{c.name}</div>
              <div className="inv__subs">
                {subcategories
                  .filter((s) => s.categoryId === c.id)
                  .map((s) => (
                    <span key={s.id} className="inv__sub-chip">
                      {s.name}
                      <button
                        className="inv__sub-remove"
                        title={t("common.delete")}
                        onClick={() => deleteInvSubcategory(s.id)}
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </span>
                  ))}
                <span className="inv__sub-add">
                  <Input
                    placeholder={t("inv.addSubcategory")}
                    value={subDrafts[c.id] ?? ""}
                    onChange={(e) => setSubDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSub(c.id);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    title={t("inv.addSubcategory")}
                    onClick={() => addSub(c.id)}
                    disabled={!(subDrafts[c.id] ?? "").trim()}
                  >
                    <Plus size={15} aria-hidden />
                  </Button>
                </span>
              </div>
            </div>
            <Button variant="ghost" title={t("common.delete")} onClick={() => onDeleteCategory(c.id)}>
              <Trash2 size={15} aria-hidden className="icon-danger" />
            </Button>
          </div>
        ))
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t("inv.addCategory")}>
        <form onSubmit={submitCategory} className="form-stack">
          <div>
            <Label htmlFor="ic-name">{t("common.name")}</Label>
            <Input id="ic-name" name="name" required autoFocus />
          </div>
          <div>
            <Label htmlFor="ic-desc">{t("roles.description")}</Label>
            <Input id="ic-desc" name="description" />
          </div>
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ===================== TRANSACTIONS ===================== */

function TransactionsTab({ transactions }: { transactions: TxRow[] }) {
  const { t, lang } = useLang();

  return (
    <Card>
      <CardHeader title={t("inv.tab.transactions")} />
      {transactions.length === 0 ? (
        <EmptyState message={t("inv.transactionsNone")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("common.createdAt")}</Th>
              <Th>{t("inv.product")}</Th>
              <Th>{t("common.actions")}</Th>
              <Th>{t("inv.qty")}</Th>
              <Th>{t("inv.by")}</Th>
              <Th>{t("customers.notes")}</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <Td>
                  {new Date(tx.createdAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Td>
                <Td className="td--strong">{tx.productName}</Td>
                <Td>
                  <Badge tone={tx.type === "ADD" ? "success" : "warning"}>
                    {t(`inv.type.${tx.type}` as DictKey)}
                  </Badge>
                </Td>
                <Td>{tx.type === "ADD" ? `+${tx.qty}` : `-${tx.qty}`}</Td>
                <Td>{tx.createdBy ?? "—"}</Td>
                <Td className="td--wrap">{tx.notes ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
