"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { createEmployee, deleteEmployee, updateEmployee } from "./actions";

interface Row {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  salary: number | null;
  isTechnician: boolean;
  isActive: boolean;
}

export function EmployeesView({ employees }: { employees: Row[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q) ||
        (e.phone ?? "").includes(q)
    );
  }, [employees, query]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const input = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      position: String(formData.get("position") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      salary: String(formData.get("salary") ?? ""),
      isTechnician: formData.get("isTechnician") === "on",
      isActive: formData.get("isActive") === "on",
    };
    const res = editRow ? await updateEmployee(editRow.id, input) : await createEmployee(input);
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setFormOpen(false);
    setEditRow(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("emp.title")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setEditRow(null); setError(null); setFormOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("emp.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("emp.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("emp.position")}</Th>
                <Th>{t("common.phone")}</Th>
                <Th>{t("common.email")}</Th>
                <Th>{t("emp.salary")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <Td className="td--strong">
                    {e.firstName} {e.lastName}{" "}
                    {e.isTechnician && <Badge tone="brand">{t("emp.technicianBadge")}</Badge>}
                  </Td>
                  <Td>{e.position ?? "—"}</Td>
                  <Td>{e.phone ?? "—"}</Td>
                  <Td>{e.email ?? "—"}</Td>
                  <Td>{e.salary !== null ? e.salary.toLocaleString() : "—"}</Td>
                  <Td>
                    <Badge tone={e.isActive ? "success" : "danger"}>
                      {e.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setEditRow(e); setError(null); setFormOpen(true); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        title={t("common.delete")}
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) deleteEmployee(e.id);
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
      </Card>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        title={editRow ? t("common.edit") : t("emp.add")}
      >
        <form onSubmit={submit} className="form-stack" key={editRow?.id ?? "new"}>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="e-first">{t("emp.firstName")}</Label>
              <Input id="e-first" name="firstName" defaultValue={editRow?.firstName ?? ""} required />
            </div>
            <div>
              <Label htmlFor="e-last">{t("emp.lastName")}</Label>
              <Input id="e-last" name="lastName" defaultValue={editRow?.lastName ?? ""} required />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="e-position">{t("emp.position")}</Label>
              <Input id="e-position" name="position" defaultValue={editRow?.position ?? ""} />
            </div>
            <div>
              <Label htmlFor="e-salary">{t("emp.salary")}</Label>
              <Input id="e-salary" name="salary" inputMode="decimal" defaultValue={editRow?.salary ?? ""} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="e-phone">{t("common.phone")}</Label>
              <Input id="e-phone" name="phone" inputMode="tel" defaultValue={editRow?.phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="e-email">{t("common.email")}</Label>
              <Input id="e-email" name="email" type="email" defaultValue={editRow?.email ?? ""} />
            </div>
          </div>
          <label className="check-item">
            <input
              type="checkbox"
              className="checkbox"
              name="isTechnician"
              defaultChecked={editRow?.isTechnician ?? false}
            />
            {t("emp.isTechnician")}
          </label>
          <label className="check-item">
            <input
              type="checkbox"
              className="checkbox"
              name="isActive"
              defaultChecked={editRow?.isActive ?? true}
            />
            {t("common.active")}
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setFormOpen(false); setEditRow(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
