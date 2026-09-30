"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User, Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** `userName` is the signed-in customer's first name (or e-mail prefix); null when nobody is signed in. */
export function MobileNav({ cartCount, userName = null }: { cartCount: number; userName?: string | null }) {
  const { t } = useT();
  const path = usePathname();
  const items = [
    { href: "/", icon: Home, label: t("nav.home"), match: (p: string) => p === "/" },
    { href: "/search", icon: Search, label: t("common.search"), match: (p: string) => p.startsWith("/search") },
    { href: "/deals", icon: LayoutGrid, label: t("nav.deals"), match: (p: string) => p.startsWith("/deals") || p.startsWith("/category") },
    { href: "/cart", icon: ShoppingCart, label: t("nav.cart"), match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout"), badge: cartCount },
    { href: userName ? "/account" : "/login", icon: User, label: userName ?? t("nav.signIn"), match: (p: string) => p.startsWith("/account") || p.startsWith("/login"), initial: userName ? userName.trim().charAt(0).toUpperCase() : undefined },
  ];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,.06)] md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label, match, badge, initial }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link href={href} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]", active ? "font-semibold text-brand-tealHover" : "text-slate-600")}>
                <span className="relative">
                  {initial ? (
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-amber text-xs font-bold text-brand-ink ring-2 ring-emerald-500">{initial}</span>
                  ) : (
                    <Icon size={22} />
                  )}
                  {badge ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-brand-amber px-1 text-center text-[10px] font-bold leading-4 text-brand-ink">{badge > 99 ? "99+" : badge}</span>
                  ) : null}
                </span>
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
