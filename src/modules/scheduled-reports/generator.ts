import "server-only";
import { and, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ReportType } from "./constants";

// Renders report content as email-safe HTML (inline styles, plain tables).

const S = {
  body: 'font-family:Arial,Helvetica,sans-serif;color:#14161d;font-size:14px',
  h1: 'font-size:18px;margin:0 0 4px',
  sub: 'color:#5f6b88;font-size:12px;margin:0 0 16px',
  table: 'border-collapse:collapse;width:100%;margin:8px 0 16px',
  th: 'text-align:left;padding:6px 10px;background:#f6f7f9;font-size:11px;text-transform:uppercase;color:#5f6b88;border-bottom:1px solid #d3d7e0',
  td: 'padding:6px 10px;border-bottom:1px solid #ebedf1',
  kpi: 'display:inline-block;margin:0 16px 8px 0',
  kpiV: 'font-size:20px;font-weight:bold',
  kpiL: 'font-size:11px;color:#5f6b88',
} as const;

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (n: number) => n.toLocaleString("en", { maximumFractionDigits: 2 });

function wrap(title: string, subtitle: string, inner: string): string {
  return `<div style="${S.body}"><h1 style="${S.h1}">${esc(title)}</h1><p style="${S.sub}">${esc(subtitle)}</p>${inner}<p style="${S.sub}">Rodeo Drive CRM</p></div>`;
}

function table(headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th style="${S.th}">${esc(h)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td style="${S.td}">${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table style="${S.table}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function kpis(items: Array<{ label: string; value: string }>): string {
  return `<div>${items
    .map(
      (k) =>
        `<span style="${S.kpi}"><span style="${S.kpiV}">${esc(k.value)}</span><br/><span style="${S.kpiL}">${esc(k.label)}</span></span>`
    )
    .join("")}</div>`;
}

async function dailySummary(): Promise<{ subject: string; html: string }> {
  // report covers the previous full day (typical morning email)
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  const dayLabel = start.toISOString().slice(0, 10);

  const [orders, payments, newCustomers] = await Promise.all([
    db
      .select({
        orderNumber: schema.jobOrders.orderNumber,
        customerName: schema.jobOrders.customerName,
        status: schema.jobOrders.status,
        totalAmount: schema.jobOrders.totalAmount,
      })
      .from(schema.jobOrders)
      .where(and(gte(schema.jobOrders.createdAt, start), lt(schema.jobOrders.createdAt, end))),
    db
      .select({
        amount: schema.jobOrderPayments.amount,
        method: schema.jobOrderPayments.method,
        orderNumber: schema.jobOrders.orderNumber,
      })
      .from(schema.jobOrderPayments)
      .innerJoin(schema.jobOrders, eq(schema.jobOrders.id, schema.jobOrderPayments.jobOrderId))
      .where(and(gte(schema.jobOrderPayments.paidAt, start), lt(schema.jobOrderPayments.paidAt, end))),
    db
      .select({ c: sql<number>`count(*)` })
      .from(schema.customers)
      .where(and(gte(schema.customers.createdAt, start), lt(schema.customers.createdAt, end))),
  ]);

  const collected = payments.reduce((acc, p) => acc + p.amount, 0);

  const inner =
    kpis([
      { label: "Orders created", value: String(orders.length) },
      { label: "Collected", value: fmt(collected) },
      { label: "Payments", value: String(payments.length) },
      { label: "New customers", value: String(Number(newCustomers[0]?.c ?? 0)) },
    ]) +
    (payments.length
      ? table(
          ["Order", "Method", "Amount"],
          payments.map((p) => [p.orderNumber, p.method, fmt(p.amount)])
        )
      : "") +
    (orders.length
      ? table(
          ["Order", "Customer", "Status", "Total"],
          orders.map((o) => [o.orderNumber, o.customerName, o.status, fmt(o.totalAmount)])
        )
      : "");

  return {
    subject: `Daily summary — ${dayLabel}`,
    html: wrap("Daily summary", dayLabel, inner),
  };
}

async function openOrders(): Promise<{ subject: string; html: string }> {
  const rows = await db
    .select({
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      status: schema.jobOrders.status,
      priority: schema.jobOrders.priority,
      balanceDue: schema.jobOrders.balanceDue,
    })
    .from(schema.jobOrders)
    .where(inArray(schema.jobOrders.status, ["OPEN", "IN_PROGRESS", "READY"]))
    .orderBy(desc(schema.jobOrders.createdAt));

  return {
    subject: `Open orders — ${rows.length} in the shop`,
    html: wrap(
      "Open orders",
      `${rows.length} orders currently in the shop`,
      rows.length
        ? table(
            ["Order", "Customer", "Status", "Priority", "Balance"],
            rows.map((o) => [o.orderNumber, o.customerName, o.status, o.priority, fmt(o.balanceDue)])
          )
        : "<p>No open orders 🎉</p>"
    ),
  };
}

async function outstandingBalances(): Promise<{ subject: string; html: string }> {
  const rows = await db
    .select({
      orderNumber: schema.jobOrders.orderNumber,
      customerName: schema.jobOrders.customerName,
      customerPhone: schema.jobOrders.customerPhone,
      balanceDue: schema.jobOrders.balanceDue,
    })
    .from(schema.jobOrders)
    .where(sql`${schema.jobOrders.balanceDue} > 0`)
    .orderBy(desc(schema.jobOrders.balanceDue));

  const total = rows.reduce((acc, r) => acc + r.balanceDue, 0);
  return {
    subject: `Outstanding balances — ${fmt(total)}`,
    html: wrap(
      "Outstanding balances",
      `Total outstanding: ${fmt(total)}`,
      rows.length
        ? table(
            ["Order", "Customer", "Phone", "Balance"],
            rows.map((r) => [r.orderNumber, r.customerName, r.customerPhone ?? "—", fmt(r.balanceDue)])
          )
        : "<p>Everything is collected 🎉</p>"
    ),
  };
}

async function lowStock(): Promise<{ subject: string; html: string }> {
  const rows = await db
    .select({
      name: schema.inventoryProducts.name,
      quantity: schema.inventoryProducts.quantity,
      minQuantity: schema.inventoryProducts.minQuantity,
    })
    .from(schema.inventoryProducts)
    .where(
      and(
        eq(schema.inventoryProducts.isActive, true),
        lte(schema.inventoryProducts.quantity, schema.inventoryProducts.minQuantity)
      )
    )
    .orderBy(schema.inventoryProducts.quantity);

  return {
    subject: `Low stock — ${rows.length} products`,
    html: wrap(
      "Low stock",
      `${rows.length} products at or below their threshold`,
      rows.length
        ? table(
            ["Product", "Stock", "Threshold"],
            rows.map((r) => [r.name, String(r.quantity), String(r.minQuantity)])
          )
        : "<p>All stock levels are healthy 🎉</p>"
    ),
  };
}

export async function generateReport(type: ReportType): Promise<{ subject: string; html: string }> {
  switch (type) {
    case "OPEN_ORDERS":
      return openOrders();
    case "OUTSTANDING_BALANCES":
      return outstandingBalances();
    case "LOW_STOCK":
      return lowStock();
    case "DAILY_SUMMARY":
    default:
      return dailySummary();
  }
}
