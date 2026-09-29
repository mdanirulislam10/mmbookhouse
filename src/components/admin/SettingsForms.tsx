"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteDeliveryRule, saveDeliveryRule, saveSetting } from "@/app/admin/actions/settings";
import { useRun } from "@/components/admin/useRun";
import { Panel, Table, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import type { PublicSettings } from "@/lib/types";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

function StoreProfile({ v }: { v: PublicSettings["store_profile"] }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [f, setF] = useState(v);
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Panel title={t("admin.settings.store")}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveSetting("store_profile", f)); }}>
        <Field label={t("admin.book.titleEn")} htmlFor="sp-n"><Input id="sp-n" value={f.name} onChange={s("name")} required /></Field>
        <Field label={t("admin.book.titleBn")} htmlFor="sp-nb"><Input id="sp-nb" value={f.name_bn} onChange={s("name_bn")} /></Field>
        <Field label={t("admin.settings.tagline")} htmlFor="sp-t"><Input id="sp-t" value={f.tagline} onChange={s("tagline")} /></Field>
        <Field label={`${t("admin.settings.tagline")} (বাংলা)`} htmlFor="sp-tb"><Input id="sp-tb" value={f.tagline_bn} onChange={s("tagline_bn")} /></Field>
        <Field label={t("common.address")} htmlFor="sp-a" className="sm:col-span-2"><Input id="sp-a" value={f.address} onChange={s("address")} /></Field>
        <Field label={`${t("common.address")} (বাংলা)`} htmlFor="sp-ab" className="sm:col-span-2"><Input id="sp-ab" value={f.address_bn ?? ""} onChange={s("address_bn")} /></Field>
        <Field label={t("account.addr.pincode")} htmlFor="sp-p"><Input id="sp-p" value={f.pincode} onChange={s("pincode")} maxLength={6} inputMode="numeric" /></Field>
        <Field label={t("admin.settings.hours")} htmlFor="sp-h"><Input id="sp-h" value={f.hours} onChange={s("hours")} /></Field>
        <Field label={t("common.phone")} htmlFor="sp-ph"><Input id="sp-ph" value={f.phone} onChange={s("phone")} type="tel" /></Field>
        <Field label="WhatsApp" htmlFor="sp-w"><Input id="sp-w" value={f.whatsapp} onChange={s("whatsapp")} type="tel" placeholder="9198XXXXXXXX" /></Field>
        <Field label={t("common.email")} htmlFor="sp-e" className="sm:col-span-2"><Input id="sp-e" value={f.email} onChange={s("email")} type="email" /></Field>
        <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{t("common.save")}</Button></div>
      </form>
    </Panel>
  );
}

function NoticeAndMaintenance({ notice, maint }: { notice: PublicSettings["notice_bar"]; maint: PublicSettings["maintenance"] }) {
  const { t } = useT();
  const a = useRun();
  const b = useRun();
  const [n, setN] = useState(notice);
  const [m, setM] = useState(maint);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={t("admin.settings.notice")}>
        <div className="space-y-3">
          <Toggle checked={n.enabled} onChange={(v) => setN({ ...n, enabled: v })} label={t("admin.settings.noticeOn")} />
          <Field label={t("admin.settings.text")} htmlFor="nb-t"><Input id="nb-t" value={n.text} onChange={(e) => setN({ ...n, text: e.target.value })} maxLength={200} /></Field>
          <Field label={`${t("admin.settings.text")} (বাংলা)`} htmlFor="nb-tb"><Input id="nb-tb" value={n.text_bn} onChange={(e) => setN({ ...n, text_bn: e.target.value })} maxLength={200} /></Field>
          <Field label={t("admin.banner.link")} hint={t("common.optional")} htmlFor="nb-h"><Input id="nb-h" value={n.href} onChange={(e) => setN({ ...n, href: e.target.value })} /></Field>
          <Button disabled={a.pending} onClick={() => a.run(() => saveSetting("notice_bar", n))}>{t("common.save")}</Button>
        </div>
      </Panel>
      <Panel title={t("admin.settings.maintenance")} className={m.enabled ? "border-red-300" : ""}>
        <div className="space-y-3">
          <Toggle checked={m.enabled} onChange={(v) => setM({ ...m, enabled: v })} label={t("admin.settings.maintenanceOn")} />
          <p className="text-xs text-slate-500">{t("admin.settings.maintenanceHelp")}</p>
          <Field label={t("admin.settings.text")} htmlFor="mt-t"><Textarea id="mt-t" rows={2} value={m.message} onChange={(e) => setM({ ...m, message: e.target.value })} maxLength={300} /></Field>
          <Field label={`${t("admin.settings.text")} (বাংলা)`} htmlFor="mt-tb"><Textarea id="mt-tb" rows={2} value={m.message_bn} onChange={(e) => setM({ ...m, message_bn: e.target.value })} maxLength={300} /></Field>
          <Button variant={m.enabled ? "danger" : "primary"} disabled={b.pending} onClick={() => b.run(() => saveSetting("maintenance", m))}>{t("common.save")}</Button>
        </div>
      </Panel>
    </div>
  );
}

function PaymentAndCheckout({ pay, chk }: { pay: PublicSettings["payment"]; chk: PublicSettings["checkout"] }) {
  const { t } = useT();
  const a = useRun();
  const b = useRun();
  const [p, setP] = useState({ ...pay, cod_max_order: String(pay.cod_max_order) });
  const [c, setC] = useState({ ...chk, max_qty_per_item: String(chk.max_qty_per_item) });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={t("admin.settings.payment")}>
        <div className="space-y-3">
          <Toggle checked={p.cod_enabled} onChange={(v) => setP({ ...p, cod_enabled: v })} label={t("checkout.cod")} />
          <Field label={t("admin.settings.codMax")} htmlFor="pm-c"><Input id="pm-c" inputMode="numeric" value={p.cod_max_order} onChange={(e) => setP({ ...p, cod_max_order: e.target.value.replace(/\D/g, "") })} /></Field>
          <Toggle checked={p.upi_enabled} onChange={(v) => setP({ ...p, upi_enabled: v })} label={t("checkout.upi")} />
          <Field label={t("order.upiId")} hint="name@bank" htmlFor="pm-u"><Input id="pm-u" value={p.upi_id} onChange={(e) => setP({ ...p, upi_id: e.target.value.trim() })} className="font-mono" /></Field>
          <Field label={t("order.payee")} htmlFor="pm-n"><Input id="pm-n" value={p.upi_payee_name} onChange={(e) => setP({ ...p, upi_payee_name: e.target.value })} /></Field>
          <Button disabled={a.pending} onClick={() => a.run(() => saveSetting("payment", { ...p, cod_max_order: Number(p.cod_max_order) || 0 }))}>{t("common.save")}</Button>
        </div>
      </Panel>
      <Panel title={t("admin.settings.checkout")}>
        <div className="space-y-3">
          <Toggle checked={c.pickup_enabled} onChange={(v) => setC({ ...c, pickup_enabled: v })} label={t("checkout.pickup")} />
          <Field label={t("admin.settings.pickupAddress")} htmlFor="ck-a"><Input id="ck-a" value={c.pickup_address} onChange={(e) => setC({ ...c, pickup_address: e.target.value })} /></Field>
          <Field label={t("admin.settings.maxQty")} htmlFor="ck-q"><Input id="ck-q" inputMode="numeric" value={c.max_qty_per_item} onChange={(e) => setC({ ...c, max_qty_per_item: e.target.value.replace(/\D/g, "") })} /></Field>
          <Button disabled={b.pending} onClick={() => b.run(() => saveSetting("checkout", { ...c, max_qty_per_item: Number(c.max_qty_per_item) || 10 }))}>{t("common.save")}</Button>
        </div>
      </Panel>
    </div>
  );
}

export interface RuleRow { id: string; label: string; label_bn: string | null; match_value: string; fee: number; free_above: number | null; eta_min_days: number; eta_max_days: number; cod_available: boolean; is_active: boolean }

function RuleEditor({ r }: { r?: RuleRow }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const init = { label: r?.label ?? "", label_bn: r?.label_bn ?? "", match_value: r?.match_value ?? "", fee: String(r?.fee ?? 60), free_above: r?.free_above == null ? "" : String(r.free_above), eta_min_days: String(r?.eta_min_days ?? 2), eta_max_days: String(r?.eta_max_days ?? 4), cod_available: r?.cod_available ?? true, is_active: r?.is_active ?? true };
  const [f, setF] = useState(init);
  const save = () =>
    run(() => saveDeliveryRule({ id: r?.id, label: f.label, label_bn: f.label_bn, match_value: f.match_value, fee: Number(f.fee) || 0, free_above: f.free_above === "" ? null : Number(f.free_above), eta_min_days: Number(f.eta_min_days) || 0, eta_max_days: Number(f.eta_max_days) || 0, cod_available: f.cod_available, is_active: f.is_active }), { onOk: () => !r && setF(init) });
  const cell = "h-8 min-w-[64px]";
  return (
    <tr>
      <Td><Input className={cell} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder={t("admin.settings.zoneName")} /></Td>
      <Td><Input className={`${cell} w-24 font-mono`} value={f.match_value} onChange={(e) => setF({ ...f, match_value: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="732" /></Td>
      <Td><Input className={`${cell} w-20`} value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value.replace(/[^\d.]/g, "") })} /></Td>
      <Td><Input className={`${cell} w-20`} value={f.free_above} onChange={(e) => setF({ ...f, free_above: e.target.value.replace(/[^\d.]/g, "") })} placeholder="—" /></Td>
      <Td>
        <div className="flex items-center gap-1">
          <Input className={`${cell} w-14`} value={f.eta_min_days} onChange={(e) => setF({ ...f, eta_min_days: e.target.value.replace(/\D/g, "") })} />–
          <Input className={`${cell} w-14`} value={f.eta_max_days} onChange={(e) => setF({ ...f, eta_max_days: e.target.value.replace(/\D/g, "") })} />
        </div>
      </Td>
      <Td><input type="checkbox" checked={f.cod_available} onChange={(e) => setF({ ...f, cod_available: e.target.checked })} className="accent-amber-500" aria-label="COD" /></Td>
      <Td><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="accent-amber-500" aria-label={t("admin.catalog.active")} /></Td>
      <Td>
        <div className="flex gap-1">
          <Button size="sm" disabled={pending || !f.label} onClick={save}>{r ? t("common.save") : t("common.add")}</Button>
          {r ? <Button size="sm" variant="ghost" aria-label={t("common.delete")} disabled={pending} onClick={() => confirm(t("admin.settings.deleteRule")) && run(() => deleteDeliveryRule(r.id))}><Trash2 size={14} /></Button> : null}
        </div>
      </Td>
    </tr>
  );
}

function DeliveryRules({ rules }: { rules: RuleRow[] }) {
  const { t } = useT();
  return (
    <Panel title={t("admin.settings.delivery")} padded={false}>
      <p className="px-4 pt-3 text-sm text-slate-600">{t("admin.settings.deliveryHelp")}</p>
      <Table>
        <thead><tr><Th>{t("admin.settings.zoneName")}</Th><Th>{t("admin.settings.pinPrefix")}</Th><Th>{t("admin.settings.fee")}</Th><Th>{t("admin.settings.freeAbove")}</Th><Th>{t("admin.settings.eta")}</Th><Th>COD</Th><Th>{t("admin.catalog.active")}</Th><Th /></tr></thead>
        <tbody>
          {rules.map((r) => <RuleEditor key={r.id} r={r} />)}
          <RuleEditor />
        </tbody>
      </Table>
    </Panel>
  );
}

export function SettingsForms({ settings, rules }: { settings: PublicSettings; rules: RuleRow[] }) {
  return (
    <div className="space-y-4">
      <StoreProfile v={settings.store_profile} />
      <NoticeAndMaintenance notice={settings.notice_bar} maint={settings.maintenance} />
      <PaymentAndCheckout pay={settings.payment} chk={settings.checkout} />
      <DeliveryRules rules={rules} />
    </div>
  );
}
