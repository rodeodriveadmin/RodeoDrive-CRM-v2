"use client";

import { useMemo, useState } from "react";
import { UserPlus, KeyRound, Pencil, Power, ShieldCheck } from "lucide-react";
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
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { inviteUser, resetUserPassword, setUserActive, unblockUser, updateUserProfile } from "./actions";
import "./users.css";

interface Row {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  employeeId: string | null;
  mobileNumber: string | null;
  departmentId: string | null;
  roleId: string | null;
  isActive: boolean;
  isRoot: boolean;
  isBlocked: boolean;
}
interface Option {
  id: string;
  name: string;
}

export function UsersView({
  users,
  departments,
  roles,
}: {
  users: Row[];
  departments: Option[];
  roles: Option[];
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<Row | null>(null);
  const [pwUser, setPwUser] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";
  const roleName = (id: string | null) => roles.find((r) => r.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  async function submitInvite(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await inviteUser({
      email: String(formData.get("email") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      password: String(formData.get("password") ?? ""),
      employeeId: String(formData.get("employeeId") ?? ""),
      mobileNumber: String(formData.get("mobileNumber") ?? ""),
      departmentId: String(formData.get("departmentId") ?? "") || undefined,
      roleId: String(formData.get("roleId") ?? "") || undefined,
    });
    setBusy(false);
    if (res.error) {
      setError(
        res.error === "EMAIL_EXISTS"
          ? t("users.emailExists")
          : res.error === "WEAK_PASSWORD"
            ? t("common.weakPassword")
            : t("common.error")
      );
      return;
    }
    setInviteOpen(false);
  }

  async function submitEdit(formData: FormData) {
    if (!editUser) return;
    setBusy(true);
    setError(null);
    const res = await updateUserProfile(editUser.userId, {
      fullName: String(formData.get("fullName") ?? ""),
      employeeId: String(formData.get("employeeId") ?? ""),
      mobileNumber: String(formData.get("mobileNumber") ?? ""),
      departmentId: String(formData.get("departmentId") ?? "") || null,
      roleId: String(formData.get("roleId") ?? "") || null,
    });
    setBusy(false);
    if (res.error) {
      setError(t("common.error"));
      return;
    }
    setEditUser(null);
  }

  async function submitPassword(formData: FormData) {
    if (!pwUser) return;
    setBusy(true);
    setError(null);
    const res = await resetUserPassword(pwUser.userId, String(formData.get("password") ?? ""));
    setBusy(false);
    if (res.error) {
      setError(res.error === "WEAK_PASSWORD" ? t("common.weakPassword") : t("common.error"));
      return;
    }
    setPwUser(null);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("users.title")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="users__search"
              />
              <Button onClick={() => { setError(null); setInviteOpen(true); }}>
                <UserPlus size={16} aria-hidden />
                {t("users.invite")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("users.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("common.email")}</Th>
                <Th>{t("users.employeeId")}</Th>
                <Th>{t("users.department")}</Th>
                <Th>{t("users.role")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.userId}>
                  <Td className="td--strong">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.employeeId ?? "—"}</Td>
                  <Td>{deptName(u.departmentId)}</Td>
                  <Td>
                    {u.isRoot ? <Badge tone="brand">{t("users.root")}</Badge> : roleName(u.roleId)}
                  </Td>
                  <Td>
                    {u.isBlocked ? (
                      <Badge tone="danger" title={t("users.blockedHint")}>
                        {t("users.blocked")}
                      </Badge>
                    ) : (
                      <Badge tone={u.isActive ? "success" : "danger"}>
                        {u.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="row-actions">
                      {u.isBlocked && (
                        <Button
                          variant="ghost"
                          title={t("users.unblock")}
                          onClick={() => unblockUser(u.userId)}
                        >
                          <ShieldCheck size={15} aria-hidden className="icon-success" />
                        </Button>
                      )}
                      <Button variant="ghost" title={t("common.edit")} onClick={() => { setError(null); setEditUser(u); }}>
                        <Pencil size={15} aria-hidden />
                      </Button>
                      <Button variant="ghost" title={t("users.resetPassword")} onClick={() => { setError(null); setPwUser(u); }}>
                        <KeyRound size={15} aria-hidden />
                      </Button>
                      {!u.isRoot && (
                        <Button
                          variant="ghost"
                          title={u.isActive ? t("users.deactivate") : t("users.activate")}
                          onClick={() => setUserActive(u.userId, !u.isActive)}
                        >
                          <Power
                            size={15}
                            aria-hidden
                            className={u.isActive ? "icon-danger" : "icon-success"}
                          />
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t("users.invite")}>
        {/* onSubmit (not action=) so a failed submit keeps the typed values */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitInvite(new FormData(e.currentTarget));
          }}
          className="form-stack"
        >
          <div>
            <Label htmlFor="i-name">{t("users.fullName")}</Label>
            <Input id="i-name" name="fullName" required />
          </div>
          <div>
            <Label htmlFor="i-email">{t("common.email")}</Label>
            <Input id="i-email" name="email" type="email" required />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="i-emp">{t("users.employeeId")}</Label>
              <Input id="i-emp" name="employeeId" />
            </div>
            <div>
              <Label htmlFor="i-mobile">{t("users.mobile")}</Label>
              <Input id="i-mobile" name="mobileNumber" />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="i-dept">{t("users.department")}</Label>
              <Select id="i-dept" name="departmentId" defaultValue="">
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="i-role">{t("users.role")}</Label>
              <Select id="i-role" name="roleId" defaultValue="">
                <option value="">—</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="i-pass">{t("users.password")}</Label>
            <Input id="i-pass" name="password" type="text" minLength={8} required />
            <p className="form-hint">{t("common.passwordPolicy")}</p>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={t("common.edit")}>
        {editUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitEdit(new FormData(e.currentTarget));
            }}
            className="form-stack"
          >
            <div>
              <Label htmlFor="e-name">{t("users.fullName")}</Label>
              <Input id="e-name" name="fullName" defaultValue={editUser.name} required />
            </div>
            <div className="form-grid-2">
              <div>
                <Label htmlFor="e-emp">{t("users.employeeId")}</Label>
                <Input id="e-emp" name="employeeId" defaultValue={editUser.employeeId ?? ""} />
              </div>
              <div>
                <Label htmlFor="e-mobile">{t("users.mobile")}</Label>
                <Input id="e-mobile" name="mobileNumber" defaultValue={editUser.mobileNumber ?? ""} />
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <Label htmlFor="e-dept">{t("users.department")}</Label>
                <Select id="e-dept" name="departmentId" defaultValue={editUser.departmentId ?? ""}>
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="e-role">{t("users.role")}</Label>
                <Select id="e-role" name="roleId" defaultValue={editUser.roleId ?? ""}>
                  <option value="">—</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>{t("common.save")}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Password reset modal */}
      <Modal open={!!pwUser} onClose={() => setPwUser(null)} title={t("users.resetPassword")}>
        {pwUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPassword(new FormData(e.currentTarget));
            }}
            className="form-stack"
          >
            <p className="users__modal-email">{pwUser.email}</p>
            <div>
              <Label htmlFor="p-pass">{t("users.newPassword")}</Label>
              <Input id="p-pass" name="password" type="text" minLength={8} required />
              <p className="form-hint">{t("common.passwordPolicy")}</p>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" variant="secondary" onClick={() => setPwUser(null)}>
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
