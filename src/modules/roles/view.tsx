"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
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
import { RESOURCE_KEYS, type PolicyFlags, type ResourceKey } from "@/lib/rbac/keys";
import { createRole, deleteRole, saveRolePolicies, updateRole } from "./actions";
import "./roles.css";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  assigned: number;
}

type Matrix = Record<ResourceKey, PolicyFlags>;

const EMPTY_FLAGS: PolicyFlags = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canApprove: false,
};

function buildMatrix(partial: Partial<Record<ResourceKey, PolicyFlags>> | undefined): Matrix {
  const m = {} as Matrix;
  for (const key of RESOURCE_KEYS) m[key] = { ...EMPTY_FLAGS, ...(partial?.[key] ?? {}) };
  return m;
}

export function RolesView({
  roles,
  policiesByRole,
}: {
  roles: RoleRow[];
  policiesByRole: Record<string, Partial<Record<ResourceKey, PolicyFlags>>>;
}) {
  const { t } = useLang();
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<RoleRow | null>(null);
  const [policyRole, setPolicyRole] = useState<RoleRow | null>(null);
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ACTIONS: Array<{ key: keyof PolicyFlags; label: DictKey }> = [
    { key: "canRead", label: "roles.read" },
    { key: "canCreate", label: "roles.createP" },
    { key: "canUpdate", label: "roles.update" },
    { key: "canDelete", label: "roles.deleteP" },
    { key: "canApprove", label: "roles.approve" },
  ];

  async function submitAdd(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await createRole(
      String(formData.get("name") ?? ""),
      String(formData.get("description") ?? "")
    );
    setBusy(false);
    if (res.error) return setError(t("common.error"));
    setAddOpen(false);
  }

  async function submitEdit(formData: FormData) {
    if (!editRow) return;
    setBusy(true);
    setError(null);
    const res = await updateRole(
      editRow.id,
      String(formData.get("name") ?? ""),
      String(formData.get("description") ?? ""),
      editRow.isActive
    );
    setBusy(false);
    if (res.error) return setError(t("common.error"));
    setEditRow(null);
  }

  async function onDelete(row: RoleRow) {
    if (row.assigned > 0) {
      alert(t("roles.inUse"));
      return;
    }
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await deleteRole(row.id);
    if (res.error === "IN_USE") alert(t("roles.inUse"));
  }

  function openPolicies(role: RoleRow) {
    setPolicyRole(role);
    setMatrix(buildMatrix(policiesByRole[role.id]));
  }

  async function submitPolicies() {
    if (!policyRole || !matrix) return;
    setBusy(true);
    await saveRolePolicies(policyRole.id, matrix);
    setBusy(false);
    setPolicyRole(null);
    setMatrix(null);
  }

  return (
    <div className="page page--md">
      <Card>
        <CardHeader
          title={t("roles.title")}
          actions={
            <Button onClick={() => { setError(null); setAddOpen(true); }}>
              <Plus size={16} aria-hidden />
              {t("roles.add")}
            </Button>
          }
        />
        {roles.length === 0 ? (
          <EmptyState message={t("roles.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("roles.description")}</Th>
                <Th>{t("users.title")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <Td className="td--strong">{r.name}</Td>
                  <Td className="roles__desc-cell">{r.description ?? "—"}</Td>
                  <Td>{r.assigned}</Td>
                  <Td>
                    <Badge tone={r.isActive ? "success" : "danger"}>
                      {r.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <Button variant="ghost" title={t("roles.editPolicies")} onClick={() => openPolicies(r)}>
                        <SlidersHorizontal size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setError(null); setEditRow(r); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("common.delete")} onClick={() => onDelete(r)}>
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

      {/* Add role */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t("roles.add")}>
        <form action={submitAdd} className="form-stack">
          <div>
            <Label htmlFor="r-name">{t("common.name")}</Label>
            <Input id="r-name" name="name" required autoFocus />
          </div>
          <div>
            <Label htmlFor="r-desc">{t("roles.description")}</Label>
            <Input id="r-desc" name="description" />
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

      {/* Edit role */}
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title={t("common.edit")}>
        {editRow && (
          <form action={submitEdit} className="form-stack">
            <div>
              <Label htmlFor="re-name">{t("common.name")}</Label>
              <Input id="re-name" name="name" defaultValue={editRow.name} required />
            </div>
            <div>
              <Label htmlFor="re-desc">{t("roles.description")}</Label>
              <Input id="re-desc" name="description" defaultValue={editRow.description ?? ""} />
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

      {/* Policy matrix */}
      <Modal
        open={!!policyRole}
        onClose={() => { setPolicyRole(null); setMatrix(null); }}
        title={`${t("roles.policies")} — ${policyRole?.name ?? ""}`}
        wide
      >
        {matrix && (
          <div>
            <div className="policy-matrix thin-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <Th>{t("roles.resource")}</Th>
                    {ACTIONS.map((a) => (
                      <Th key={a.key} className="td--center">{t(a.label)}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCE_KEYS.map((key) => (
                    <tr key={key}>
                      <Td className="td--strong">{t(`resource.${key}` as DictKey)}</Td>
                      {ACTIONS.map((a) => (
                        <Td key={a.key} className="td--center">
                          <input
                            type="checkbox"
                            className="checkbox"
                            aria-label={`${key} ${a.key}`}
                            checked={matrix[key][a.key]}
                            onChange={(e) =>
                              setMatrix((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      [key]: { ...prev[key], [a.key]: e.target.checked },
                                    }
                                  : prev
                              )
                            }
                          />
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => { setPolicyRole(null); setMatrix(null); }}>
                {t("common.cancel")}
              </Button>
              <Button onClick={submitPolicies} disabled={busy}>{t("common.save")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
