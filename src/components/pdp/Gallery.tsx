"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpenText, ChevronLeft, ChevronRight, X } from "lucide-react";
import { BookCover } from "@/components/ui/BookCover";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function Gallery({ title, images, preview }: { title: string; images: string[]; preview: string[] }) {
  const { t } = useT();
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") setViewer((v) => (v === null ? v : Math.min(v + 1, preview.length - 1)));
      if (e.key === "ArrowLeft") setViewer((v) => (v === null ? v : Math.max(v - 1, 0)));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewer, preview.length]);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="relative flex-1">
        <div className="mx-auto max-w-sm md:max-w-none">
          <BookCover src={images[active] ?? null} title={title} priority sizes="(max-width: 768px) 80vw, 420px" className="bg-white shadow-card" />
        </div>
        {preview.length ? (
          <button
            type="button"
            onClick={() => setViewer(0)}
            className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
          >
            <BookOpenText size={16} /> {t("pdp.lookInside")}
          </button>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto md:flex-col">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1}`}
                aria-current={i === active}
                className={cn("relative block h-16 w-12 overflow-hidden rounded border bg-white", i === active ? "border-brand-amber ring-2 ring-brand-amber/40" : "border-slate-200")}
              >
                <Image src={src} alt="" fill sizes="48px" className="object-contain" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {viewer !== null ? (
        <div className="fixed inset-0 z-[95] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label={t("pdp.lookInside")}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">
              {viewer + 1} / {preview.length}
            </span>
            <button onClick={() => setViewer(null)} aria-label={t("common.close")}>
              <X size={26} />
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={preview[viewer]} alt={`${title} — ${viewer + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <div className="flex items-center justify-center gap-6 py-3 text-white">
            <button onClick={() => setViewer(Math.max(viewer - 1, 0))} disabled={viewer === 0} aria-label={t("common.previous")} className="rounded-full bg-white/15 p-2 disabled:opacity-30">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setViewer(Math.min(viewer + 1, preview.length - 1))} disabled={viewer === preview.length - 1} aria-label={t("common.next")} className="rounded-full bg-white/15 p-2 disabled:opacity-30">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
