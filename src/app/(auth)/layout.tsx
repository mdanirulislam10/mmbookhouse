import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-8 sm:bg-brand-sky/40">
      <Link href="/" className="mb-6 flex items-center gap-2" aria-label={t("brand.name")}>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-brand-amber">
          <BookOpen size={24} strokeWidth={2.4} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight">{t("brand.name")}</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-amberHover">{t("brand.sub")}</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
