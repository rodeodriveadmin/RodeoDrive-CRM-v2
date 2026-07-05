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
  Th,
} from "@/components/ui";
import { createJobOrder } from "./actions";
import { JOB_PRIORITIES, JOB_STATUSES } from "./constants";
import "./job-orders.css";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  priority: string;
  customerName: string;
  customerPhone: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
  totalAmount: number;
  balanceDue: number;
  createdAt: string;
}

interface CustomerOption {
  id: string;
  name: string;
}
interface VehicleOption {
  id: string;
  customerId: string;
  make: string;
  model: string;
  plateNumber: string;
}

export const STATUS_TONE: Record<string, "neutral" | "brand" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "brand",
  IN_PROGRESS: "warning",
  READY: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const PAY_TONE: Record<string, "danger" | "warning" | "success"> = {
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
};

export function JobOrdersView({
  orders,
  customers,
  vehicles,
}: {
  orders: OrderRow[];
  customers: CustomerOption[];
  vehicles: VehicleOption[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone ?? "").includes(q) ||
        (o.plateNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const customerVehicles = vehicles.filter((v) => v.customerId === customerId);

  async function submitCreate(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await createJobOrder({
      customerId: String(formData.get("customerId") ?? ""),
      vehicleId: String(formData.get("vehicleId") ?? ""),
      priority: String(formData.get("priority") ?? "NORMAL"),
      expectedDeliveryDate: String(formData.get("expectedDeliveryDate") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    setBusy(false);
    if (res.error || !res.id) {
      setError(t("common.error"));
      return;
    }
    setCreateOpen(false);
    router.push(`/job-orders/${res.id}`);
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("jobs.title")}
          actions={
            <>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="jobs__filter"
              >
                <option value="">{t("jobs.allStatuses")}</option>
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`jobs.status.${s}` as DictKey)}
                  </option>
                ))}
              </Select>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setError(null); setCustomerId(""); setCreateOpen(true); }}>
                <Plus size={16} aria-hidden />
                {t("jobs.add")}
              </Button>
            </>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState message={t("jobs.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("jobs.orderNumber")}</Th>
                <Th>{t("jobs.customer")}</Th>
                <Th>{t("jobs.vehicle")}</Th>
                <Th>{t("jobs.status")}</Th>
                <Th>{t("jobs.paymentStatus")}</Th>
                <Th>{t("jobs.total")}</Th>
                <Th>{t("jobs.balance")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <Link href={`/job-orders/${o.id}`} className="jobs__order-link">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{o.customerName}</Td>
                  <Td>
                    {o.vehicleMake} {o.vehicleModel}
                    {o.plateNumber ? ` · ${o.plateNumber}` : ""}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>
                      {t(`jobs.status.${o.status}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={PAY_TONE[o.paymentStatus] ?? "danger"}>
                      {t(`jobs.pay.${o.paymentStatus}` as DictKey)}
                    </Badge>
                  </Td>
                  <Td>{o.totalAmount.toLocaleString()}</Td>
                  <Td className={o.balanceDue > 0 ? "td--strong" : undefined}>
                    {o.balanceDue.toLocaleString()}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("jobs.add")}>
        <form action={submitCreate} className="form-stack">
          <div>
            <Label htmlFor="jo-customer">{t("jobs.customer")}</Label>
            <Select
              id="jo-customer"
              name="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
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
          <div>
            <Label htmlFor="jo-vehicle">{t("jobs.vehicle")}</Label>
            {!customerId ? (
              <p className="form-hint">{t("jobs.selectCustomerFirst")}</p>
            ) : customerVehicles.length === 0 ? (
              <p className="form-error">{t("jobs.customerHasNoVehicles")}</p>
            ) : (
              <Select id="jo-vehicle" name="vehicleId" defaultValue="" required>
                <option value="" disabled>
                  —
                </option>
                {customerVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {v.plateNumber}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="jo-priority">{t("jobs.priority")}</Label>
              <Select id="jo-priority" name="priority" defaultValue="NORMAL">
                {JOB_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`jobs.priority.${p}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="jo-delivery">{t("jobs.expectedDelivery")}</Label>
              <Input id="jo-delivery" name="expectedDeliveryDate" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="jo-notes">{t("jobs.customerNotes")}</Label>
            <Input id="jo-notes" name="notes" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy || customerVehicles.length === 0}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
