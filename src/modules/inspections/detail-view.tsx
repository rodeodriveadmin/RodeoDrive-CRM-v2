"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Save, CheckCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Label, Textarea } from "@/components/ui";
import {
  INSPECTION_SECTIONS,
  parseInspectionState,
  type InspectionItemState,
  type InspectionResult,
} from "./config";
import { completeInspection, saveInspection, startInspection } from "./actions";
import "./inspections.css";

interface OrderInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  plateNumber: string | null;
}

interface InspectionData {
  status: string;
  stateJson: string;
  generalNotes: string | null;
  completedBy: string | null;
}

const RESULTS: InspectionResult[] = ["OK", "ISSUE", "NA"];

export function InspectionDetailView({
  order,
  inspection,
}: {
  order: OrderInfo | null;
  inspection: InspectionData | null;
}) {
  const { t, lang } = useLang();
  const [state, setState] = useState<Record<string, InspectionItemState>>(
    parseInspectionState(inspection?.stateJson ?? "{}")
  );
  const [notes, setNotes] = useState(inspection?.generalNotes ?? "");
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <div className="page page--md">
        <Link href="/inspections" className="back-link">
          <ArrowLeft size={15} aria-hidden />
          {t("insp.backToList")}
        </Link>
        <Card>
          <EmptyState message={t("insp.notFound")} />
        </Card>
      </div>
    );
  }

  const totalItems = INSPECTION_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
  const checkedItems = Object.keys(state).length;
  const completed = inspection?.status === "COMPLETED";

  function setResult(key: string, result: InspectionResult) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], result } }));
  }

  function setNote(key: string, note: string) {
    setState((prev) => ({ ...prev, [key]: { result: prev[key]?.result ?? "ISSUE", note } }));
  }

  async function onStart() {
    setBusy(true);
    await startInspection(order!.id);
    setBusy(false);
  }

  async function onSave(complete: boolean) {
    setBusy(true);
    if (complete) await completeInspection(order!.id, state, notes);
    else await saveInspection(order!.id, state, notes);
    setBusy(false);
  }

  return (
    <div className="page page--md">
      <Link href="/inspections" className="back-link">
        <ArrowLeft size={15} aria-hidden />
        {t("insp.backToList")}
      </Link>

      <div className="insp__head">
        <div>
          <div className="insp__title">
            {order.orderNumber}
            {inspection && (
              <Badge tone={completed ? "success" : "warning"}>
                {t(`insp.status.${inspection.status}` as never)}
              </Badge>
            )}
          </div>
          <div className="insp__subtitle">
            {order.customerName} · {order.vehicleMake} {order.vehicleModel}
            {order.plateNumber ? ` · ${order.plateNumber}` : ""}
            {inspection && ` · ${checkedItems}/${totalItems} ${t("insp.progress")}`}
          </div>
        </div>
        <div className="insp__actions">
          {!inspection && (
            <Button onClick={onStart} disabled={busy}>
              <Play size={15} aria-hidden />
              {t("insp.start")}
            </Button>
          )}
          {inspection && !completed && (
            <>
              <Button variant="secondary" onClick={() => onSave(false)} disabled={busy}>
                <Save size={15} aria-hidden />
                {t("insp.save")}
              </Button>
              <Button onClick={() => onSave(true)} disabled={busy}>
                <CheckCheck size={15} aria-hidden />
                {t("insp.complete")}
              </Button>
            </>
          )}
        </div>
      </div>

      {inspection &&
        INSPECTION_SECTIONS.map((section) => (
          <Card key={section.id} className="insp__section">
            <CardHeader title={lang === "ar" ? section.ar : section.en} />
            {section.items.map((item) => {
              const key = `${section.id}.${item.id}`;
              const current = state[key];
              return (
                <div key={key} className="insp__item">
                  <span className="insp__item-label">{lang === "ar" ? item.ar : item.en}</span>
                  <div className="insp__choices">
                    {RESULTS.map((r) => {
                      const active = current?.result === r;
                      const cls = active
                        ? r === "OK"
                          ? "insp__choice is-ok"
                          : r === "ISSUE"
                            ? "insp__choice is-issue"
                            : "insp__choice is-na"
                        : "insp__choice";
                      return (
                        <button
                          key={r}
                          type="button"
                          className={cls}
                          disabled={completed}
                          onClick={() => setResult(key, r)}
                        >
                          {t(`insp.result.${r}` as never)}
                        </button>
                      );
                    })}
                  </div>
                  {current?.result === "ISSUE" && (
                    <div className="insp__note">
                      <Input
                        placeholder={t("insp.itemNote")}
                        value={current.note ?? ""}
                        disabled={completed}
                        onChange={(e) => setNote(key, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        ))}

      {inspection && (
        <Card>
          <div className="insp__footer">
            <div>
              <Label htmlFor="insp-notes">{t("insp.generalNotes")}</Label>
              <Textarea
                id="insp-notes"
                value={notes}
                disabled={completed}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {completed && inspection.completedBy && (
              <p className="form-hint">
                {t("insp.completedBy")}: {inspection.completedBy}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
