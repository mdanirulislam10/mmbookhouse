"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function PrintBar({ count }: { count: number }) {
  const { t } = useT();
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="print-bar sticky top-0 z-10 flex items-center justify-between bg-brand-navy px-4 py-2 text-white">
      <span className="text-sm">{t("admin.print.count", { n: count })}</span>
      <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-brand-amber px-4 py-1.5 text-sm font-semibold text-brand-ink">
        <Printer size={16} /> {t("admin.print.now")}
      </button>
    </div>
  );
}
