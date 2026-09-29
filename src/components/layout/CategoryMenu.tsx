"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { pick } from "@/lib/i18n";
import type { CategoryNode } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "All" button + slide-in drawer with the full category tree. */
export function CategoryMenu({ tree, variant = "bar" }: { tree: CategoryNode[]; variant?: "bar" | "icon" }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);
  const label = (c: { name: string; name_bn: string | null }) => pick(lang, c.name, c.name_bn);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1 font-medium hover:outline hover:outline-1 hover:outline-white/70",
          variant === "bar" ? "text-sm text-white" : "text-white",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Menu size={20} />
        {variant === "bar" ? t("nav.allCategories") : <span className="sr-only">{t("nav.categories")}</span>}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("nav.categories")}>
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm animate-fadeIn flex-col bg-white text-brand-ink shadow-pop">
            <div className="flex h-12 items-center justify-between bg-brand-slate px-4 text-white">
              <span className="font-semibold">{t("nav.categories")}</span>
              <button onClick={close} aria-label={t("common.close")}>
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              <ul>
                {[
                  { href: "/deals", label: t("nav.deals") },
                  { href: "/bestsellers", label: t("nav.bestsellers") },
                  { href: "/new-arrivals", label: t("nav.newArrivals") },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className="block px-5 py-2.5 text-sm font-medium hover:bg-slate-100">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <ul>
                {tree.map((c) => {
                  const isOpen = expanded === c.id;
                  return (
                    <li key={c.id}>
                      <div className="flex items-center">
                        <Link href={`/category/${c.slug}`} onClick={close} className="flex-1 px-5 py-2.5 text-sm font-medium hover:bg-slate-100">
                          {label(c)}
                        </Link>
                        {c.children.length ? (
                          <button
                            onClick={() => setExpanded(isOpen ? null : c.id)}
                            aria-label={label(c)}
                            aria-expanded={isOpen}
                            className="px-4 py-2.5 text-slate-500 hover:bg-slate-100"
                          >
                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        ) : null}
                      </div>
                      {isOpen ? (
                        <ul className="bg-slate-50 py-1">
                          {c.children.map((s) => (
                            <li key={s.id}>
                              <Link href={`/category/${s.slug}`} onClick={close} className="block px-9 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                {label(s)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
