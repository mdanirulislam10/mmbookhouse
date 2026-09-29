"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatINR } from "@/lib/utils";

export interface PickedBook {
  id: string;
  title: string;
  title_bn: string | null;
  isbn: string | null;
  cover_url: string | null;
  mrp: number;
  price: number;
  status: string;
  on_hand: number;
}

/** Search-as-you-type book lookup (title, Bengali title, ISBN). */
export function BookPicker({ onPick, placeholder, includeDrafts = false, autoFocus = false }: { onPick: (b: PickedBook) => void; placeholder?: string; includeDrafts?: boolean; autoFocus?: boolean }) {
  const { t, lang } = useT();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickedBook[]>([]);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const mine = ++seq.current;
    const id = window.setTimeout(async () => {
      const res = await fetch(`/api/admin/books/search?q=${encodeURIComponent(q.trim())}${includeDrafts ? "&all=1" : ""}`);
      if (!res.ok || mine !== seq.current) return;
      const json = (await res.json()) as { books: PickedBook[] };
      setItems(json.books);
    }, 200);
    return () => window.clearTimeout(id);
  }, [q, includeDrafts]);

  useEffect(() => {
    const down = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={wrap} className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          // A USB barcode scanner "types" the ISBN and presses Enter: pick the single match.
          if (e.key === "Enter" && items.length >= 1) {
            e.preventDefault();
            onPick(items[0]);
            setQ("");
            setItems([]);
          }
        }}
        placeholder={placeholder ?? t("admin.pickBook")}
        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber/30"
      />
      {open && items.length ? (
        <ul className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-white shadow-pop">
          {items.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-amber-50"
                onClick={() => {
                  onPick(b);
                  setQ("");
                  setItems([]);
                  setOpen(false);
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{lang === "bn" && b.title_bn ? b.title_bn : b.title}</span>
                  <span className="block truncate text-xs text-slate-500">{b.isbn ?? "—"}</span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className="block font-semibold">{formatINR(b.price)}</span>
                  <span className={b.on_hand === 0 ? "text-red-600" : "text-slate-500"}>×{b.on_hand}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
