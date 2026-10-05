import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Package, Heart, Handshake } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getProfile, requireUser } from "@/lib/data/session";
import { getMyOrders } from "@/lib/data/account";
import { getMyPartner } from "@/lib/data/partner";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfileForm } from "@/components/account/ProfileForm";
import { NotifyPrefs } from "@/components/account/NotifyPrefs";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/orders/StatusBadge";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const { t, lang } = await getT();
  const [profile, orders, authUser, partner] = await Promise.all([getProfile(), getMyOrders(3), createClient().then((c) => c.auth.getUser()), getMyPartner()]);
  const nm = ((authUser.data.user?.user_metadata?.notify ?? {}) as Partial<{ email: boolean; sms: boolean; whatsapp: boolean }>);
  const prefs = { email: nm.email ?? true, sms: nm.sms ?? true, whatsapp: nm.whatsapp ?? true };

  const cards = [
    ...(partner ? [{ href: "/partner", icon: Handshake, title: t("partner.panel"), text: t(`partner.status.${partner.status}`) }] : []),
    { href: "/account/orders", icon: Package, title: t("account.orders"), text: t("account.ordersText") },
    { href: "/account/addresses", icon: MapPin, title: t("account.addresses"), text: t("account.addressesText") },
    { href: "/account/wishlist", icon: Heart, title: t("account.wishlist"), text: t("account.wishlistText") },
  ];

  return (
    <AccountShell active="overview" title={t("account.title")}>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="card flex items-center gap-4 p-4 transition hover:shadow-pop">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon size={22} />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="text-sm text-slate-500">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-1 text-lg font-bold">{t("account.profile")}</h2>
          <p className="mb-4 text-sm text-slate-500">{t("account.profileText")}</p>
          {!user.emailConfirmed ? <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("account.emailUnverified")}</p> : null}
          <ProfileForm fullName={profile?.full_name ?? user.fullName ?? ""} phone={profile?.phone ?? ""} email={user.email ?? ""} />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t("account.notifyTitle")}</h2>
          <NotifyPrefs initial={prefs} />
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{t("account.recentOrders")}</h2>
            <Link href="/account/orders" className="link text-sm">{t("common.viewAll")}</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">{t("order.emptyText")}</p>
          ) : (
            <ul className="divide-y">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <span>
                      <span className="block font-medium">{o.order_no}</span>
                      <span className="text-xs text-slate-500">{formatDate(o.placed_at, lang)} · {formatINR(o.total)}</span>
                    </span>
                    <OrderStatusBadge status={o.status} t={t} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AccountShell>
  );
}
