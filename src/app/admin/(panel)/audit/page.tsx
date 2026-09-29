import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PAGE_SIZE } from "@/lib/admin/data";
import { Empty, PageHeader, Pager, Panel, Table, Td, Th } from "@/components/admin/ui";
import { first, formatDate, toInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff([]);
  const sp = await searchParams;
  const { t, lang } = await getT();
  const page = Math.max(toInt(sp.page, 1), 1);
  const q = first(sp.q)?.trim();
  const from = (page - 1) * PAGE_SIZE;
  let query = createServiceClient().from("audit_logs").select("id, actor_id, actor_role, action, entity, entity_id, after_data, ip, created_at", { count: "exact" }).order("id", { ascending: false });
  if (q) query = query.ilike("action", `%${q.replace(/[%_]/g, "")}%`);
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const pages = Math.max(Math.ceil((count ?? 0) / PAGE_SIZE), 1);

  const ids = [...new Set((data ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await createServiceClient().from("profiles").select("id, full_name").in("id", ids);
    for (const p of profs ?? []) names.set(p.id as string, (p.full_name as string) ?? "");
  }
  return (
    <div>
      <PageHeader title={t("admin.nav.audit")} subtitle={t("admin.audit.subtitle")} />
      <Panel padded={false}>
        <form action="/admin/audit" className="border-b p-3"><input name="q" defaultValue={q} placeholder={t("admin.audit.filter")} className="h-9 w-full rounded-full border border-slate-300 px-4 text-sm sm:w-72" /></form>
        {data?.length ? (
          <Table>
            <thead><tr><Th>{t("common.date")}</Th><Th>{t("admin.audit.who")}</Th><Th>{t("admin.audit.action")}</Th><Th>{t("admin.audit.target")}</Th><Th>IP</Th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.created_at as string, lang, true)}</Td>
                  <Td>{names.get(r.actor_id as string) || "—"} <span className="text-xs text-slate-400">{r.actor_role}</span></Td>
                  <Td className="font-mono text-xs">{r.action}</Td>
                  <Td className="max-w-[260px] truncate text-xs text-slate-600">{r.entity} {r.entity_id ?? ""}</Td>
                  <Td className="text-xs text-slate-400">{r.ip ?? ""}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <Empty>—</Empty>}
        <Pager basePath="/admin/audit" params={{ q }} page={page} pages={pages} prev={t("common.previous")} next={t("common.next")} />
      </Panel>
    </div>
  );
}
