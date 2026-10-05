"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Bell, BookOpen, Boxes, ClipboardList, Gauge, History, LogOut, Megaphone, Menu, MessageSquare, Package, Settings, ShieldCheck, Store, Tags, Users, UserCog, X, DatabaseBackup, Inbox, Handshake,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n";
import type { Area } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

const NAV: { area: Area; href: string; label: DictKey; icon: React.ComponentType<{ size?: number }>; exact?: boolean }[] = [
  { area: "dashboard", href: "/admin", label: "admin.nav.dashboard", icon: Gauge, exact: true },
  { area: "orders", href: "/admin/orders", label: "admin.nav.orders", icon: ClipboardList },
  { area: "books", href: "/admin/books", label: "admin.nav.books", icon: BookOpen },
  { area: "inventory", href: "/admin/inventory", label: "admin.nav.inventory", icon: Boxes },
  { area: "catalog", href: "/admin/catalog", label: "admin.nav.catalog", icon: Tags },
  { area: "marketing", href: "/admin/marketing", label: "admin.nav.marketing", icon: Megaphone },
  { area: "reviews", href: "/admin/reviews", label: "admin.nav.reviews", icon: MessageSquare },
  { area: "enquiries", href: "/admin/enquiries", label: "admin.nav.enquiries", icon: Inbox },
  { area: "partners", href: "/admin/partners", label: "admin.nav.partners", icon: Handshake },
  { area: "customers", href: "/admin/customers", label: "admin.nav.customers", icon: Users },
  { area: "reports", href: "/admin/reports", label: "admin.nav.reports", icon: BarChart3 },
  { area: "settings", href: "/admin/settings", label: "admin.nav.settings", icon: Settings },
  { area: "settings", href: "/admin/notifications", label: "admin.nav.notifications", icon: Bell },
  { area: "staff", href: "/admin/staff", label: "admin.nav.staff", icon: UserCog },
  { area: "backups", href: "/admin/backups", label: "admin.nav.backups", icon: DatabaseBackup },
  { area: "audit", href: "/admin/audit", label: "admin.nav.audit", icon: History },
];

export function AdminShell({
  allowed,
  userName,
  roleLabel,
  children,
  counters,
}: {
  allowed: Area[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
  counters: { pendingOrders: number; verifyPayments: number; lowStock: number; enquiries: number; reviews: number };
}) {
  const { t, lang } = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const badge = (area: Area) =>
    area === "orders" ? counters.pendingOrders + counters.verifyPayments : area === "inventory" ? counters.lowStock : area === "enquiries" ? counters.enquiries : area === "reviews" ? counters.reviews : 0;

  const items = NAV.filter((n) => allowed.includes(n.area));

  const sidebar = (
    <nav className="flex h-full flex-col bg-brand-navy text-slate-300">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4 text-white">
        <ShieldCheck className="text-brand-amber" size={22} />
        <span className="font-bold">{t("admin.brand")}</span>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map(({ href, label, icon: Icon, area, exact }) => {
          const active = exact ? path === href : path === href || path.startsWith(href + "/");
          const b = badge(area);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition", active ? "bg-white/10 font-semibold text-white" : "hover:bg-white/5 hover:text-white")}
              >
                <Icon size={18} />
                <span className="flex-1">{t(label)}</span>
                {b > 0 ? <span className="rounded-full bg-brand-amber px-1.5 text-xs font-bold text-brand-ink">{b}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-white/10 p-2 text-sm">
        <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">
          <Store size={18} /> {t("admin.viewStore")}
        </Link>
        <form action="/auth/signout?next=/admin/login" method="post">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-white/5 hover:text-white">
            <LogOut size={18} /> {t("nav.signOut")}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">{sidebar}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fadeIn">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-3 sm:px-5">
          <button className="rounded p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Package size={18} className="hidden text-slate-400 sm:block" />
          <div className="min-w-0 flex-1 truncate text-sm text-slate-500">
            {counters.verifyPayments > 0 ? (
              <Link href="/admin/orders?tab=verify" className="font-medium text-amber-700 hover:underline">
                {t("admin.paymentsWaiting", { n: counters.verifyPayments })}
              </Link>
            ) : (
              <span>{t("admin.welcome", { name: userName })}</span>
            )}
          </div>
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium sm:inline">{roleLabel}</span>
          <form action={async () => {}} className="hidden" />
          <LangToggle lang={lang} />
        </header>
        <main className="p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}

function LangToggle({ lang }: { lang: "bn" | "en" }) {
  // Plain client-side cookie switch so it works without a server action inside this shell.
  return (
    <button
      className="rounded border border-slate-300 px-2.5 py-1 text-sm font-medium hover:bg-slate-50"
      onClick={() => {
        document.cookie = `mm_lang=${lang === "bn" ? "en" : "bn"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        window.location.reload();
      }}
    >
      {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}
