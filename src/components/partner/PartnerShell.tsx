import Link from "next/link";
import { BookOpen, Gauge, Receipt, UserRound } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { MyPartner } from "@/lib/data/partner";

const TABS = [
  { key: "overview", href: "/partner", icon: Gauge, label: "partner.tab.overview" },
  { key: "books", href: "/partner/books", icon: BookOpen, label: "partner.tab.books" },
  { key: "sales", href: "/partner/sales", icon: Receipt, label: "partner.tab.sales" },
  { key: "profile", href: "/partner/profile", icon: UserRound, label: "partner.tab.profile" },
] as const;

/** Frame of the partner panel: partner name, status and tabs. */
export async function PartnerShell({ partner, active, children }: { partner: MyPartner; active: (typeof TABS)[number]["key"]; children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="container-page max-w-5xl py-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">{t("partner.panel")}</h1>
        <span className="text-slate-600">
          {partner.name} · {t(`partner.kind.${partner.kind}`)}
        </span>
      </div>
      {partner.status === "suspended" ? (
        <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t("partner.status.suspended")} {partner.admin_note ? t("partner.reason", { note: partner.admin_note }) : null}
        </p>
      ) : null}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b" aria-label={t("partner.panel")}>
        {TABS.map(({ key, href, icon: Icon, label }) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
              active === key ? "border-brand-navy text-brand-navy" : "border-transparent text-slate-600 hover:text-brand-ink",
            )}
          >
            <Icon size={16} /> {t(label)}
          </Link>
        ))}
      </nav>
      <div className="mt-5">{children}</div>
    </div>
  );
}
