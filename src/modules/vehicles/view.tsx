"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Table,
  Td,
  Th,
} from "@/components/ui";
import { deleteVehicle } from "./actions";
import { VehicleFormModal, type CustomerOption, type VehicleFormValue } from "./VehicleFormModal";
import "./vehicles.css";

interface Row extends VehicleFormValue {
  id: string;
  completedServicesCount: number;
  ownerName: string;
}

export function VehiclesView({ vehicles, customers }: { vehicles: Row[]; customers: CustomerOption[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.ownerName.toLowerCase().includes(q) ||
        (v.vin ?? "").toLowerCase().includes(q)
    );
  }, [vehicles, query]);

  async function onDelete(row: Row) {
    if (!confirm(t("common.confirmDelete"))) return;
    await deleteVehicle(row.id);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("vehicles.title")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="vehicles__search"
              />
              <Button onClick={() => { setEditRow(null); setFormOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("vehicles.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
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
                <Th>{t("vehicles.owner")}</Th>
                <Th>{t("vehicles.completedServices")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
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
                    <Link href={`/customers/${v.customerId}`} className="td--strong">
                      {v.ownerName}
                    </Link>
                  </Td>
                  <Td>{v.completedServicesCount}</Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(v); setFormOpen(true); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(v)}>
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

      <VehicleFormModal
        key={editRow?.id ?? "new"}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        vehicle={editRow}
        customers={customers}
      />
    </div>
  );
}
