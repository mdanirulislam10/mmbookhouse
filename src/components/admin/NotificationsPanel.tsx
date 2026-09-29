"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { retryNotifications, saveChannelSwitches, sendTestNotification } from "@/app/admin/actions/notifications";
import { useRun } from "@/components/admin/useRun";
import { Empty, Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/utils";

export interface ProviderRow {
  channel: "email" | "whatsapp" | "sms";
  configured: boolean;
  provider: string;
  missing: string[];
}
export interface OutboxRow {
  id: string;
  channel: string;
  recipient: string;
  template: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
}

export function NotificationsPanel({
  providers,
  switches,
  rows,
}: {
  providers: ProviderRow[];
  switches: { email: boolean; whatsapp: boolean; sms: boolean };
  rows: OutboxRow[];
}) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const toast = useToast();
  const [sw, setSw] = useState(switches);
  const [testChannel, setTestChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [to, setTo] = useState("");
  const tone = { sent: "green", queued: "amber", failed: "red", skipped: "neutral" } as const;

  return (
    <div className="space-y-4">
      <Panel title={t("admin.notify.providers")}>
        <ul className="divide-y">
          {providers.map((p) => (
            <li key={p.channel} className="flex flex-wrap items-center gap-3 py-3">
              {p.configured ? <CheckCircle2 className="text-emerald-600" size={20} /> : <CircleAlert className="text-amber-600" size={20} />}
              <div className="min-w-[180px] flex-1">
                <p className="font-medium">
                  {t(`admin.notify.ch.${p.channel}` as "admin.notify.ch.email")} <span className="text-xs font-normal text-slate-500">· {p.provider}</span>
                </p>
                <p className="text-xs text-slate-500">{p.configured ? t("admin.notify.configured") : `${t("admin.notify.missing")}: ${p.missing.join(", ")}`}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sw[p.channel]} onChange={(e) => setSw({ ...sw, [p.channel]: e.target.checked })} className="accent-amber-500" />
                {t("admin.notify.on")}
              </label>
            </li>
          ))}
        </ul>
        <Button className="mt-2" size="sm" disabled={pending} onClick={() => run(() => saveChannelSwitches(sw))}>
          {t("common.save")}
        </Button>
        <p className="mt-3 text-xs text-slate-500">{t("admin.notify.help")}</p>
      </Panel>

      <Panel title={t("admin.notify.test")}>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => sendTestNotification({ channel: testChannel, to }), { success: t("admin.notify.testSent"), refresh: false });
          }}
        >
          <Select value={testChannel} onChange={(e) => setTestChannel(e.target.value as "email")} className="w-40">
            {providers.map((p) => (
              <option key={p.channel} value={p.channel}>
                {t(`admin.notify.ch.${p.channel}` as "admin.notify.ch.email")}
              </option>
            ))}
          </Select>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={testChannel === "email" ? "you@example.com" : "98XXXXXXXX"} className="w-64" required />
          <Button type="submit" disabled={pending}>
            {t("admin.notify.sendTest")}
          </Button>
        </form>
      </Panel>

      <Panel
        title={t("admin.notify.recent")}
        padded={false}
        actions={
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(
                async () => {
                  const r = await retryNotifications();
                  if (r.ok) toast.success(t("admin.notify.retried", { sent: r.data!.sent, failed: r.data!.failed }));
                  return r;
                },
                { success: t("common.saved") },
              )
            }
          >
            <RefreshCw size={14} /> {t("admin.notify.retry")}
          </Button>
        }
      >
        {rows.length === 0 ? (
          <Empty>{t("admin.notify.none")}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.date")}</Th>
                <Th>{t("admin.notify.channel")}</Th>
                <Th>{t("admin.notify.to")}</Th>
                <Th>{t("admin.notify.event")}</Th>
                <Th>{t("common.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.created_at, lang, true)}</Td>
                  <Td>{t(`admin.notify.ch.${r.channel}` as "admin.notify.ch.email")}</Td>
                  <Td className="max-w-[200px] truncate">{r.recipient}</Td>
                  <Td className="font-mono text-xs">{r.template}</Td>
                  <Td>
                    <Badge tone={tone[r.status as keyof typeof tone] ?? "neutral"}>{r.status}</Badge>
                    {r.last_error ? <p className="mt-1 max-w-xs text-xs text-slate-500">{r.last_error}</p> : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
