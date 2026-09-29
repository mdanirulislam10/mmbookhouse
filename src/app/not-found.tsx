import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { buttonClass } from "@/components/ui/Button";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-extrabold text-brand-amber">404</p>
      <h1 className="mt-3 text-2xl font-bold">{t("notfound.title")}</h1>
      <p className="mt-2 max-w-md text-slate-600">{t("notfound.text")}</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-6")}>
        {t("notfound.home")}
      </Link>
    </main>
  );
}
