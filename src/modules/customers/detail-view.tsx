"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Table,
  Td,
  Th,
} from "@/components/ui";
import {
  VehicleFormModal,
  type VehicleFormValue,
} from "@/modules/vehicles/VehicleFormModal";
import { deleteVehicle } from "@/modules/vehicles/actions";
import { CustomerFormModal, type CustomerFormValue } from "./CustomerFormModal";
import "./customers.css";
import "@/modules/vehicles/vehicles.css";

interface CustomerData extends CustomerFormValue {
  id: string;
  createdAt: string;
}

interface VehicleRow extends VehicleFormValue {
  id: string;
  completedServicesCount: number;
}

export function CustomerDetailView({
  customer,
  vehicles,
}: {
  customer: CustomerData | null;
  vehicles: VehicleRow[];
}) {
  const { t, lang } = useLang();
  const [editOpen, setEditOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleRow | null>(null);

  if (!customer) {
    return (
      <div className="page page--md">
        <Link href="/customers" className="customer-detail__back">
          <ArrowLeft size={15} aria-hidden />
          {t("customers.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("customers.notFound")} />
        </Card>
      </div>
    );
  }

  const infoRows: Array<{ label: string; value: string | null }> = [
    { label: t("common.phone"), value: customer.phone },
    { label: t("common.email"), value: customer.email },
    { label: t("customers.company"), value: customer.company },
    {
      label: t("customers.heardFrom"),
      value: customer.heardFrom
        ? t(`customers.heardFrom.${customer.heardFrom}` as DictKey)
        : null,
    },
    { label: t("customers.socialPlatform"), value: customer.socialPlatform },
    { label: t("customers.referralName"), value: customer.referralName },
    { label: t("customers.referralMobile"), value: customer.referralMobile },
    { label: t("customers.heardFromOther"), value: customer.heardFromOther },
    { label: t("customers.notes"), value: customer.notes },
    {
      label: t("customers.since"),
      value: new Date(customer.createdAt).toLocaleDateString(lang === "ar" ? "ar" : "en", {
        dateStyle: "medium",
      }),
    },
  ];

  async function onDeleteVehicle(row: VehicleRow) {
    if (!confirm(t("common.confirmDelete"))) return;
    await deleteVehicle(row.id);
  }

  return (
    <div className="page page--lg">
      <Link href="/customers" className="customer-detail__back">
        <ArrowLeft size={15} aria-hidden />
        {t("customers.backToList")}
      </Link>

      <div className="customer-detail">
        {/* profile */}
        <Card>
          <CardHeader
            title={`${customer.firstName} ${customer.lastName}`}
            actions={
              <Button variant="ghost" title={t("common.edit")} onClick={() => setEditOpen(true)}>
                <Pencil size={15} aria-hidden />
              </Button>
            }
          />
          <div className="customer-detail__rows">
            {infoRows
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} className="customer-detail__row">
                  <span className="customer-detail__label">{r.label}</span>
                  <span className="customer-detail__value">{r.value}</span>
                </div>
              ))}
          </div>
        </Card>

        {/* vehicles */}
        <Card>
          <CardHeader
            title={t("customers.vehicles")}
            actions={
              <Button onClick={() => { setEditVehicle(null); setVehicleFormOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("vehicles.add")}
              </Button>
            }
          />
          {vehicles.length === 0 ? (
            <EmptyState message={t("vehicles.none")} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("vehicles.plate")}</Th>
                  <Th>{t("vehicles.make")}</Th>
                  <Th>{t("vehicles.model")}</Th>
                  <Th>{t("vehicles.type")}</Th>
                  <Th>{t("vehicles.year")}</Th>
                  <Th>{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <Td>
                      <span className="vehicles__plate">{v.plateNumber}</span>
                    </Td>
                    <Td className="td--strong">{v.make}</Td>
                    <Td>{v.model}</Td>
                    <Td>
                      <Badge tone="neutral">{t(`vehicles.type.${v.vehicleType}` as DictKey)}</Badge>
                    </Td>
                    <Td>{v.year ?? "—"}</Td>
                    <Td>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          title={t("common.edit")}
                          onClick={() => { setEditVehicle(v); setVehicleFormOpen(true); }}
                        >
                          <Pencil size={15} aria-hidden />
                        </Button>
                        <Button variant="ghost" title={t("common.delete")} onClick={() => onDeleteVehicle(v)}>
                          <Trash2 size={15} aria-hidden className="icon-danger" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <CustomerFormModal
        key={customer.id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
      />

      <VehicleFormModal
        key={editVehicle?.id ?? "new"}
        open={vehicleFormOpen}
        onClose={() => { setVehicleFormOpen(false); setEditVehicle(null); }}
        vehicle={editVehicle}
        customers={[]}
        fixedCustomerId={customer.id}
      />
    </div>
  );
}
