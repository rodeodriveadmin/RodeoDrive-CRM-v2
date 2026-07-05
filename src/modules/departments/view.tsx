"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
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
import { createDepartment, deleteDepartment, renameDepartment } from "./actions";

interface Row {
  id: string;
  key: string;
  name: string;
  members: number;
  createdAt: string;
}

export function DepartmentsView({ departments }: { departments: Row[] }) {
  const { t } = useLang();
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitAdd(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await createDepartment(String(formData.get("name") ?? ""));
    setBusy(false);
    if (res.error) return setError(t("common.error"));
    setAddOpen(false);
  }

  async function submitRename(formData: FormData) {
    if (!editRow) return;
    setBusy(true);
    setError(null);
    const res = await renameDepartment(editRow.id, String(formData.get("name") ?? ""));
    setBusy(false);
    if (res.error) return setError(t("common.error"));
    setEditRow(null);
  }

  async function onDelete(row: Row) {
    if (row.members > 0) {
      alert(t("departments.hasMembers"));
      return;
    }
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await deleteDepartment(row.id);
    if (res.error === "HAS_MEMBERS") alert(t("departments.hasMembers"));
  }

  return (
    <div className="page page--sm">
      <Card>
        <CardHeader
          title={t("departments.title")}
          actions={
            <Button onClick={() => { setError(null); setAddOpen(true); }}>
              <Plus size={16} aria-hidden />
              {t("departments.add")}
            </Button>
          }
        />
        {departments.length === 0 ? (
          <EmptyState message={t("departments.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("departments.members")}</Th>
                <Th>{t("common.createdAt")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <Td className="td--strong">{d.name}</Td>
                  <Td>{d.members}</Td>
                  <Td>{new Date(d.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("departments.rename")} onClick={() => { setError(null); setEditRow(d); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(d)}>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t("departments.add")}>
        <form action={submitAdd} className="form-stack">
          <div>
            <Label htmlFor="d-name">{t("departments.nameLabel")}</Label>
            <Input id="d-name" name="name" required autoFocus />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title={t("departments.rename")}>
        {editRow && (
          <form action={submitRename} className="form-stack">
            <div>
              <Label htmlFor="d-rename">{t("departments.nameLabel")}</Label>
              <Input id="d-rename" name="name" defaultValue={editRow.name} required autoFocus />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setEditRow(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>{t("common.save")}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
