import { Download } from "lucide-react";
import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { Empty, PageHeader, Pager, Panel, Table, Td, Th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { formatDate, formatINR, toInt } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PER = 30;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff([]);
  const { t, lang } = await getT();
  const page = Math.max(toInt((await searchParams).page, 1), 1);
  const service = createServiceClient();
  const { data } = await service.auth.admin.listUsers({ page, perPage: PER });
  const users = data?.users ?? [];
  const ids = users.map((u) => u.id);
  const [{ data: profiles }, { data: orders }] = ids.length
    ? await Promise.all([service.from("profiles").select("id, full_name, phone").in("id", ids), service.from("orders").select("user_id, total").in("user_id", ids).not("status", "in", "(cancelled,returned)")])
    : [{ data: [] }, { data: [] }];
  const pm = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const om = new Map<string, { n: number; sum: number }>();
  for (const o of orders ?? []) {
    const c = om.get(o.user_id as string) ?? { n: 0, sum: 0 };
    c.n++;
    c.sum += Number(o.total);
    om.set(o.user_id as string, c);
  }
  const total = (data as { total?: number } | null)?.total ?? users.length;
  return (
    <div>
      <PageHeader title={t("admin.nav.customers")} subtitle={t("admin.customers.subtitle")} actions={<a href="/api/admin/export/customers" className={buttonClass("secondary", "sm")}><Download size={14} /> CSV</a>} />
      <Panel padded={false}>
        {users.length ? (
          <Table>
            <thead><tr><Th>{t("common.name")}</Th><Th>{t("common.email")}</Th><Th>{t("common.phone")}</Th><Th>{t("admin.customers.joined")}</Th><Th>{t("admin.nav.orders")}</Th><Th>{t("admin.customers.spent")}</Th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium">{pm.get(u.id)?.full_name ?? "—"}</Td>
                  <Td>{u.email ?? "—"}</Td>
                  <Td>{pm.get(u.id)?.phone ?? "—"}</Td>
                  <Td className="text-xs text-slate-500">{formatDate(u.created_at, lang)}</Td>
                  <Td>{om.get(u.id)?.n ?? 0}</Td>
                  <Td>{formatINR(om.get(u.id)?.sum ?? 0)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <Empty>—</Empty>}
        <Pager basePath="/admin/customers" params={{}} page={page} pages={Math.max(Math.ceil(total / PER), 1)} prev={t("common.previous")} next={t("common.next")} />
      </Panel>
    </div>
  );
}
