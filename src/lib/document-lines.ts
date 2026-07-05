// Shared line-item math for numbered documents (quotations, vouchers).
// Totals are always recomputed server-side from the lines.

export interface DocLine {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

function money(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

export function normalizeLines(raw: Array<{ name: string; qty: unknown; unitPrice: unknown }>): DocLine[] {
  return raw
    .map((l) => {
      const qty = Math.max(1, Math.floor(Number(l.qty) || 1));
      const unitPrice = money(l.unitPrice);
      return { name: String(l.name ?? "").trim(), qty, unitPrice, total: money(qty * unitPrice) };
    })
    .filter((l) => l.name.length > 0);
}

export function computeDocTotals(lines: DocLine[], discountAmount: unknown, vatRate: unknown) {
  const subtotal = money(lines.reduce((acc, l) => acc + l.total, 0));
  const discount = Math.min(money(discountAmount), subtotal);
  const rate = Math.min(Math.max(Number(vatRate) || 0, 0), 100);
  const vatAmount = money(((subtotal - discount) * rate) / 100);
  const netAmount = money(subtotal - discount + vatAmount);
  return { subtotal, discountAmount: discount, vatRate: rate, vatAmount, netAmount };
}

export function parseLines(json: string): DocLine[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
