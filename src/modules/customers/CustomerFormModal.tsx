"use client";

// Reusable add/edit customer modal — the customers cluster's public component.

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { Button, Input, Label, Modal, Select } from "@/components/ui";
import { createCustomer, updateCustomer } from "./actions";

export const HEARD_FROM_OPTIONS = [
  "GOOGLE",
  "SOCIAL_MEDIA",
  "FRIEND_REFERRAL",
  "WALK_IN",
  "OTHER",
] as const;

export interface CustomerFormValue {
  id?: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  heardFrom: string | null;
  socialPlatform: string | null;
  referralName: string | null;
  referralMobile: string | null;
  heardFromOther: string | null;
}

export function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer?: CustomerFormValue | null;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heardFrom, setHeardFrom] = useState(customer?.heardFrom ?? "");

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const input = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company: String(formData.get("company") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      heardFrom: String(formData.get("heardFrom") ?? ""),
      socialPlatform: String(formData.get("socialPlatform") ?? ""),
      referralName: String(formData.get("referralName") ?? ""),
      referralMobile: String(formData.get("referralMobile") ?? ""),
      heardFromOther: String(formData.get("heardFromOther") ?? ""),
    };
    const res = customer?.id ? await updateCustomer(customer.id, input) : await createCustomer(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={customer?.id ? t("common.edit") : t("customers.add")}>
      <form action={submit} className="form-stack">
        <div className="form-grid-2">
          <div>
            <Label htmlFor="c-first">{t("customers.firstName")}</Label>
            <Input id="c-first" name="firstName" defaultValue={customer?.firstName ?? ""} required />
          </div>
          <div>
            <Label htmlFor="c-last">{t("customers.lastName")}</Label>
            <Input id="c-last" name="lastName" defaultValue={customer?.lastName ?? ""} required />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <Label htmlFor="c-phone">{t("common.phone")}</Label>
            <Input id="c-phone" name="phone" inputMode="tel" defaultValue={customer?.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-email">{t("common.email")}</Label>
            <Input id="c-email" name="email" type="email" defaultValue={customer?.email ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="c-company">{t("customers.company")}</Label>
          <Input id="c-company" name="company" defaultValue={customer?.company ?? ""} />
        </div>
        <div>
          <Label htmlFor="c-heard">{t("customers.heardFrom")}</Label>
          <Select
            id="c-heard"
            name="heardFrom"
            value={heardFrom}
            onChange={(e) => setHeardFrom(e.target.value)}
          >
            <option value="">—</option>
            {HEARD_FROM_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {t(`customers.heardFrom.${o}` as DictKey)}
              </option>
            ))}
          </Select>
        </div>
        {heardFrom === "SOCIAL_MEDIA" && (
          <div>
            <Label htmlFor="c-social">{t("customers.socialPlatform")}</Label>
            <Input id="c-social" name="socialPlatform" defaultValue={customer?.socialPlatform ?? ""} />
          </div>
        )}
        {heardFrom === "FRIEND_REFERRAL" && (
          <div className="form-grid-2">
            <div>
              <Label htmlFor="c-refname">{t("customers.referralName")}</Label>
              <Input id="c-refname" name="referralName" defaultValue={customer?.referralName ?? ""} />
            </div>
            <div>
              <Label htmlFor="c-refmob">{t("customers.referralMobile")}</Label>
              <Input id="c-refmob" name="referralMobile" defaultValue={customer?.referralMobile ?? ""} />
            </div>
          </div>
        )}
        {heardFrom === "OTHER" && (
          <div>
            <Label htmlFor="c-heardother">{t("customers.heardFromOther")}</Label>
            <Input id="c-heardother" name="heardFromOther" defaultValue={customer?.heardFromOther ?? ""} />
          </div>
        )}
        <div>
          <Label htmlFor="c-notes">{t("customers.notes")}</Label>
          <Input id="c-notes" name="notes" defaultValue={customer?.notes ?? ""} />
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
