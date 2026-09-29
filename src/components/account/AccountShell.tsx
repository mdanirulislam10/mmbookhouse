import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function AccountShell({ active, title, children }: { active: "overview" | "orders" | "addresses" | "wishlist"; title: string; children: React.ReactNode }) {
  const { t } = await getT();
  const tabs = [
    { key: "overview", href: "/account", label: t("account.title") },
    { key: "orders", href: "/account/orders", label: t("account.orders") },
    { key: "addresses", href: "/account/addresses", label: t("account.addresses") },
    { key: "wishlist", href: "/account/wishlist", label: t("account.wishlist") },
  ] as const;
  return (
    <div className="container-page py-4">
      <nav aria-label="Account" className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={cn("whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium", tab.key === active ? "border-brand-amber text-brand-ink" : "border-transparent text-slate-500 hover:text-brand-ink")}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
