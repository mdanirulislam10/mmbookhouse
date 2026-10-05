import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/data/session";
import { getMyPartner } from "@/lib/data/partner";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { BookCover } from "@/components/ui/BookCover";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { cn, formatDate } from "@/lib/utils";
import { SubmitBookForm } from "./SubmitBookForm";

export const metadata: Metadata = { title: "My books" };
export const dynamic = "force-dynamic";

const TONE = { pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800" } as const;

export default async function PartnerBooksPage() {
  await requireUser("/partner/books");
  const { t, lang } = await getT();
  const partner = await getMyPartner();

  if (!partner || (partner.status !== "approved" && partner.status !== "suspended")) {
    return (
      <div className="container-page max-w-2xl py-6">
        <h1 className="text-2xl font-bold">{t("partner.books.title")}</h1>
        <p className="card mt-4 p-5">
          {t("partner.notApproved")}{" "}
          <Link href="/partner" className="link">
            {t("partner.nav")}
          </Link>
        </p>
      </div>
    );
  }

  const { data: books } = await (await createClient())
    .from("partner_submissions")
    .select("id, title, title_bn, authors, mrp, supply_price, currency, cover_url, status, admin_note, created_at")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <PartnerShell partner={partner} active="books">
      {partner.status === "approved" ? (
        <>
          <h2 className="text-lg font-semibold">{t("partner.books.new")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("partner.books.lead")}</p>
          <SubmitBookForm defaultPublisher={partner.kind === "publisher" ? partner.name : ""} />
        </>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">{t("partner.books.title")}</h2>
      {books?.length ? (
        <ul className="mt-3 divide-y rounded-lg border bg-white">
          {books.map((b) => (
            <li key={b.id} className="flex gap-3 p-3">
              <div className="w-14 shrink-0">
                <BookCover src={b.cover_url} title={b.title} sizes="56px" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{b.title_bn || b.title}</p>
                <p className="text-slate-600">{b.authors}</p>
                <p className="text-slate-600">
                  MRP ₹{Number(b.mrp)} · {t("partner.book.supplyPrice")}: {b.currency} {Number(b.supply_price)} · {formatDate(b.created_at, lang)}
                </p>
                {b.status === "rejected" && b.admin_note ? <p className="mt-1 text-red-700">{t("partner.reason", { note: b.admin_note })}</p> : null}
              </div>
              <span className={cn("h-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", TONE[b.status as keyof typeof TONE])}>
                {t(`partner.book.status.${b.status as "pending"}`)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-slate-600">{t("partner.books.none")}</p>
      )}
    </PartnerShell>
  );
}
