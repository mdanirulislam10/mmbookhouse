"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface PersonOption {
  name: string;
  name_bn: string | null;
}

interface Common {
  id: string;
  options: PersonOption[];
  placeholder?: string;
  maxItems?: number;
}

/**
 * Pick from the saved list (authors / publishers) or type a new name.
 * `multi` keeps a set of chips (authors); single keeps one name (publisher).
 */
export function PersonPicker(props: Common & ({ multi: true; value: string[]; onChange: (v: string[]) => void } | { multi?: false; value: string; onChange: (v: string) => void })) {
  const { t } = useT();
  const { id, options, placeholder, maxItems = 10 } = props;
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(props.multi ? "" : props.value);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  // Keep the visible text in step when the form is loaded or reset from outside.
  useEffect(() => {
    if (!props.multi) setText(props.value);
  }, [props.multi, props.multi ? null : props.value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = props.multi ? props.value : props.value ? [props.value] : [];
  const has = (name: string) => selected.some((s) => s.toLowerCase() === name.toLowerCase());
  const q = text.trim().toLowerCase();

  const matches = useMemo(() => {
    const pool = options.filter((o) => !props.multi || !has(o.name));
    const list = q ? pool.filter((o) => `${o.name} ${o.name_bn ?? ""}`.toLowerCase().includes(q)) : pool;
    return list.slice(0, 60);
  }, [options, q, props.multi, props.multi ? props.value : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const exact = options.some((o) => o.name.toLowerCase() === q || (o.name_bn ?? "").toLowerCase() === q);
  const canAddNew = q.length > 0 && !exact && !has(text.trim());
  const rows: { key: string; name: string; sub?: string | null; isNew?: boolean }[] = [
    ...(canAddNew ? [{ key: "new", name: text.trim(), isNew: true }] : []),
    ...matches.map((o) => ({ key: o.name, name: o.name, sub: o.name_bn })),
  ];

  // Enter picks the best match when there is one; the "add as new" row stays one arrow-key away.
  const active = Math.min(picked ?? (canAddNew && matches.length ? 1 : 0), Math.max(rows.length - 1, 0));

  const choose = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (props.multi) {
      if (!has(clean) && props.value.length < maxItems) props.onChange([...props.value, clean]);
      setText("");
      setPicked(null);
    } else {
      props.onChange(clean);
      setText(clean);
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <div className={cn("flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white p-1.5 focus-within:border-brand-amber focus-within:ring-2 focus-within:ring-brand-amber/30")}>
        {props.multi
          ? props.value.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-sm">
                {a}
                <button type="button" aria-label={t("common.delete")} onClick={() => props.onChange(props.value.filter((x) => x !== a))}>
                  <X size={12} />
                </button>
              </span>
            ))
          : null}
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? t("admin.pick.searchOrAdd")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setPicked(null);
            if (!props.multi) props.onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setPicked(Math.min(active + 1, rows.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setPicked(Math.max(active - 1, 0));
            } else if (e.key === "Enter" || (props.multi && e.key === ",")) {
              e.preventDefault();
              const row = open ? rows[active] : undefined;
              choose(row ? row.name : text);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Backspace" && props.multi && !text && props.value.length) {
              props.onChange(props.value.slice(0, -1));
            }
          }}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none"
          maxLength={120}
        />
        {!props.multi && props.value ? (
          <button type="button" aria-label={t("admin.pick.clear")} className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => { props.onChange(""); setText(""); setOpen(true); }}>
            <X size={14} />
          </button>
        ) : null}
        <button type="button" tabIndex={-1} aria-label="▾" className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => setOpen((o) => !o)}>
          <ChevronDown size={16} className={cn("transition", open && "rotate-180")} />
        </button>
      </div>

      {open ? (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-md border bg-white py-1 text-sm shadow-pop">
          {rows.length === 0 ? <li className="px-3 py-2 text-slate-500">{t("admin.pick.noMatch")}</li> : null}
          {rows.map((r, i) => (
            <li
              key={r.key}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r.name)}
              onMouseEnter={() => setPicked(i)}
              className={cn("cursor-pointer px-3 py-2", i === active ? "bg-amber-50" : "", r.isNew ? "font-medium text-brand-tealHover" : "")}
            >
              {r.isNew ? (
                t("admin.pick.addNew", { name: r.name })
              ) : (
                <>
                  {r.name}
                  {r.sub ? <span className="ml-2 font-bengali text-slate-500">{r.sub}</span> : null}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
