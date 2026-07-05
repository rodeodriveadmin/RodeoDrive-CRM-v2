"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { Badge, Card, CardHeader, EmptyState, Table, Td, Th } from "@/components/ui";

interface Tech {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  isActive: boolean;
}

export function TechniciansView({
  technicians,
  stats,
}: {
  technicians: Tech[];
  stats: Record<string, { completed: number; running: number; minutes: number }>;
}) {
  const { t } = useLang();

  return (
    <div className="page page--md">
      <Card>
        <CardHeader title={t("tech.title")} />
        {technicians.length === 0 ? (
          <EmptyState message={t("tech.none")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("emp.position")}</Th>
                <Th>{t("common.phone")}</Th>
                <Th>{t("tech.completedItems")}</Th>
                <Th>{t("tech.runningItems")}</Th>
                <Th>{t("tech.totalMinutes")}</Th>
                <Th>{t("common.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => {
                const s = stats[tech.name] ?? { completed: 0, running: 0, minutes: 0 };
                return (
                  <tr key={tech.id}>
                    <Td className="td--strong">{tech.name}</Td>
                    <Td>{tech.position ?? "—"}</Td>
                    <Td>{tech.phone ?? "—"}</Td>
                    <Td>{s.completed}</Td>
                    <Td>{s.running > 0 ? <Badge tone="warning">{s.running}</Badge> : "0"}</Td>
                    <Td>
                      {s.minutes} {t("tech.minutes")}
                    </Td>
                    <Td>
                      <Badge tone={tech.isActive ? "success" : "danger"}>
                        {tech.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
