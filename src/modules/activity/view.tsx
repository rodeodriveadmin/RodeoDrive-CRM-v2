"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { Badge, Card, CardHeader, EmptyState, Table, Td, Th } from "@/components/ui";

interface Log {
  id: string;
  entityType: string;
  action: string;
  message: string;
  actorEmail: string | null;
  createdAt: string;
}

const TONE: Record<string, "success" | "danger" | "brand" | "neutral"> = {
  create: "success",
  delete: "danger",
  update: "brand",
  activate: "success",
  deactivate: "danger",
};

export function ActivityView({ logs }: { logs: Log[] }) {
  const { t, lang } = useLang();

  return (
    <div className="page page--md">
      <Card>
        <CardHeader title={t("nav.activityLog")} />
        {logs.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.actions")}</Th>
                <Th>{t("common.name")}</Th>
                <Th>{t("common.email")}</Th>
                <Th>{t("common.createdAt")}</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <Td>
                    <Badge tone={TONE[log.action] ?? "neutral"}>
                      {log.entityType}·{log.action}
                    </Badge>
                  </Td>
                  <Td className="td--wrap">{log.message}</Td>
                  <Td>{log.actorEmail ?? "—"}</Td>
                  <Td>
                    {new Date(log.createdAt).toLocaleString(lang === "ar" ? "ar" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
