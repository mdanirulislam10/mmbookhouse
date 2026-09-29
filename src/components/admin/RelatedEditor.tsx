"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { setRelatedBooks } from "@/app/admin/actions/books";
import { BookPicker } from "@/components/admin/BookPicker";
import { useRun } from "@/components/admin/useRun";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export function RelatedEditor({ bookId, initial }: { bookId: string; initial: { id: string; title: string }[] }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [items, setItems] = useState(initial);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{t("admin.related.help")}</p>
      <ul className="space-y-1.5">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded border bg-slate-50 px-3 py-1.5 text-sm">
            <span className="truncate">{r.title}</span>
            <button type="button" aria-label={t("common.delete")} onClick={() => setItems(items.filter((x) => x.id !== r.id))}><X size={14} /></button>
          </li>
        ))}
      </ul>
      {items.length < 3 ? <BookPicker placeholder={t("admin.related.add")} onPick={(b) => !items.some((x) => x.id === b.id) && b.id !== bookId && setItems([...items, { id: b.id, title: b.title }])} /> : null}
      <Button size="sm" disabled={pending} onClick={() => run(() => setRelatedBooks(bookId, items.map((i) => i.id)))}>{t("common.save")}</Button>
    </div>
  );
}
