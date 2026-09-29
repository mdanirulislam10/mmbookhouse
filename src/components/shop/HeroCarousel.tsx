"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { pick } from "@/lib/i18n";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const { lang, t } = useT();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = banners.length;

  const go = useCallback((next: number) => setI(((next % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const id = window.setInterval(() => setI((cur) => (cur + 1) % n), 5500);
    return () => window.clearInterval(id);
  }, [n, paused]);

  if (!n) return null;

  return (
    <section
      className="relative overflow-hidden rounded-none sm:rounded-xl"
      aria-roledescription="carousel"
      aria-label="Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => {
          const title = pick(lang, b.title, b.title_bn);
          const sub = pick(lang, b.subtitle, b.subtitle_bn);
          const cta = pick(lang, b.cta_label, b.cta_label_bn);
          const body = (
            <div
              className="relative flex min-h-[200px] w-full items-center sm:min-h-[280px] lg:min-h-[340px]"
              style={{ background: b.bg_color ?? "linear-gradient(120deg,#131921,#2b3a4d)" }}
            >
              {b.image_url ? (
                <Image src={b.image_url} alt="" fill priority={idx === 0} sizes="100vw" className="object-cover opacity-70" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="relative z-10 max-w-2xl px-6 py-8 text-white sm:px-12">
                <h2 className="text-2xl font-extrabold leading-tight drop-shadow sm:text-4xl">{title}</h2>
                {sub ? <p className="mt-2 text-sm text-slate-100 sm:text-lg">{sub}</p> : null}
                {cta ? <span className="mt-4 inline-block rounded-full bg-brand-amber px-5 py-2 text-sm font-semibold text-brand-ink">{cta}</span> : null}
              </div>
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${idx + 1} / ${n}`} aria-hidden={idx !== i}>
              {b.link_url ? (
                <Link href={b.link_url} tabIndex={idx === i ? 0 : -1}>
                  {body}
                </Link>
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>

      {n > 1 ? (
        <>
          <button onClick={() => go(i - 1)} aria-label={t("common.previous")} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white sm:block">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => go(i + 1)} aria-label={t("common.next")} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white sm:block">
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, idx) => (
              <button key={b.id} onClick={() => go(idx)} aria-label={`${idx + 1}`} aria-current={idx === i} className={cn("h-2 rounded-full transition-all", idx === i ? "w-6 bg-brand-amber" : "w-2 bg-white/70")} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
