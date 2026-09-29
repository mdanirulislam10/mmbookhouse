import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { BackupButton } from "@/components/admin/BackupButton";
import { Empty, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  await requireStaff([]);
  const { t, lang } = await getT();
  const { data } = await createServiceClient().from("backup_jobs").select("*").order("created_at", { ascending: false }).limit(30);
  const tone = { queued: "amber", running: "blue", succeeded: "green", failed: "red" } as const;
  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.nav.backups")} subtitle={t("admin.backup.subtitle")} actions={<BackupButton />} />
      <Panel padded={false}>
        {data?.length ? (
          <Table>
            <thead><tr><Th>{t("common.date")}</Th><Th>{t("admin.backup.trigger")}</Th><Th>{t("common.status")}</Th><Th>{t("admin.backup.size")}</Th><Th /></tr></thead>
            <tbody>
              {data.map((j) => (
                <tr key={j.id as string}>
                  <Td className="whitespace-nowrap text-xs">{formatDate(j.created_at as string, lang, true)}</Td>
                  <Td>{j.trigger_type === "manual" ? t("admin.backup.manual") : t("admin.backup.scheduled")}</Td>
                  <Td>
                    <Badge tone={tone[j.status as keyof typeof tone]}>{j.status as string}</Badge>
                    {j.error_message ? <p className="mt-1 max-w-xs text-xs text-red-600">{j.error_message as string}</p> : null}
                  </Td>
                  <Td>{j.file_size_bytes ? `${(Number(j.file_size_bytes) / 1024 / 1024).toFixed(1)} MB` : "—"}</Td>
                  <Td>{j.drive_web_view_link ? <a className="link inline-flex items-center gap-1 text-sm" href={j.drive_web_view_link as string} target="_blank" rel="noopener noreferrer">Drive <ExternalLink size={12} /></a> : null}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <Empty>{t("admin.backup.none")}</Empty>}
      </Panel>
    </div>
  );
}
