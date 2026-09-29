"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { saveBook } from "@/app/admin/actions/books";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { pick } from "@/lib/i18n";
import type { BookFormData } from "@/lib/admin/books";
import { formatINR } from "@/lib/utils";

type Cat = { id: string; parent_id: string | null; name: string; name_bn: string | null };

const EMPTY: BookFormData = {
  id: "", slug: "", title: "", title_bn: "", subtitle: "", description: "", description_bn: "", isbn: "", publisher: "", authors: [], category_ids: [],
  language: "bn", binding: "paperback", condition: "new", edition: "", edition_year: "", pages: "", weight_g: "", class_level: "", mrp: "", sale_price: "",
  cost_price: "", rack_location: "", supplier_note: "", on_hand: 0, low_stock_threshold: "5", hsn_code: "4901", cover_url: "", gallery: [], preview_pages: [],
  status: "draft", is_featured: false, related: [],
};

export function BookForm({ initial, categories, publishers, canSeeCost }: { initial?: BookFormData; categories: Cat[]; publishers: string[]; canSeeCost: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const isNew = !initial;
  const [f, setF] = useState<BookFormData>(initial ?? EMPTY);
  const [authorDraft, setAuthorDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof BookFormData>(k: K, v: BookFormData[K]) => setF((cur) => ({ ...cur, [k]: v }));
  const text = (k: keyof BookFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never);

  const mrp = Number(f.mrp);
  const sale = Number(f.sale_price);
  const discount = mrp > 0 && sale >= 0 && sale <= mrp ? Math.round(((mrp - sale) * 100) / mrp) : 0;
  const margin = canSeeCost && f.cost_price !== "" && sale > 0 ? Math.round(((sale - Number(f.cost_price)) * 100) / sale) : null;

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);
  const toggleCat = (id: string) => set("category_ids", f.category_ids.includes(id) ? f.category_ids.filter((c) => c !== id) : [...f.category_ids, id]);

  const addAuthor = () => {
    const names = authorDraft.split(/[,;]/).map((n) => n.trim()).filter(Boolean);
    if (names.length) set("authors", [...new Set([...f.authors, ...names])].slice(0, 10));
    setAuthorDraft("");
  };

  const submit = async (e: React.FormEvent, status?: BookFormData["status"]) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await saveBook({
      id: f.id || undefined,
      title: f.title, title_bn: f.title_bn, subtitle: f.subtitle, description: f.description, description_bn: f.description_bn,
      isbn: f.isbn, publisher: f.publisher, authors: f.authors, category_ids: f.category_ids,
      language: f.language as "bn", binding: f.binding as "paperback", condition: f.condition as "new",
      edition: f.edition, edition_year: f.edition_year, pages: f.pages, weight_g: f.weight_g, class_level: f.class_level,
      mrp: f.mrp, sale_price: f.sale_price || f.mrp, cost_price: canSeeCost && f.cost_price !== "" ? f.cost_price : undefined,
      rack_location: f.rack_location, supplier_note: f.supplier_note,
      on_hand: isNew ? f.on_hand : undefined, low_stock_threshold: f.low_stock_threshold, hsn_code: f.hsn_code,
      cover_url: f.cover_url, gallery: f.gallery, preview_pages: f.preview_pages,
      status: status ?? f.status, is_featured: f.is_featured,
    });
    setPending(false);
    if (!res.ok) {
      const msg = errorMessage(lang, res.error, res.detail);
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    toast.success(t("common.saved"));
    if (isNew) router.replace(`/admin/books/${res.data!.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={(e) => submit(e)} className="space-y-4">
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title={t("admin.book.basics")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("admin.book.titleEn")} htmlFor="b-title" className="sm:col-span-2">
                <Input id="b-title" required value={f.title} onChange={text("title")} maxLength={250} />
              </Field>
              <Field label={t("admin.book.titleBn")} hint={t("common.optional")} htmlFor="b-title-bn" className="sm:col-span-2">
                <Input id="b-title-bn" value={f.title_bn} onChange={text("title_bn")} maxLength={250} className="font-bengali" />
              </Field>
              <Field label={t("admin.book.subtitle")} htmlFor="b-sub" className="sm:col-span-2">
                <Input id="b-sub" value={f.subtitle} onChange={text("subtitle")} maxLength={250} />
              </Field>
              <div className="sm:col-span-2">
                <label htmlFor="b-authors" className="mb-1 block text-sm font-medium">{t("admin.book.authors")}</label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white p-1.5">
                  {f.authors.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-sm">
                      {a}
                      <button type="button" aria-label={t("common.delete")} onClick={() => set("authors", f.authors.filter((x) => x !== a))}><X size={12} /></button>
                    </span>
                  ))}
                  <input
                    id="b-authors"
                    value={authorDraft}
                    onChange={(e) => setAuthorDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addAuthor();
                      }
                    }}
                    onBlur={addAuthor}
                    placeholder={t("admin.book.authorsHint")}
                    className="min-w-[160px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none"
                  />
                </div>
              </div>
              <Field label={t("book.publisher")} htmlFor="b-pub">
                <Input id="b-pub" list="publishers" value={f.publisher} onChange={text("publisher")} maxLength={120} />
                <datalist id="publishers">{publishers.map((p) => <option key={p} value={p} />)}</datalist>
              </Field>
              <Field label="ISBN" hint="10 / 13" htmlFor="b-isbn">
                <Input id="b-isbn" value={f.isbn} onChange={text("isbn")} inputMode="numeric" maxLength={17} className="font-mono" />
              </Field>
              <Field label={t("book.description")} htmlFor="b-desc" className="sm:col-span-2">
                <Textarea id="b-desc" value={f.description} onChange={text("description")} rows={4} maxLength={6000} />
              </Field>
              <Field label={`${t("book.description")} (বাংলা)`} htmlFor="b-desc-bn" className="sm:col-span-2">
                <Textarea id="b-desc-bn" value={f.description_bn} onChange={text("description_bn")} rows={4} maxLength={6000} className="font-bengali" />
              </Field>
            </div>
          </Panel>

          <Panel title={t("admin.book.details")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t("book.language")} htmlFor="b-lang">
                <Select id="b-lang" value={f.language} onChange={text("language")}>
                  {(["bn", "en", "hi", "ur", "sa", "other"] as const).map((l) => <option key={l} value={l}>{t(`book.lang.${l}` as "book.lang.bn")}</option>)}
                </Select>
              </Field>
              <Field label={t("book.binding")} htmlFor="b-bind">
                <Select id="b-bind" value={f.binding} onChange={text("binding")}>
                  <option value="paperback">{t("book.paperback")}</option>
                  <option value="hardcover">{t("book.hardcover")}</option>
                </Select>
              </Field>
              <Field label={t("book.condition")} htmlFor="b-cond">
                <Select id="b-cond" value={f.condition} onChange={text("condition")}>
                  <option value="new">{t("book.new")}</option>
                  <option value="used">{t("book.used")}</option>
                </Select>
              </Field>
              <Field label={t("book.edition")} htmlFor="b-ed"><Input id="b-ed" value={f.edition} onChange={text("edition")} maxLength={60} /></Field>
              <Field label={t("admin.book.editionYear")} htmlFor="b-year"><Input id="b-year" inputMode="numeric" value={f.edition_year} onChange={text("edition_year")} maxLength={4} /></Field>
              <Field label={t("book.pages")} htmlFor="b-pages"><Input id="b-pages" inputMode="numeric" value={f.pages} onChange={text("pages")} /></Field>
              <Field label={`${t("book.weight")} (g)`} htmlFor="b-weight"><Input id="b-weight" inputMode="numeric" value={f.weight_g} onChange={text("weight_g")} /></Field>
              <Field label={t("book.classLevel")} htmlFor="b-class" className="sm:col-span-2"><Input id="b-class" value={f.class_level} onChange={text("class_level")} placeholder="Class 10 / WBCS / B.A. Sem 3" /></Field>
            </div>
          </Panel>

          <Panel title={t("admin.book.categories")}>
            {roots.length === 0 ? <p className="text-sm text-slate-500">{t("admin.book.noCategories")}</p> : null}
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {roots.map((root) => (
                <fieldset key={root.id}>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={f.category_ids.includes(root.id)} onChange={() => toggleCat(root.id)} className="accent-amber-500" />
                    {pick(lang, root.name, root.name_bn)}
                  </label>
                  <div className="ml-6 mt-1 space-y-1">
                    {childrenOf(root.id).map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={f.category_ids.includes(c.id)} onChange={() => toggleCat(c.id)} className="accent-amber-500" />
                        {pick(lang, c.name, c.name_bn)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </Panel>

          <Panel title={t("admin.book.images")}>
            <div className="space-y-4">
              <ImageUploader folder="covers" label={t("admin.book.cover")} value={f.cover_url ? [f.cover_url] : []} onChange={(u) => set("cover_url", u[0] ?? "")} />
              <ImageUploader folder="gallery" label={t("admin.book.gallery")} value={f.gallery} onChange={(u) => set("gallery", u)} max={8} />
              <ImageUploader folder="previews" label={t("admin.book.preview")} value={f.preview_pages} onChange={(u) => set("preview_pages", u)} max={12} />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={t("admin.book.publish")}>
            <div className="space-y-3">
              <Field label={t("common.status")} htmlFor="b-status">
                <Select id="b-status" value={f.status} onChange={text("status")}>
                  <option value="draft">{t("admin.status.draft")}</option>
                  <option value="active">{t("admin.status.active")}</option>
                  <option value="archived">{t("admin.status.archived")}</option>
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="accent-amber-500" />
                {t("admin.book.featured")}
              </label>
              <div className="flex flex-col gap-2 pt-1">
                <Button type="submit" disabled={pending}>{pending ? t("common.loading") : t("common.save")}</Button>
                {f.status !== "active" ? (
                  <Button type="button" variant="buy" disabled={pending} onClick={(e) => submit(e, "active")}>{t("admin.book.saveAndPublish")}</Button>
                ) : null}
              </div>
              {f.slug ? <p className="text-xs text-slate-500">/book/{f.slug}</p> : null}
            </div>
          </Panel>

          <Panel title={t("admin.book.pricing")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`${t("book.mrp")} ₹`} htmlFor="b-mrp"><Input id="b-mrp" required inputMode="decimal" value={f.mrp} onChange={text("mrp")} /></Field>
              <Field label={`${t("admin.book.salePrice")} ₹`} htmlFor="b-sale"><Input id="b-sale" required inputMode="decimal" value={f.sale_price} onChange={text("sale_price")} /></Field>
              {canSeeCost ? <Field label={`${t("admin.book.costPrice")} ₹`} htmlFor="b-cost"><Input id="b-cost" inputMode="decimal" value={f.cost_price} onChange={text("cost_price")} /></Field> : null}
              <Field label="HSN" htmlFor="b-hsn"><Input id="b-hsn" value={f.hsn_code} onChange={text("hsn_code")} maxLength={10} /></Field>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {mrp > 0 ? <>{t("book.off", { pct: discount })} · {formatINR(sale || 0)}</> : null}
              {margin !== null ? <> · {t("admin.book.margin")}: <strong className={margin < 0 ? "text-red-600" : "text-stock"}>{margin}%</strong></> : null}
            </p>
            {sale > mrp && mrp > 0 ? <p className="mt-1 text-sm text-red-600">{t("err.PRICE_ABOVE_MRP")}</p> : null}
          </Panel>

          <Panel title={t("admin.book.stock")}>
            <div className="grid grid-cols-2 gap-3">
              {isNew ? (
                <Field label={t("admin.book.openingStock")} htmlFor="b-stock"><Input id="b-stock" inputMode="numeric" value={f.on_hand} onChange={(e) => set("on_hand", Math.max(Number(e.target.value.replace(/\D/g, "")) || 0, 0))} /></Field>
              ) : (
                <Field label={t("admin.col.onHand")} htmlFor="b-stock"><Input id="b-stock" value={f.on_hand} disabled readOnly /></Field>
              )}
              <Field label={t("admin.col.threshold")} htmlFor="b-thr"><Input id="b-thr" inputMode="numeric" value={f.low_stock_threshold} onChange={text("low_stock_threshold")} /></Field>
              <Field label={t("admin.col.rack")} htmlFor="b-rack" className="col-span-2"><Input id="b-rack" value={f.rack_location} onChange={text("rack_location")} placeholder="R2-S3" maxLength={40} /></Field>
            </div>
            {!isNew ? <p className="mt-2 text-xs text-slate-500">{t("admin.book.stockHint")}</p> : null}
          </Panel>
        </div>
      </div>
    </form>
  );
}
