"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { createTicket } from "./actions";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "./constants";

interface Row {
  id: string;
  title: string;
  customerName: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  updatedAt: string;
}

export const TICKET_STATUS_TONE: Record<string, "brand" | "warning" | "success" | "neutral"> = {
  OPEN: "brand",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const TICKET_PRIORITY_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

export function TicketsView({
  tickets,
  customers,
}: {
  tickets: Row[];
  customers: Array<{ id: string; name: string }>;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (statusFilter && tk.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tk.title.toLowerCase().includes(q) ||
        (tk.customerName ?? "").toLowerCase().includes(q) ||
        (tk.assignedTo ?? "").toLowerCase().includes(q)
      );
    });
  }, [tickets, query, statusFilter]);

  async function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await createTicket({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      customerId: String(formData.get("customerId") ?? "") || undefined,
      priority: String(formData.get("priority") ?? "MEDIUM"),
      assignedTo: String(formData.get("assignedTo") ?? ""),
    });
    setBusy(false);
    if (res.error || !res.id) {
      setError(t("common.error"));
      return;
    }
    setCreateOpen(false);
    router.push(`/tickets/${res.id}`);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("tickets.title")}
          actions={
            <>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="toolbar-search"
              >
                <option value="">{t("jobs.allStatuses")}</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`tickets.status.${s}` as DictKey)}
                  </option>
                ))}
              </Select>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setError(null); setCreateOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("tickets.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("tickets.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("tickets.subject")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("jobs.priority")}</Th>
                <Th>{t("tickets.assignedTo")}</Th>
                <Th>{t("common.createdAt")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tk) => (
                <tr key={tk.id}>
                  <Td>
                    <Link href={`/tickets/${tk.id}`} className="row-link">
                      {tk.title}
                    </Link>
                  </Td>
                  <Td>{tk.customerName ?? "—"}</Td>
                  <Td>
                    <Badge tone={TICKET_STATUS_TONE[tk.status] ?? "neutral"}>
                      {t(`tickets.status.${tk.status}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={TICKET_PRIORITY_TONE[tk.priority] ?? "neutral"}>
                      {t(`tickets.priority.${tk.priority}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{tk.assignedTo ?? "—"}</Td>
                  <Td>
                    {new Date(tk.updatedAt).toLocaleDateString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("tickets.add")}>
        <form onSubmit={submitCreate} className="form-stack">
          <div>
            <Label htmlFor="tk-title">{t("tickets.subject")}</Label>
            <Input id="tk-title" name="title" required autoFocus />
          </div>
          <div>
            <Label htmlFor="tk-desc">{t("tickets.descriptionField")}</Label>
            <Textarea id="tk-desc" name="description" />
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="tk-customer">{t("tickets.linkedCustomer")}</Label>
              <Select id="tk-customer" name="customerId" defaultValue="">
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tk-priority">{t("jobs.priority")}</Label>
              <Select id="tk-priority" name="priority" defaultValue="MEDIUM">
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`tickets.priority.${p}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="tk-assigned">{t("tickets.assignedTo")}</Label>
            <Input id="tk-assigned" name="assignedTo" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
