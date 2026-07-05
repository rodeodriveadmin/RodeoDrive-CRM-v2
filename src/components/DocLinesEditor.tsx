"use client";

// Line-item builder for numbered documents (quotations, vouchers).
// Lines can come from the service catalog (auto-priced by vehicle type)
// or be typed as custom entries.

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button, Input, Select } from "@/components/ui";
import type { VehicleType } from "@/lib/vehicle-types";

export interface EditorLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface CatalogOption {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  priceSedan: number | null;
  priceSuv: number | null;
  priceHatchback: number | null;
  priceTruck: number | null;
  priceCoupe: number | null;
  priceMotorbike: number | null;
  priceOther: number | null;
}

const PRICE_BY_TYPE: Record<VehicleType, keyof CatalogOption> = {
  SEDAN: "priceSedan",
  SUV: "priceSuv",
  HATCHBACK: "priceHatchback",
  TRUCK: "priceTruck",
  COUPE: "priceCoupe",
  MOTORBIKE: "priceMotorbike",
  OTHER: "priceOther",
};

export function priceForVehicleType(svc: CatalogOption, vehicleType: string): number {
  const key = PRICE_BY_TYPE[(vehicleType as VehicleType) ?? "OTHER"] ?? "priceOther";
  const p = svc[key];
  if (typeof p === "number") return p;
  return typeof svc.priceOther === "number" ? svc.priceOther : 0;
}

export function DocLinesEditor({
  lines,
  onChange,
  catalog,
  vehicleType,
}: {
  lines: EditorLine[];
  onChange: (lines: EditorLine[]) => void;
  catalog: CatalogOption[];
  vehicleType: string;
}) {
  const { t, lang } = useLang();
  const [customName, setCustomName] = useState("");

  const svcName = (s: CatalogOption) => (lang === "ar" && s.nameAr ? s.nameAr : s.nameEn);

  function addFromCatalog(id: string) {
    const svc = catalog.find((s) => s.id === id);
    if (!svc) return;
    onChange([...lines, { name: svcName(svc), qty: 1, unitPrice: priceForVehicleType(svc, vehicleType) }]);
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    onChange([...lines, { name, qty: 1, unitPrice: 0 }]);
    setCustomName("");
  }

  function patch(idx: number, patchValue: Partial<EditorLine>) {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patchValue } : l)));
  }

  return (
    <div className="doc-lines">
      {lines.length > 0 && (
        <table className="doc-lines__table">
          <thead>
            <tr>
              <th>{t("doc.item")}</th>
              <th>{t("doc.qty")}</th>
              <th>{t("doc.unitPrice")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={idx}>
                <td>
                  <Input
                    value={l.name}
                    aria-label={t("doc.item")}
                    onChange={(e) => patch(idx, { name: e.target.value })}
                  />
                </td>
                <td>
                  <Input
                    value={l.qty}
                    inputMode="numeric"
                    aria-label={t("doc.qty")}
                    onChange={(e) => patch(idx, { qty: Number(e.target.value) || 1 })}
                  />
                </td>
                <td>
                  <Input
                    value={l.unitPrice}
                    inputMode="decimal"
                    aria-label={t("doc.unitPrice")}
                    onChange={(e) => patch(idx, { unitPrice: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    title={t("common.delete")}
                    onClick={() => onChange(lines.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={15} aria-hidden className="icon-danger" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="doc-lines__adders">
        <Select value="" onChange={(e) => addFromCatalog(e.target.value)} aria-label={t("doc.addLine")}>
          <option value="">{t("doc.addLine")}…</option>
          {catalog.map((s) => (
            <option key={s.id} value={s.id}>
              {svcName(s)} ({s.code})
            </option>
          ))}
        </Select>
        <Input
          placeholder={t("doc.customLine")}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addCustom} disabled={!customName.trim()}>
          <Plus size={15} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
