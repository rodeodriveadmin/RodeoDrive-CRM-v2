"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, Printer } from "lucide-react";
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
import type { VehicleType } from "@/lib/vehicle-types";
import {
  addPayment,
  addServiceItem,
  deletePayment,
  removeServiceItem,
  setBilling,
  setJobOrderStatus,
  updateJobOrderDetails,
  updatePayment,
  updateServiceItem,
} from "./actions";
import { JOB_PRIORITIES, JOB_STATUSES, PAYMENT_METHODS } from "./constants";
import { PAY_TONE, STATUS_TONE } from "./view";
import "./job-orders.css";

/* ---------- shapes ---------- */

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  priority: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  vehicleType: string;
  vehicleColor: string | null;
  plateNumber: string | null;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  assignedTechnician: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface Item {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  isCompleted: boolean;
  technician: string | null;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  receiptNumber: string | null;
  paidAt: string;
  notes: string | null;
  createdBy: string | null;
}

interface Step {
  id: string;
  step: string;
  detail: string | null;
  actorEmail: string | null;
  createdAt: string;
}

interface CatalogService {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  priceSedan: number | null;
  priceSuv: number | null;
  priceHatchback: number | null;
  priceTruck: number | null;
  priceCoupe: number | null;
  priceMotorbike: number | null;
  priceOther: number | null;
}

interface Permissions {
  canEditOrder: boolean;
  canCreatePayment: boolean;
  canUpdatePayment: boolean;
  canDeletePayment: boolean;
}

const PRICE_BY_TYPE: Record<VehicleType, keyof CatalogService> = {
  SEDAN: "priceSedan",
  SUV: "priceSuv",
  HATCHBACK: "priceHatchback",
  TRUCK: "priceTruck",
  COUPE: "priceCoupe",
  MOTORBIKE: "priceMotorbike",
  OTHER: "priceOther",
};

export function JobOrderDetailView({
  order,
  items,
  payments,
  steps,
  catalog,
  permissions,
}: {
  order: Order | null;
  items: Item[];
  payments: Payment[];
  steps: Step[];
  catalog: CatalogService[];
  permissions: Permissions;
}) {
  const { t, lang } = useLang();

  /* add-service state */
  const [svcSelect, setSvcSelect] = useState("");
  const [svcQty, setSvcQty] = useState("1");
  const [svcPrice, setSvcPrice] = useState("");
  /* payment modal state */
  const [payOpen, setPayOpen] = useState(false);
  const [editPay, setEditPay] = useState<Payment | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* details modal */
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!order) {
    return (
      <div className="page page--md">
        <Link href="/job-orders" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("jobs.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("jobs.notFound")} />
        </Card>
      </div>
    );
  }

  const svcName = (s: CatalogService) => (lang === "ar" && s.nameAr ? s.nameAr : s.nameEn);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" });

  function priceFor(serviceId: string): number | null {
    const svc = catalog.find((s) => s.id === serviceId);
    if (!svc) return null;
    const key = PRICE_BY_TYPE[(order!.vehicleType as VehicleType) ?? "OTHER"] ?? "priceOther";
    const direct = svc[key];
    if (typeof direct === "number") return direct;
    return typeof svc.priceOther === "number" ? svc.priceOther : null;
  }

  function onSelectService(id: string) {
    setSvcSelect(id);
    const p = priceFor(id);
    setSvcPrice(p !== null ? String(p) : "");
  }

  async function onAddService() {
    const svc = catalog.find((s) => s.id === svcSelect);
    if (!svc) return;
    await addServiceItem(order!.id, {
      serviceId: svc.id,
      name: svcName(svc),
      qty: Number(svcQty) || 1,
      unitPrice: Number(svcPrice) || 0,
    });
    setSvcSelect("");
    setSvcQty("1");
    setSvcPrice("");
  }

  // onSubmit (not form action=) so a rejected submit — e.g. the PCI card-data
  // guard — keeps the user's input instead of resetting the form.
  async function submitPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy(true);
    setPayError(null);
    const input = {
      amount: Number(formData.get("amount") ?? 0),
      method: String(formData.get("method") ?? "CASH"),
      reference: String(formData.get("reference") ?? ""),
      receiptNumber: String(formData.get("receiptNumber") ?? ""),
      paidAt: String(formData.get("paidAt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    const res = editPay ? await updatePayment(editPay.id, input) : await addPayment(order!.id, input);
    setBusy(false);
    if (res.error) {
      setPayError(res.error === "CARD_DATA" ? t("jobs.cardDataBlocked") : t("common.error"));
      return;
    }
    setPayOpen(false);
    setEditPay(null);
  }

  async function submitDetails(formData: FormData) {
    setBusy(true);
    await updateJobOrderDetails(order!.id, {
      priority: String(formData.get("priority") ?? "NORMAL"),
      assignedTechnician: String(formData.get("assignedTechnician") ?? ""),
      expectedDeliveryDate: String(formData.get("expectedDeliveryDate") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      internalNotes: String(formData.get("internalNotes") ?? ""),
    });
    setBusy(false);
    setDetailsOpen(false);
  }

  async function submitBilling(formData: FormData) {
    await setBilling(order!.id, {
      discountAmount: Number(formData.get("discountAmount") ?? 0),
      vatRate: Number(formData.get("vatRate") ?? 0),
    });
  }

  const canEdit = permissions.canEditOrder;

  return (
    <div className="page page--lg">
      <Link href="/job-orders" className="back-link">
        <ArrowLeft size={15} aria-hidden />
        {t("jobs.backToList")}
      </Link>

      {/* header */}
      <div className="job-detail__head">
        <div className="job-detail__title">
          {order.orderNumber}
          <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
            {t(`jobs.status.${order.status}` as DictKey)}
          </Badge>
          <Badge tone={PAY_TONE[order.paymentStatus] ?? "danger"}>
            {t(`jobs.pay.${order.paymentStatus}` as DictKey)}
          </Badge>
          {order.priority !== "NORMAL" && (
            <Badge tone={order.priority === "URGENT" ? "danger" : "warning"}>
              {t(`jobs.priority.${order.priority}` as DictKey)}
            </Badge>
          )}
        </div>
        <div className="job-detail__head-actions">
          <Link href={`/job-orders/${order.id}/invoice`}>
            <Button variant="secondary">
              <Printer size={15} aria-hidden />
              {t("jobs.invoice")}
            </Button>
          </Link>
          {canEdit && (
            <>
              <Select
                value={order.status}
                onChange={(e) => setJobOrderStatus(order.id, e.target.value)}
                className="jobs__filter"
                aria-label={t("jobs.status")}
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`jobs.status.${s}` as DictKey)}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={() => setDetailsOpen(true)}>
                <Pencil size={15} aria-hidden />
                {t("common.edit")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="job-detail__grid">
        {/* ===== main column ===== */}
        <div className="job-detail__col">
          {/* services */}
          <Card>
            <CardHeader title={t("jobs.services")} />
            {items.length === 0 ? (
              <EmptyState message={t("jobs.servicesNone")} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("jobs.service")}</Th>
                    <Th>{t("jobs.qty")}</Th>
                    <Th>{t("jobs.unitPrice")}</Th>
                    <Th>{t("jobs.lineTotal")}</Th>
                    <Th>{t("jobs.completed")}</Th>
                    {canEdit && <Th />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <Td className="td--strong td--wrap">{it.name}</Td>
                      <Td>
                        {canEdit ? (
                          <input
                            className="input jobs__cell-input"
                            defaultValue={it.qty}
                            inputMode="numeric"
                            aria-label={t("jobs.qty")}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 1;
                              if (v !== it.qty)
                                updateServiceItem(it.id, {
                                  qty: v,
                                  unitPrice: it.unitPrice,
                                  isCompleted: it.isCompleted,
                                  technician: it.technician ?? undefined,
                                });
                            }}
                          />
                        ) : (
                          it.qty
                        )}
                      </Td>
                      <Td>
                        {canEdit ? (
                          <input
                            className="input jobs__cell-input"
                            defaultValue={it.unitPrice}
                            inputMode="decimal"
                            aria-label={t("jobs.unitPrice")}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== it.unitPrice)
                                updateServiceItem(it.id, {
                                  qty: it.qty,
                                  unitPrice: v,
                                  isCompleted: it.isCompleted,
                                  technician: it.technician ?? undefined,
                                });
                            }}
                          />
                        ) : (
                          fmt(it.unitPrice)
                        )}
                      </Td>
                      <Td className="td--strong">{fmt(it.lineTotal)}</Td>
                      <Td className="td--center">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={it.isCompleted}
                          disabled={!canEdit}
                          aria-label={t("jobs.completed")}
                          onChange={(e) =>
                            updateServiceItem(it.id, {
                              qty: it.qty,
                              unitPrice: it.unitPrice,
                              isCompleted: e.target.checked,
                              technician: it.technician ?? undefined,
                            })
                          }
                        />
                      </Td>
                      {canEdit && (
                        <Td>
                          <Button
                            variant="ghost"
                            title={t("common.delete")}
                            onClick={() => {
                              if (confirm(t("common.confirmDelete"))) removeServiceItem(it.id);
                            }}
                          >
                            <Trash2 size={15} aria-hidden className="icon-danger" />
                          </Button>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {canEdit && (
              <div className="jobs__add-row">
                <Select
                  value={svcSelect}
                  onChange={(e) => onSelectService(e.target.value)}
                  aria-label={t("jobs.addService")}
                >
                  <option value="">{t("jobs.addService")}…</option>
                  {catalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {svcName(s)} ({s.code})
                    </option>
                  ))}
                </Select>
                <Input
                  value={svcQty}
                  onChange={(e) => setSvcQty(e.target.value)}
                  inputMode="numeric"
                  aria-label={t("jobs.qty")}
                  placeholder={t("jobs.qty")}
                />
                <Input
                  value={svcPrice}
                  onChange={(e) => setSvcPrice(e.target.value)}
                  inputMode="decimal"
                  aria-label={t("jobs.customPrice")}
                  placeholder={t("jobs.customPrice")}
                />
                <Button onClick={onAddService} disabled={!svcSelect}>
                  <Plus size={16} aria-hidden />
                </Button>
              </div>
            )}
          </Card>

          {/* payments */}
          <Card>
            <CardHeader
              title={t("jobs.payments")}
              actions={
                permissions.canCreatePayment && (
                  <Button onClick={() => { setEditPay(null); setPayError(null); setPayOpen(true); }}>
                    <Plus size={16} aria-hidden />
                    {t("jobs.addPayment")}
                  </Button>
                )
              }
            />
            {payments.length === 0 ? (
              <EmptyState message={t("jobs.paymentsNone")} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("jobs.amount")}</Th>
                    <Th>{t("jobs.method")}</Th>
                    <Th>{t("jobs.reference")}</Th>
                    <Th>{t("jobs.paidAt")}</Th>
                    <Th>{t("jobs.createdBy")}</Th>
                    <Th>{t("common.actions")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <Td className="td--strong">{fmt(p.amount)}</Td>
                      <Td>
                        <Badge tone="neutral">{t(`jobs.method.${p.method}` as DictKey)}</Badge>
                      </Td>
                      <Td>{p.reference ?? "—"}</Td>
                      <Td>{dateFmt(p.paidAt)}</Td>
                      <Td>{p.createdBy ?? "—"}</Td>
                      <Td>
                        <div className="row-actions">
                          {permissions.canUpdatePayment && (
                            <Button
                              variant="ghost"
                              title={t("common.edit")}
                              onClick={() => { setEditPay(p); setPayError(null); setPayOpen(true); }}
                            >
                              <Pencil size={15} aria-hidden />
                            </Button>
                          )}
                          {permissions.canDeletePayment && (
                            <Button
                              variant="ghost"
                              title={t("common.delete")}
                              onClick={() => {
                                if (confirm(t("common.confirmDelete"))) deletePayment(p.id);
                              }}
                            >
                              <Trash2 size={15} aria-hidden className="icon-danger" />
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

          {/* timeline */}
          <Card>
            <CardHeader title={t("jobs.timeline")} />
            <div className="timeline">
              {steps.map((s) => (
                <div key={s.id} className="timeline__item">
                  <div className="timeline__label">
                    {t(`jobs.step.${s.step}` as DictKey)}
                  </div>
                  {s.detail && <div className="timeline__detail">{s.detail}</div>}
                  <div className="timeline__meta">
                    {s.actorEmail} · {dateFmt(s.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ===== side column ===== */}
        <div className="job-detail__col">
          {/* customer & vehicle */}
          <Card>
            <CardHeader title={t("jobs.customer")} />
            <div className="job-detail__info-rows">
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("common.name")}</span>
                {order.customerId ? (
                  <Link href={`/customers/${order.customerId}`} className="jobs__order-link">
                    {order.customerName}
                  </Link>
                ) : (
                  <span>{order.customerName}</span>
                )}
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("common.phone")}</span>
                <span>{order.customerPhone ?? "—"}</span>
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("jobs.vehicle")}</span>
                <span>
                  {order.vehicleMake} {order.vehicleModel} {order.vehicleYear ?? ""}
                </span>
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("vehicles.plate")}</span>
                <span>{order.plateNumber ?? "—"}</span>
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("vehicles.type")}</span>
                <span>{t(`vehicles.type.${order.vehicleType}` as DictKey)}</span>
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("jobs.technician")}</span>
                <span>{order.assignedTechnician ?? "—"}</span>
              </div>
              <div className="job-detail__info-row">
                <span className="job-detail__info-label">{t("jobs.expectedDelivery")}</span>
                <span>{order.expectedDeliveryDate ?? "—"}</span>
              </div>
              {order.notes && (
                <div className="job-detail__info-row">
                  <span className="job-detail__info-label">{t("jobs.customerNotes")}</span>
                  <span>{order.notes}</span>
                </div>
              )}
              {order.internalNotes && (
                <div className="job-detail__info-row">
                  <span className="job-detail__info-label">{t("jobs.internalNotes")}</span>
                  <span>{order.internalNotes}</span>
                </div>
              )}
            </div>
          </Card>

          {/* billing */}
          <Card>
            <CardHeader title={t("jobs.billing")} />
            <div className="billing__rows">
              <div className="billing__row">
                <span>{t("jobs.subtotal")}</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              <div className="billing__row">
                <span>{t("jobs.discount")}</span>
                <span>-{fmt(order.discountAmount)}</span>
              </div>
              <div className="billing__row">
                <span>
                  {t("jobs.vat")} ({fmt(order.vatRate)}%)
                </span>
                <span>{fmt(order.vatAmount)}</span>
              </div>
              <div className="billing__row billing__row--total">
                <span>{t("jobs.grandTotal")}</span>
                <span>{fmt(order.totalAmount)}</span>
              </div>
              <div className="billing__row">
                <span>{t("jobs.paid")}</span>
                <span>{fmt(order.amountPaid)}</span>
              </div>
              <div className={`billing__row billing__row--due${order.balanceDue <= 0 ? " is-settled" : ""}`}>
                <span>{t("jobs.due")}</span>
                <span>{fmt(order.balanceDue)}</span>
              </div>
            </div>
            {canEdit && (
              <form action={submitBilling} className="billing__inputs">
                <div>
                  <Label htmlFor="b-discount">{t("jobs.discount")}</Label>
                  <Input
                    id="b-discount"
                    name="discountAmount"
                    inputMode="decimal"
                    defaultValue={order.discountAmount || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="b-vat">{t("jobs.vatRate")}</Label>
                  <Input id="b-vat" name="vatRate" inputMode="decimal" defaultValue={order.vatRate} />
                </div>
                <div style={{ alignSelf: "end", flex: "0 0 auto" }}>
                  <Button type="submit" variant="secondary">
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* payment modal */}
      <Modal
        open={payOpen}
        onClose={() => { setPayOpen(false); setEditPay(null); }}
        title={editPay ? t("common.edit") : t("jobs.addPayment")}
      >
        <form onSubmit={submitPayment} className="form-stack" key={editPay?.id ?? "new"}>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="p-amount">{t("jobs.amount")}</Label>
              <Input
                id="p-amount"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={editPay?.amount ?? (order.balanceDue || "")}
              />
            </div>
            <div>
              <Label htmlFor="p-method">{t("jobs.method")}</Label>
              <Select id="p-method" name="method" defaultValue={editPay?.method ?? "CASH"}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`jobs.method.${m}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <Label htmlFor="p-ref">{t("jobs.reference")}</Label>
              <Input id="p-ref" name="reference" defaultValue={editPay?.reference ?? ""} />
            </div>
            <div>
              <Label htmlFor="p-receipt">{t("jobs.receiptNumber")}</Label>
              <Input id="p-receipt" name="receiptNumber" defaultValue={editPay?.receiptNumber ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="p-paidat">{t("jobs.paidAt")}</Label>
            <Input
              id="p-paidat"
              name="paidAt"
              type="datetime-local"
              defaultValue={(editPay?.paidAt ?? new Date().toISOString()).slice(0, 16)}
            />
          </div>
          <div>
            <Label htmlFor="p-notes">{t("customers.notes")}</Label>
            <Input id="p-notes" name="notes" defaultValue={editPay?.notes ?? ""} />
          </div>
          <p className="form-hint">{t("jobs.cardDataBlocked")}</p>
          {payError && <p className="form-error">{payError}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => { setPayOpen(false); setEditPay(null); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>

      {/* details modal */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title={t("common.edit")}>
        <form action={submitDetails} className="form-stack">
          <div className="form-grid-2">
            <div>
              <Label htmlFor="d-priority">{t("jobs.priority")}</Label>
              <Select id="d-priority" name="priority" defaultValue={order.priority}>
                {JOB_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`jobs.priority.${p}` as DictKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="d-delivery">{t("jobs.expectedDelivery")}</Label>
              <Input
                id="d-delivery"
                name="expectedDeliveryDate"
                type="date"
                defaultValue={order.expectedDeliveryDate ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="d-tech">{t("jobs.technician")}</Label>
            <Input id="d-tech" name="assignedTechnician" defaultValue={order.assignedTechnician ?? ""} />
          </div>
          <div>
            <Label htmlFor="d-notes">{t("jobs.customerNotes")}</Label>
            <Input id="d-notes" name="notes" defaultValue={order.notes ?? ""} />
          </div>
          <div>
            <Label htmlFor="d-internal">{t("jobs.internalNotes")}</Label>
            <Input id="d-internal" name="internalNotes" defaultValue={order.internalNotes ?? ""} />
          </div>
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setDetailsOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
