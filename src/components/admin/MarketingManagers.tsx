"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteBanner, deleteCoupon, endFlashDeal, saveBanner, saveCoupon, saveFlashDeal } from "@/app/admin/actions/marketing";
import { bulkPrice } from "@/app/admin/actions/books";
import { BookPicker, type PickedBook } from "@/components/admin/BookPicker";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useRun } from "@/components/admin/useRun";
import { Empty, Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { formatDate, formatINR } from "@/lib/utils";

/* ------------------------------------------------------------------ coupons */
export interface CouponRow { id: string; code: string; description: string | null; kind: "percent" | "flat"; value: number; max_discount: number | null; min_order: number; starts_at: string | null; ends_at: string | null; usage_limit: number | null; per_user_limit: number; used_count: number; is_active: boolean }

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const blank = { code: "", description: "", kind: "percent" as "percent" | "flat", value: "", max_discount: "", min_order: "0", ends_at: "", usage_limit: "", per_user_limit: "1" };
  const [f, setF] = useState(blank);
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className="space-y-4">
      <Panel title={t("admin.coupon.new")}>
        <form
          className="grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveCoupon({ code: f.code, description: f.description, kind: f.kind, value: Number(f.value), max_discount: num(f.max_discount), min_order: Number(f.min_order) || 0, ends_at: f.ends_at, usage_limit: num(f.usage_limit), per_user_limit: Number(f.per_user_limit) || 1 }), { onOk: () => setF(blank) });
          }}
        >
          <Field label={t("admin.coupon.code")} htmlFor="c-code"><Input id="c-code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="font-mono uppercase" maxLength={24} placeholder="WBCS10" /></Field>
          <Field label={t("admin.coupon.kind")} htmlFor="c-kind">
            <Select id="c-kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "percent" })}>
              <option value="percent">{t("admin.coupon.percent")}</option>
              <option value="flat">{t("admin.coupon.flat")}</option>
            </Select>
          </Field>
          <Field label={f.kind === "percent" ? "%" : "₹"} htmlFor="c-val"><Input id="c-val" required inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
          <Field label={t("admin.coupon.maxDiscount")} hint={t("common.optional")} htmlFor="c-max"><Input id="c-max" inputMode="decimal" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} /></Field>
          <Field label={t("admin.coupon.minOrder")} htmlFor="c-min"><Input id="c-min" inputMode="decimal" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} /></Field>
          <Field label={t("admin.coupon.expires")} hint={t("common.optional")} htmlFor="c-end"><Input id="c-end" type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></Field>
          <Field label={t("admin.coupon.usageLimit")} hint={t("common.optional")} htmlFor="c-ul"><Input id="c-ul" inputMode="numeric" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} /></Field>
          <Field label={t("admin.coupon.perUser")} htmlFor="c-pu"><Input id="c-pu" inputMode="numeric" value={f.per_user_limit} onChange={(e) => setF({ ...f, per_user_limit: e.target.value })} /></Field>
          <div className="sm:col-span-4"><Button type="submit" disabled={pending}>{t("common.add")}</Button></div>
        </form>
      </Panel>
      <Panel padded={false}>
        {coupons.length === 0 ? <Empty>{t("admin.coupon.none")}</Empty> : (
          <Table>
            <thead><tr><Th>{t("admin.coupon.code")}</Th><Th>{t("admin.coupon.offer")}</Th><Th>{t("admin.coupon.minOrder")}</Th><Th>{t("admin.coupon.used")}</Th><Th>{t("admin.coupon.expires")}</Th><Th>{t("common.status")}</Th><Th /></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <Td className="font-mono font-semibold">{c.code}</Td>
                  <Td>{c.kind === "percent" ? `${c.value}%${c.max_discount ? ` (max ${formatINR(c.max_discount)})` : ""}` : formatINR(c.value)}</Td>
                  <Td>{formatINR(c.min_order)}</Td>
                  <Td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</Td>
                  <Td className="text-xs">{c.ends_at ? formatDate(c.ends_at, lang, true) : "—"}</Td>
                  <Td>
                    <button onClick={() => run(() => saveCoupon({ ...c, description: c.description ?? "", starts_at: c.starts_at ?? "", ends_at: c.ends_at ?? "", is_active: !c.is_active }))} disabled={pending}>
                      <Badge tone={c.is_active ? "green" : "neutral"}>{c.is_active ? t("admin.status.active") : t("admin.coupon.off")}</Badge>
                    </button>
                  </Td>
                  <Td><Button size="sm" variant="ghost" aria-label={t("common.delete")} disabled={pending} onClick={() => confirm(t("admin.coupon.deleteConfirm")) && run(() => deleteCoupon(c.id))}><Trash2 size={14} /></Button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ banners */
export interface BannerRow { id: string; title: string; title_bn: string | null; subtitle: string | null; subtitle_bn: string | null; image_url: string | null; link_url: string | null; cta_label: string | null; cta_label_bn: string | null; bg_color: string | null; sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null }

export function BannersManager({ banners }: { banners: BannerRow[] }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const blank = { title: "", title_bn: "", subtitle: "", subtitle_bn: "", image: [] as string[], link_url: "", cta_label: "", cta_label_bn: "", bg_color: "#131921" };
  const [f, setF] = useState(blank);
  return (
    <div className="space-y-4">
      <Panel title={t("admin.banner.new")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveBanner({ title: f.title, title_bn: f.title_bn, subtitle: f.subtitle, subtitle_bn: f.subtitle_bn, image_url: f.image[0] ?? "", link_url: f.link_url, cta_label: f.cta_label, cta_label_bn: f.cta_label_bn, bg_color: f.bg_color, sort_order: banners.length }), { onOk: () => setF(blank) });
          }}
        >
          <Field label={t("admin.book.titleEn")} htmlFor="bn-t"><Input id="bn-t" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} /></Field>
          <Field label={t("admin.book.titleBn")} htmlFor="bn-tb"><Input id="bn-tb" value={f.title_bn} onChange={(e) => setF({ ...f, title_bn: e.target.value })} maxLength={120} /></Field>
          <Field label={t("admin.banner.subtitle")} htmlFor="bn-s"><Input id="bn-s" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} maxLength={200} /></Field>
          <Field label={`${t("admin.banner.subtitle")} (বাংলা)`} htmlFor="bn-sb"><Input id="bn-sb" value={f.subtitle_bn} onChange={(e) => setF({ ...f, subtitle_bn: e.target.value })} maxLength={200} /></Field>
          <Field label={t("admin.banner.link")} hint="/category/wbcs" htmlFor="bn-l"><Input id="bn-l" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} /></Field>
          <Field label={t("admin.banner.color")} htmlFor="bn-c"><Input id="bn-c" type="color" value={f.bg_color} onChange={(e) => setF({ ...f, bg_color: e.target.value })} className="h-10 w-20 p-1" /></Field>
          <Field label={t("admin.banner.cta")} htmlFor="bn-cta"><Input id="bn-cta" value={f.cta_label} onChange={(e) => setF({ ...f, cta_label: e.target.value })} maxLength={40} /></Field>
          <Field label={`${t("admin.banner.cta")} (বাংলা)`} htmlFor="bn-ctab"><Input id="bn-ctab" value={f.cta_label_bn} onChange={(e) => setF({ ...f, cta_label_bn: e.target.value })} maxLength={40} /></Field>
          <div className="sm:col-span-2"><ImageUploader folder="banners" label={t("admin.banner.image")} value={f.image} onChange={(u) => setF({ ...f, image: u })} aspect="aspect-[16/6]" /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{t("common.add")}</Button></div>
        </form>
      </Panel>
      <Panel padded={false}>
        {banners.length === 0 ? <Empty>{t("admin.banner.none")}</Empty> : (
          <ul className="divide-y">
            {banners.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="h-12 w-24 shrink-0 rounded" style={{ background: b.bg_color ?? "#131921", backgroundImage: b.image_url ? `url(${b.image_url})` : undefined, backgroundSize: "cover" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="truncate text-xs text-slate-500">{b.link_url ?? "—"}</p>
                </div>
                <button disabled={pending} onClick={() => run(() => saveBanner({ ...b, title_bn: b.title_bn ?? "", subtitle: b.subtitle ?? "", subtitle_bn: b.subtitle_bn ?? "", image_url: b.image_url ?? "", link_url: b.link_url ?? "", cta_label: b.cta_label ?? "", cta_label_bn: b.cta_label_bn ?? "", bg_color: b.bg_color ?? "", starts_at: b.starts_at ?? "", ends_at: b.ends_at ?? "", is_active: !b.is_active }))}>
                  <Badge tone={b.is_active ? "green" : "neutral"}>{b.is_active ? t("admin.status.active") : t("admin.coupon.off")}</Badge>
                </button>
                <Button size="sm" variant="ghost" aria-label={t("common.delete")} disabled={pending} onClick={() => confirm(t("admin.banner.deleteConfirm")) && run(() => deleteBanner(b.id))}><Trash2 size={14} /></Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------- deals */
export interface DealRow { id: string; book_id: string; title: string; deal_price: number; sale_price: number; ends_at: string }

export function DealsManager({ deals }: { deals: DealRow[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const toast = useToast();
  const [book, setBook] = useState<PickedBook | null>(null);
  const [price, setPrice] = useState("");
  const [ends, setEnds] = useState("");
  return (
    <div className="space-y-4">
      <Panel title={t("admin.deal.new")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            {book ? (
              <p className="flex items-center justify-between rounded border bg-amber-50 px-3 py-2 text-sm"><span className="font-medium">{book.title}</span><span>{formatINR(book.price)} <button className="link ml-3" onClick={() => setBook(null)}>{t("common.change")}</button></span></p>
            ) : <BookPicker onPick={(b) => { setBook(b); setPrice(String(Math.floor(b.price * 0.85))); }} />}
          </div>
          <Field label={t("admin.deal.price")} htmlFor="d-p"><Input id="d-p" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label={t("admin.deal.endsAt")} htmlFor="d-e"><Input id="d-e" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
          <div className="flex items-end">
            <Button disabled={pending || !book || !price || !ends} onClick={() => run(() => saveFlashDeal({ bookId: book!.id, dealPrice: Number(price), endsAt: new Date(ends).toISOString() }), { onOk: () => { setBook(null); setPrice(""); setEnds(""); } })}>{t("admin.deal.start")}</Button>
          </div>
        </div>
      </Panel>
      <Panel padded={false}>
        {deals.length === 0 ? <Empty>{t("admin.deal.none")}</Empty> : (
          <Table>
            <thead><tr><Th>{t("admin.col.book")}</Th><Th>{t("admin.deal.price")}</Th><Th>{t("admin.deal.endsAt")}</Th><Th /></tr></thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <Td>{d.title}</Td>
                  <Td><strong>{formatINR(d.deal_price)}</strong> <s className="text-xs text-slate-400">{formatINR(d.sale_price)}</s></Td>
                  <Td className="text-xs">{formatDate(d.ends_at, lang, true)}</Td>
                  <Td><Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => endFlashDeal(d.id), { success: t("admin.deal.ended") })}>{t("admin.deal.end")}</Button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      <span className="hidden">{String(!!toast)}</span>
    </div>
  );
}

/* -------------------------------------------------------------- bulk prices */
export function BulkPriceTool({ publishers, categories }: { publishers: { id: string; name: string }[]; categories: { id: string; name: string }[] }) {
  const { t } = useT();
  const toast = useToast();
  const { run, pending } = useRun();
  const [scope, setScope] = useState<"publisher" | "category">("publisher");
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"discount_pct" | "adjust_pct">("discount_pct");
  const [pct, setPct] = useState("");
  const list = scope === "publisher" ? publishers : categories;
  return (
    <Panel title={t("admin.bulk.title")}>
      <p className="mb-3 text-sm text-slate-600">{t("admin.bulk.help")}</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("admin.bulk.scope")} htmlFor="bp-scope">
          <Select id="bp-scope" value={scope} onChange={(e) => { setScope(e.target.value as "publisher"); setTarget(""); }}>
            <option value="publisher">{t("book.publisher")}</option>
            <option value="category">{t("admin.book.categories")}</option>
          </Select>
        </Field>
        <Field label={t("common.name")} htmlFor="bp-target">
          <Select id="bp-target" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">—</option>
            {list.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
        </Field>
        <Field label={t("admin.bulk.mode")} htmlFor="bp-mode">
          <Select id="bp-mode" value={mode} onChange={(e) => setMode(e.target.value as "discount_pct")}>
            <option value="discount_pct">{t("admin.bulk.setDiscount")}</option>
            <option value="adjust_pct">{t("admin.bulk.adjust")}</option>
          </Select>
        </Field>
        <Field label="%" htmlFor="bp-pct"><Input id="bp-pct" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
      </div>
      <Button
        className="mt-3"
        disabled={pending || !target || pct === ""}
        onClick={() => {
          if (!confirm(t("admin.bulk.confirm"))) return;
          run(async () => {
            const res = await bulkPrice({ publisherId: scope === "publisher" ? target : undefined, categoryId: scope === "category" ? target : undefined, mode, pct: Number(pct) });
            if (res.ok) toast.success(t("admin.bulk.done", { n: res.data?.count ?? 0 }));
            return res;
          }, { success: t("common.saved") });
        }}
      >
        {t("admin.bulk.apply")}
      </Button>
    </Panel>
  );
}
