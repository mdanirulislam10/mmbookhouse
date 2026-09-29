import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Lang } from "@/lib/i18n";

export function Logo({ lang, dark = true }: { lang: Lang; dark?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded px-1 py-1 hover:outline hover:outline-1 hover:outline-white/70" aria-label="mmbookhouse">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-amber text-brand-ink">
        <BookOpen size={22} strokeWidth={2.4} />
      </span>
      <span className="hidden flex-col leading-none min-[400px]:flex">
        <span className={`text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-brand-ink"}`}>
          {lang === "bn" ? "এম এম বুক হাউস" : "mmbookhouse"}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-gold">{lang === "bn" ? "অনলাইন বই" : "Online Books"}</span>
      </span>
    </Link>
  );
}
