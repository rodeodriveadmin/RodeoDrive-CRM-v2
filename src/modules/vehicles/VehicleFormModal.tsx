"use client";

// Reusable add/edit vehicle modal — the vehicles cluster's public component,
// used by the vehicles list and the customer detail page.

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Button, Input, Label, Modal, Select } from "@/components/ui";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";
import { createVehicle, updateVehicle } from "./actions";

export interface VehicleFormValue {
  id?: string;
  customerId: string;
  make: string;
  model: string;
  year: string | null;
  vehicleType: string;
  color: string | null;
  plateNumber: string;
  vin: string | null;
  notes: string | null;
}

export interface CustomerOption {
  id: string;
  name: string;
}

export function VehicleFormModal({
  open,
  onClose,
  vehicle,
  customers,
  fixedCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  /** present = edit mode */
  vehicle?: VehicleFormValue | null;
  /** selectable owners (ignored when fixedCustomerId is set) */
  customers: CustomerOption[];
  /** lock the owner (customer detail page) */
  fixedCustomerId?: string;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const input = {
      customerId: fixedCustomerId ?? String(formData.get("customerId") ?? ""),
      make: String(formData.get("make") ?? ""),
      model: String(formData.get("model") ?? ""),
      year: String(formData.get("year") ?? ""),
      vehicleType: String(formData.get("vehicleType") ?? "SEDAN"),
      color: String(formData.get("color") ?? ""),
      plateNumber: String(formData.get("plateNumber") ?? ""),
      vin: String(formData.get("vin") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    const res = vehicle?.id ? await updateVehicle(vehicle.id, input) : await createVehicle(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={vehicle?.id ? t("common.edit") : t("vehicles.add")}>
      <form action={submit} className="form-stack">
        {!fixedCustomerId && (
          <div>
            <Label htmlFor="v-owner">{t("vehicles.owner")}</Label>
            <Select id="v-owner" name="customerId" defaultValue={vehicle?.customerId ?? ""} required>
              <option value="" disabled>
                —
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="form-grid-2">
          <div>
            <Label htmlFor="v-make">{t("vehicles.make")}</Label>
            <Input id="v-make" name="make" defaultValue={vehicle?.make ?? ""} required />
          </div>
          <div>
            <Label htmlFor="v-model">{t("vehicles.model")}</Label>
            <Input id="v-model" name="model" defaultValue={vehicle?.model ?? ""} required />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <Label htmlFor="v-year">{t("vehicles.year")}</Label>
            <Input id="v-year" name="year" inputMode="numeric" defaultValue={vehicle?.year ?? ""} />
          </div>
          <div>
            <Label htmlFor="v-type">{t("vehicles.type")}</Label>
            <Select id="v-type" name="vehicleType" defaultValue={vehicle?.vehicleType ?? "SEDAN"}>
              {VEHICLE_TYPES.map((vt) => (
                <option key={vt} value={vt}>
                  {t(`vehicles.type.${vt}` as DictKey)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <Label htmlFor="v-plate">{t("vehicles.plate")}</Label>
            <Input id="v-plate" name="plateNumber" defaultValue={vehicle?.plateNumber ?? ""} required />
          </div>
          <div>
            <Label htmlFor="v-color">{t("vehicles.color")}</Label>
            <Input id="v-color" name="color" defaultValue={vehicle?.color ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="v-vin">{t("vehicles.vin")}</Label>
          <Input id="v-vin" name="vin" defaultValue={vehicle?.vin ?? ""} />
        </div>
        <div>
          <Label htmlFor="v-notes">{t("vehicles.notes")}</Label>
          <Input id="v-notes" name="notes" defaultValue={vehicle?.notes ?? ""} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-footer">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={busy}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
