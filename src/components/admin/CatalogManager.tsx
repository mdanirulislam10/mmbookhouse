"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createAuthor, createPublisher, deleteAuthor, deleteCategory, deletePublisher, saveAuthor, saveCategory, savePublisher } from "@/app/admin/actions/catalog";
import { useRun } from "@/components/admin/useRun";
import { Panel, Table, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";

interface Cat { id: string; parent_id: string | null; name: string; name_bn: string | null; sort_order: number; show_on_home: boolean; is_active: boolean; slug: string }
interface Person { id: string; name: string; name_bn: string | null }

function CategoryRow({ c, cats }: { c: Cat; cats: Cat[] }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [f, setF] = useState({ name: c.name, name_bn: c.name_bn ?? "", parent_id: c.parent_id ?? "", sort_order: String(c.sort_order), show_on_home: c.show_on_home, is_active: c.is_active });
  const save = () => run(() => saveCategory({ id: c.id, name: f.name, name_bn: f.name_bn, parent_id: f.parent_id || null, sort_order: Number(f.sort_order) || 0, show_on_home: f.show_on_home, is_active: f.is_active }));
  return (
    <tr>
      <Td><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-8 min-w-[140px]" /></Td>
      <Td><Input value={f.name_bn} onChange={(e) => setF({ ...f, name_bn: e.target.value })} className="h-8 min-w-[140px]" /></Td>
      <Td>
        <Select value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })} className="h-8 min-w-[120px]">
          <option value="">—</option>
          {cats.filter((x) => x.id !== c.id && !x.parent_id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
      </Td>
      <Td><Input value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value.replace(/\D/g, "") })} className="h-8 w-16" inputMode="numeric" /></Td>
      <Td><input type="checkbox" checked={f.show_on_home} onChange={(e) => setF({ ...f, show_on_home: e.target.checked })} className="accent-amber-500" aria-label={t("admin.catalog.showOnHome")} /></Td>
      <Td><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="accent-amber-500" aria-label={t("admin.catalog.active")} /></Td>
      <Td>
        <div className="flex gap-1">
          <Button size="sm" disabled={pending} onClick={save}>{t("common.save")}</Button>
          <Button size="sm" variant="ghost" disabled={pending} aria-label={t("common.delete")} onClick={() => confirm(t("admin.catalog.deleteConfirm")) && run(() => deleteCategory(c.id))}><Trash2 size={14} /></Button>
        </div>
      </Td>
    </tr>
  );
}

function PersonRow({ p, kind }: { p: Person; kind: "author" | "publisher" }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [name, setName] = useState(p.name);
  const [bn, setBn] = useState(p.name_bn ?? "");
  const dirty = name !== p.name || bn !== (p.name_bn ?? "");
  return (
    <tr>
      <Td><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" /></Td>
      <Td><Input value={bn} onChange={(e) => setBn(e.target.value)} className="h-8" /></Td>
      <Td>
        <div className="flex gap-1">
          <Button size="sm" disabled={pending || !dirty} onClick={() => run(() => (kind === "author" ? saveAuthor : savePublisher)({ id: p.id, name, name_bn: bn }))}>{t("common.save")}</Button>
          <Button size="sm" variant="ghost" disabled={pending} aria-label={t("common.delete")} onClick={() => confirm(t("admin.catalog.deleteConfirm")) && run(() => (kind === "author" ? deleteAuthor : deletePublisher)(p.id))}><Trash2 size={14} /></Button>
        </div>
      </Td>
    </tr>
  );
}

export function CatalogManager({ categories, authors, publishers, tab }: { categories: Cat[]; authors: Person[]; publishers: Person[]; tab: "categories" | "authors" | "publishers" }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [nc, setNc] = useState({ name: "", name_bn: "", parent_id: "" });
  const [np, setNp] = useState({ name: "", name_bn: "" });
  const [filter, setFilter] = useState("");

  if (tab === "categories") {
    return (
      <div className="space-y-4">
        <Panel title={t("admin.catalog.addCategory")}>
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveCategory({ name: nc.name, name_bn: nc.name_bn, parent_id: nc.parent_id || null }), { onOk: () => setNc({ name: "", name_bn: "", parent_id: "" }) });
            }}
          >
            <Field label={t("admin.book.titleEn")} htmlFor="nc-name"><Input id="nc-name" required value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} /></Field>
            <Field label={t("admin.book.titleBn")} htmlFor="nc-bn"><Input id="nc-bn" value={nc.name_bn} onChange={(e) => setNc({ ...nc, name_bn: e.target.value })} /></Field>
            <Field label={t("admin.catalog.parent")} htmlFor="nc-parent">
              <Select id="nc-parent" value={nc.parent_id} onChange={(e) => setNc({ ...nc, parent_id: e.target.value })}>
                <option value="">— {t("admin.catalog.topLevel")}</option>
                {categories.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="flex items-end"><Button type="submit" disabled={pending}>{t("common.add")}</Button></div>
          </form>
        </Panel>
        <Panel padded={false}>
          <Table>
            <thead>
              <tr><Th>{t("admin.book.titleEn")}</Th><Th>{t("admin.book.titleBn")}</Th><Th>{t("admin.catalog.parent")}</Th><Th>{t("admin.catalog.order")}</Th><Th>{t("admin.catalog.showOnHome")}</Th><Th>{t("admin.catalog.active")}</Th><Th /></tr>
            </thead>
            <tbody>{categories.map((c) => <CategoryRow key={c.id} c={c} cats={categories} />)}</tbody>
          </Table>
        </Panel>
      </div>
    );
  }
  const kind = tab === "authors" ? "author" : "publisher";
  const list = tab === "authors" ? authors : publishers;
  const shown = filter.trim() ? list.filter((p) => `${p.name} ${p.name_bn ?? ""}`.toLowerCase().includes(filter.trim().toLowerCase())) : list;
  return (
    <div className="space-y-4">
      <Panel title={kind === "author" ? t("admin.catalog.addAuthor") : t("admin.catalog.addPublisher")}>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => (kind === "author" ? createAuthor : createPublisher)({ name: np.name, name_bn: np.name_bn }), { onOk: () => setNp({ name: "", name_bn: "" }) });
          }}
        >
          <Field label={t("admin.book.titleEn")} htmlFor="np-name"><Input id="np-name" required maxLength={120} value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} /></Field>
          <Field label={t("admin.book.titleBn")} hint={t("common.optional")} htmlFor="np-bn"><Input id="np-bn" maxLength={120} value={np.name_bn} onChange={(e) => setNp({ ...np, name_bn: e.target.value })} className="font-bengali" /></Field>
          <div className="flex items-end"><Button type="submit" disabled={pending}>{t("common.add")}</Button></div>
        </form>
      </Panel>
      <Panel padded={false}>
        <div className="border-b p-3">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`${t("admin.catalog.filter")} (${list.length})`} className="h-9 max-w-sm" />
        </div>
        <Table>
          <thead><tr><Th>{t("admin.book.titleEn")}</Th><Th>{t("admin.book.titleBn")}</Th><Th /></tr></thead>
          <tbody>{shown.map((p) => <PersonRow key={p.id} p={p} kind={kind} />)}</tbody>
        </Table>
      </Panel>
    </div>
  );
}
