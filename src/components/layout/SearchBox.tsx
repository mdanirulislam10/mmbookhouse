"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Tag, User } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatINR } from "@/lib/utils";

interface Suggestion {
  type: "book" | "author" | "category";
  label: string;
  sub?: string;
  href: string;
  image?: string | null;
  price?: number;
}

export function SearchBox({ initial = "" }: { initial?: string }) {
  const { t } = useT();
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLFormElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const mine = ++seq.current;
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`);
        const json = (await res.json()) as { suggestions: Suggestion[] };
        if (mine === seq.current) {
          setItems(json.suggestions ?? []);
          setActive(-1);
        }
      } catch {
        if (mine === seq.current) setItems([]);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    const term = q.trim();
    if (term) go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const Icon = { book: BookOpen, author: User, category: Tag } as const;

  return (
    <form ref={wrapRef} onSubmit={submit} role="search" className="relative flex-1" autoComplete="off">
      <div className="flex h-10 overflow-hidden rounded-md bg-white ring-2 ring-transparent focus-within:ring-brand-amber">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={t("search.placeholder")}
          aria-label={t("common.search")}
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-brand-ink outline-none placeholder:text-slate-400"
        />
        <button type="submit" aria-label={t("common.search")} className="flex w-11 items-center justify-center bg-brand-gold text-brand-ink hover:bg-amber-400">
          <Search size={20} />
        </button>
      </div>

      {open && q.trim().length >= 2 ? (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white text-brand-ink shadow-pop">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{busy ? t("common.loading") : t("search.noSuggestions")}</p>
          ) : (
            <>
              <ul>
                {items.map((s, i) => {
                  const I = Icon[s.type];
                  return (
                    <li key={s.type + s.href + i} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(s.href)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${i === active ? "bg-amber-50" : ""}`}
                      >
                        <I size={16} className="shrink-0 text-slate-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{s.label}</span>
                          {s.sub ? <span className="block truncate text-xs text-slate-500">{s.sub}</span> : null}
                        </span>
                        {s.price ? <span className="shrink-0 text-xs font-semibold text-price">{formatINR(s.price)}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="submit"
                className="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-brand-teal hover:underline"
              >
                <Search size={14} /> {t("search.seeAll", { q: q.trim() })}
              </button>
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}
