import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { first } from "@/lib/utils";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getStaff()) redirect("/admin");
  const { t } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-white">
        <ShieldCheck className="text-brand-amber" size={30} />
        <div className="leading-none">
          <p className="text-xl font-extrabold">{t("admin.brand")}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-brand-gold">{t("admin.loginSub")}</p>
        </div>
      </div>
      <div className="w-full max-w-md">
        {first(sp.expired) ? <p className="mb-3 rounded-md bg-amber-100 px-4 py-2 text-sm text-amber-900">{t("admin.sessionExpired")}</p> : null}
        <LoginForm next="/admin" initialMode="signin" linkError={first(sp.error) === "link"} allowSignUp={false} googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true"} />
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/" className="hover:text-white">
            ← {t("admin.backToStore")}
          </Link>
        </p>
      </div>
    </div>
  );
}
