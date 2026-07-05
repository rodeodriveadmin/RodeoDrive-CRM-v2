"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
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
import { DocLinesEditor, type CatalogOption, type EditorLine } from "@/components/DocLinesEditor";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";
import { createQuotation, deleteQuotation } from "./actions";

interface Row {
  id: string;
  quoteNumber: string;
  title: string | null;
  customerName: string;
  customerMobile: string | null;
  vehicleType: string;
  validUntil: string | null;
  netAmount: number;
  createdAt: string;
}

export function QuotationsView({ quotations, catalog }: { quotations: Row[]; catalog: CatalogOption[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter(
      (r) =>
        r.quoteNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.customerMobile ?? "").includes(q)
    );
  }, [quotations, query]);

  async function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (lines.length === 0) {
      setError(t("doc.linesRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createQuotation({
      title: String(formData.get("title") ?? ""),
      customerName: String(formData.get("customerName") ?? ""),
      customerMobile: String(formData.get("customerMobile") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      vehicleType,
      vehiclePlate: String(formData.get("vehiclePlate") ?? ""),
      validUntil: String(formData.get("validUntil") ?? ""),
      lines,
      discountAmount: formData.get("discountAmount"),
      vatRate: formData.get("vatRate"),
      notes: String(formData.get("notes") ?? ""),
    });
    setBusy(false);
    if (res.error || !res.id) {
      setError(res.error === "NO_LINES" ? t("doc.linesRequired") : t("common.error"));
      return;
    }
    setCreateOpen(false);
    setLines([]);
    router.push(`/quotations/${res.id}`);
  }

  function openCreate() {
    setLines([]);
    setVehicleType("SEDAN");
    setError(null);
    setCreateOpen(true);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("quotes.title")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={openCreate}>
                <Plus size={16} aria-hidden />
                {t("quotes.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("quotes.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("quotes.number")}</Th>
                <Th>{t("doc.customer")}</Th>
                <Th>{t("doc.mobile")}</Th>
                <Th>{t("doc.vehicleType")}</Th>
                <Th>{t("doc.validUntil")}</Th>
                <Th>{t("doc.grandTotal")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <Link href={`/quotations/${r.id}`} className="row-link">
                      {r.quoteNumber}
                    </Link>
                  </Td>
                  <Td className="td--strong">{r.customerName}</Td>
                  <Td>{r.customerMobile ?? "—"}</Td>
                  <Td>{t(`vehicles.type.${r.vehicleType}` as DictKey)}</Td>
                  <Td>{r.validUntil ?? "—"}</Td>
                  <Td className="td--strong">{r.netAmount.toLocaleString()}</Td>
                  <Td>
                    <Button
                      variant="ghost"
                      title={t("common.delete")}
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteQuotation(r.id);
                      }}
                    >
                      <Trash2 size={15} aria-hidden className="icon-danger" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("quotes.add")} wide>
        <form onSubmit={submitCreate} className="form-stack">
          <div className="form-grid-2">
            <div>
              <Label htmlFor="q-customer">{t("doc.customer")}</Label>
              <Input id="q-customer" name="customerName" required />
            </div>
            <div>
              <Label htmlFor="q-mobile">{t("doc.mobile")}</Label>
              <Input id="q-mobile" name="customerMobile" inputMode="tel" />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="q-vtype">{t("doc.vehicleType")}</Label>
              <Select id="q-vtype" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t(`vehicles.type.${v}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="q-plate">{t("doc.plate")}</Label>
              <Input id="q-plate" name="vehiclePlate" />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="q-valid">{t("doc.validUntil")}</Label>
              <Input id="q-valid" name="validUntil" type="date" />
            </div>
            <div>
              <Label htmlFor="q-title">{t("quotes.titleField")}</Label>
              <Input id="q-title" name="title" />
            </div>
          </div>

          <div>
            <Label>{t("doc.item")}</Label>
            <DocLinesEditor lines={lines} onChange={setLines} catalog={catalog} vehicleType={vehicleType} />
          </div>

          <div className="form-grid-2">
            <div>
              <Label htmlFor="q-discount">{t("doc.discount")}</Label>
              <Input id="q-discount" name="discountAmount" inputMode="decimal" defaultValue="" />
            </div>
            <div>
              <Label htmlFor="q-vat">{t("jobs.vatRate")}</Label>
              <Input id="q-vat" name="vatRate" inputMode="decimal" defaultValue="5" />
            </div>
          </div>
          <div>
            <Label htmlFor="q-notes">{t("doc.notes")}</Label>
            <Input id="q-notes" name="notes" />
          </div>

          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
