"use client";

import { useMemo, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
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
import { deleteBatch, importLeads, type LeadRow } from "./actions";

interface Lead {
  id: string;
  customerName: string | null;
  mobile: string;
  serviceName: string | null;
  serviceDate: string | null;
}

interface Batch {
  id: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  skippedRows: number;
  createdBy: string | null;
  createdAt: string;
}

/** Tiny CSV parser: handles quoted fields and commas inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export function CampaignsView({ leads, batches }: { leads: Lead[]; batches: Batch[] }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        (l.customerName ?? "").toLowerCase().includes(q) ||
        l.mobile.includes(q) ||
        (l.serviceName ?? "").toLowerCase().includes(q)
    );
  }, [leads, query]);

  async function submitImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length < 2) {
        setError(t("common.error"));
        setBusy(false);
        return;
      }
      const rows: LeadRow[] = parsed.slice(1).map((r) => ({
        name: r[0] ?? "",
        mobile: r[1] ?? "",
        service: r[2] ?? "",
        date: r[3] ?? "",
      }));
      const res = await importLeads(file.name, rows);
      if (res.error) {
        setError(t("common.error"));
      } else {
        setResult(t("camp.importDone"));
        setImportOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--lg">
      <Card>
        <CardHeader
          title={t("camp.leads")}
          actions={
            <>
              <Input
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toolbar-search"
              />
              <Button onClick={() => { setError(null); setImportOpen(true); }}>
                <Upload size={16} aria-hidden />
                {t("camp.import")}
              </Button>
            </>
          }
        />
        {result && <p className="form-hint" style={{ padding: "8px 20px" }}>{result}</p>}
        {filtered.length === 0 ? (
          <EmptyState message={t("camp.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("camp.mobile")}</Th>
                <Th>{t("camp.service")}</Th>
                <Th>{t("camp.serviceDate")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <Td className="td--strong">{l.customerName ?? "—"}</Td>
                  <Td>{l.mobile}</Td>
                  <Td>{l.serviceName ?? "—"}</Td>
                  <Td>{l.serviceDate ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-card">
        <CardHeader title={t("camp.batches")} />
        {batches.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("camp.batch")}</Th>
                <Th>{t("camp.rows")}</Th>
                <Th>{t("camp.imported")}</Th>
                <Th>{t("camp.duplicates")}</Th>
                <Th>{t("camp.skipped")}</Th>
                <Th>{t("common.createdAt")}</Th>
                <Th>{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <Td className="td--strong">{b.fileName}</Td>
                  <Td>{b.totalRows}</Td>
                  <Td>{b.importedRows}</Td>
                  <Td>{b.duplicateRows}</Td>
                  <Td>{b.skippedRows}</Td>
                  <Td>
                    {new Date(b.createdAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      title={t("common.delete")}
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) deleteBatch(b.id);
                      }}
                    >
                      <Trash2 size={15} aria-hidden className="icon-danger" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title={t("camp.import")}>
        <form onSubmit={submitImport} className="form-stack">
          <p className="form-hint">{t("camp.csvHint")}</p>
          <div>
            <Label htmlFor="camp-file">{t("camp.csvFile")}</Label>
            <Input id="camp-file" name="file" type="file" accept=".csv,text/csv" required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer">
            <Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {t("camp.import")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
