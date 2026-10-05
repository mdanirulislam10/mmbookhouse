import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { first } from "@/lib/utils";
import { LoginForm } from "../../login/LoginForm";

export const metadata: Metadata = { title: "Partner sign in", robots: { index: false } };

/** Sign-in for publishers, authors and suppliers; lands on the partner panel. */
export default async function PartnerLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getSessionUser()) redirect("/partner");
  const { t } = await getT();
  return (
    <>
      <LoginForm
        next="/partner"
        initialMode={first(sp.mode) === "signup" ? "signup" : "signin"}
        linkError={first(sp.error) === "link"}
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true"}
        heading={t("partner.login.title")}
        intro={t("partner.login.intro")}
      />
      <p className="mt-4 text-center text-sm text-slate-600">
        <Link href="/login" className="link">
          {t("partner.login.customer")}
        </Link>
      </p>
    </>
  );
}
