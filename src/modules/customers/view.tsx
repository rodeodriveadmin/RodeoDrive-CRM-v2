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
import { deleteCustomer } from "./actions";
import { CustomerFormModal, type CustomerFormValue } from "./CustomerFormModal";
import "./customers.css";

interface Row extends CustomerFormValue {
  id: string;
  createdAt: string;
  vehiclesCount: number;
}

export function CustomersView({ customers }: { customers: Row[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  async function onDelete(row: Row) {
    const msg = row.vehiclesCount > 0 ? t("customers.deleteHasVehicles") : t("common.confirmDelete");
    if (!confirm(msg)) return;
    await deleteCustomer(row.id);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("customers.title")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="customers__search"
              />
              <Button onClick={() => { setEditRow(null); setFormOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("customers.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("customers.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("common.phone")}</Th>
                <Th>{t("common.email")}</Th>
                <Th>{t("customers.company")}</Th>
                <Th>{t("customers.heardFrom")}</Th>
                <Th>{t("customers.vehicles")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <Link href={`/customers/${c.id}`} className="customers__name-link">
                      {c.firstName} {c.lastName}
                    </Link>
                  </Td>
                  <Td>{c.phone ?? "—"}</Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td>{c.company ?? "—"}</Td>
                  <Td>
                    {c.heardFrom ? (
                      <Badge tone="neutral">{t(`customers.heardFrom.${c.heardFrom}` as DictKey)}</Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{c.vehiclesCount}</Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(c); setFormOpen(true); }}>
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
      </Card>

      <CustomerFormModal
        key={editRow?.id ?? "new"}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        customer={editRow}
      />
    </div>
  );
}
