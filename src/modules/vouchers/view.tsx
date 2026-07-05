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
import { createVoucher, deleteVoucher } from "./actions";

interface Row {
  id: string;
  voucherNumber: string;
  title: string | null;
  customerName: string;
  customerMobile: string | null;
  vehicleType: string;
  validUntil: string | null;
  netAmount: number;
  balanceDue: number;
  createdAt: string;
}

export function VouchersView({ vouchers, catalog }: { vouchers: Row[]; catalog: CatalogOption[] }) {
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
    if (!q) return vouchers;
    return vouchers.filter(
      (r) =>
        r.voucherNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.customerMobile ?? "").includes(q)
    );
  }, [vouchers, query]);

  async function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (lines.length === 0) {
      setError(t("doc.linesRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createVoucher({
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
      amountPaid: formData.get("amountPaid"),
      includePaymentInfo: formData.get("includePaymentInfo") === "on",
      notes: String(formData.get("notes") ?? ""),
    });
    setBusy(false);
    if (res.error || !res.id) {
      setError(res.error === "NO_LINES" ? t("doc.linesRequired") : t("common.error"));
      return;
    }
    setCreateOpen(false);
    setLines([]);
    router.push(`/vouchers/${res.id}`);
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
          title={t("vouchers.title")}
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
                {t("vouchers.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("vouchers.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("vouchers.number")}</Th>
                <Th>{t("doc.customer")}</Th>
                <Th>{t("doc.mobile")}</Th>
                <Th>{t("doc.validUntil")}</Th>
                <Th>{t("doc.grandTotal")}</Th>
                <Th>{t("doc.balance")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <Link href={`/vouchers/${r.id}`} className="row-link">
                      {r.voucherNumber}
                    </Link>
                  </Td>
                  <Td className="td--strong">{r.customerName}</Td>
                  <Td>{r.customerMobile ?? "—"}</Td>
                  <Td>{r.validUntil ?? "—"}</Td>
                  <Td className="td--strong">{r.netAmount.toLocaleString()}</Td>
                  <Td>{r.balanceDue.toLocaleString()}</Td>
                  <Td>
                    <Button
                      variant="ghost"
                      title={t("common.delete")}
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteVoucher(r.id);
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("vouchers.add")} wide>
        <form onSubmit={submitCreate} className="form-stack">
          <div className="form-grid-2">
            <div>
              <Label htmlFor="v-customer">{t("doc.customer")}</Label>
              <Input id="v-customer" name="customerName" required />
            </div>
            <div>
              <Label htmlFor="v-mobile">{t("doc.mobile")}</Label>
              <Input id="v-mobile" name="customerMobile" inputMode="tel" />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="v-vtype">{t("doc.vehicleType")}</Label>
              <Select id="v-vtype" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t(`vehicles.type.${v}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="v-valid">{t("doc.validUntil")}</Label>
              <Input id="v-valid" name="validUntil" type="date" />
            </div>
          </div>

          <div>
            <Label>{t("doc.item")}</Label>
            <DocLinesEditor lines={lines} onChange={setLines} catalog={catalog} vehicleType={vehicleType} />
          </div>

          <div className="form-grid-2">
            <div>
              <Label htmlFor="v-discount">{t("doc.discount")}</Label>
              <Input id="v-discount" name="discountAmount" inputMode="decimal" defaultValue="" />
            </div>
            <div>
              <Label htmlFor="v-vat">{t("jobs.vatRate")}</Label>
              <Input id="v-vat" name="vatRate" inputMode="decimal" defaultValue="5" />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="v-paid">{t("vouchers.amountPaid")}</Label>
              <Input id="v-paid" name="amountPaid" inputMode="decimal" defaultValue="" />
            </div>
            <div>
              <Label htmlFor="v-title">{t("vouchers.titleField")}</Label>
              <Input id="v-title" name="title" />
            </div>
          </div>
          <label className="check-item">
            <input type="checkbox" className="checkbox" name="includePaymentInfo" defaultChecked />
            {t("vouchers.includePaymentInfo")}
          </label>
          <div>
            <Label htmlFor="v-notes">{t("doc.notes")}</Label>
            <Input id="v-notes" name="notes" />
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
