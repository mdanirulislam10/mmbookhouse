"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Phone filter panel: a bottom sheet that always fits the screen (never runs off the left edge). */
export function FilterSheet({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams().toString();

  // Applying a filter navigates; close the sheet once the new results are in.
  useEffect(() => setOpen(false), [pathname, params]);
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

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className="relative flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm">
        <SlidersHorizontal size={14} /> {t("list.filters")}
        {active ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-amber" /> : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("list.filters")}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-pop">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("list.filters")}</h2>
              <button type="button" aria-label={t("common.close")} className="rounded-full p-2 hover:bg-slate-100" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
