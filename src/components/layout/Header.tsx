import Link from "next/link";
import { ShoppingCart, Heart, ChevronDown, LogOut, Package, User, MapPin, LayoutDashboard, Handshake } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/data/settings";
import { getCategoryTree } from "@/lib/data/catalog";
import { getCartCount } from "@/lib/data/cart";
import { getSessionUser, getStaff } from "@/lib/data/session";
import { setLang } from "@/app/actions/lang";
import { SearchBox } from "./SearchBox";
import { CategoryMenu } from "./CategoryMenu";
import { PincodeBadge } from "./PincodeBadge";
import { Logo } from "./Logo";
import { getMyPartner } from "@/lib/data/partner";
import { greetingKey } from "@/lib/i18n/greeting";
import { pick } from "@/lib/i18n";

export async function Header() {
  const { t, lang } = await getT();
  const [settings, tree, cartCount, user, staff, partner] = await Promise.all([getSettings(), getCategoryTree(), getCartCount(), getSessionUser(), getStaff(), getMyPartner()]);
  const greet = t(greetingKey());
  const notice = settings.notice_bar;
  const noticeText = pick(lang, notice.text, notice.text_bn);
  const firstName = (user?.fullName ?? user?.email ?? "").split(/[ @]/)[0];

  return (
    <header className="no-print sticky top-0 z-50 text-white">
      {notice.enabled && noticeText ? (
        <div className="bg-brand-amber px-3 py-1.5 text-center text-xs font-medium text-brand-ink sm:text-sm">
          {notice.href ? (
            <Link href={notice.href} className="hover:underline">
              {noticeText}
            </Link>
          ) : (
            noticeText
          )}
        </div>
      ) : null}

      <div className="bg-brand-navy">
        <div className="container-page flex items-center gap-2 py-2 sm:gap-3">
          <div className="md:hidden">
            <CategoryMenu tree={tree} variant="icon" />
          </div>
          <Logo lang={lang} />
          <PincodeBadge defaultPin={settings.store_profile.pincode} />

          <div className="hidden min-w-0 flex-1 md:flex">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <form action={setLang}>
              <input type="hidden" name="lang" value={lang === "bn" ? "en" : "bn"} />
              <button className="rounded px-2 py-1 text-sm font-medium hover:outline hover:outline-1 hover:outline-white/70" title={t("lang.switch")}>
                {t("lang.switch")}
              </button>
            </form>

            <div className="group relative hidden md:block">
              <Link href={user ? "/account" : "/login"} className="flex flex-col rounded px-2 py-1 text-left text-xs leading-tight hover:outline hover:outline-1 hover:outline-white/70">
                <span className="text-slate-300">{user ? t("nav.hello", { greet, name: firstName }) : t("nav.helloGuest", { greet })}</span>
                <span className="flex items-center gap-0.5 text-sm font-semibold">
                  {t("nav.accountLists")} <ChevronDown size={14} />
                </span>
              </Link>
              <div className="invisible absolute right-0 top-full w-64 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="rounded-lg bg-white p-2 text-sm text-brand-ink shadow-pop">
                  {user ? (
                    <>
                      <MenuLink href="/account" icon={<User size={16} />} label={t("nav.account")} />
                      <MenuLink href="/account/orders" icon={<Package size={16} />} label={t("nav.orders")} />
                      <MenuLink href="/account/wishlist" icon={<Heart size={16} />} label={t("nav.wishlist")} />
                      <MenuLink href="/account/addresses" icon={<MapPin size={16} />} label={t("account.addresses")} />
                      {partner ? <MenuLink href="/partner" icon={<Handshake size={16} />} label={t("partner.panel")} /> : null}
                      {staff ? <MenuLink href="/admin" icon={<LayoutDashboard size={16} />} label={t("nav.adminPanel")} /> : null}
                      <form action="/auth/signout" method="post" className="mt-1 border-t pt-1">
                        <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-100">
                          <LogOut size={16} /> {t("nav.signOut")}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block rounded-full bg-brand-gold px-4 py-2 text-center font-medium hover:bg-amber-400">
                        {t("nav.signIn")}
                      </Link>
                      <p className="mt-2 px-1 text-center text-xs text-slate-500">
                        <Link href="/login?mode=signup" className="link">
                          {t("auth.createAccount")}
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Link href="/account/orders" className="hidden rounded px-2 py-1 text-left text-xs leading-tight hover:outline hover:outline-1 hover:outline-white/70 lg:block">
              <span className="block text-slate-300">{t("nav.returnsOrders").split(" & ")[0]}</span>
              <span className="text-sm font-semibold">{t("nav.orders")}</span>
            </Link>

            <Link href="/cart" className="relative flex items-center gap-1 rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white/70" aria-label={`${t("nav.cart")} (${cartCount})`}>
              <span className="relative">
                <ShoppingCart size={28} />
                <span className="absolute -top-2 left-3 min-w-5 rounded-full bg-brand-amber px-1 text-center text-xs font-bold leading-5 text-brand-ink">{cartCount}</span>
              </span>
              <span className="hidden text-sm font-semibold sm:inline">{t("nav.cart")}</span>
            </Link>
          </div>
        </div>

        <div className="container-page pb-2 md:hidden">
          <SearchBox />
        </div>
      </div>

      <nav className="hidden bg-brand-slate md:block" aria-label="Categories">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-1 text-sm [scrollbar-width:none]">
          <CategoryMenu tree={tree} />
          {[
            { href: "/deals", label: t("nav.deals") },
            { href: "/bestsellers", label: t("nav.bestsellers") },
            { href: "/new-arrivals", label: t("nav.newArrivals") },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white/70">
              {l.label}
            </Link>
          ))}
          {tree.slice(0, 8).map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="whitespace-nowrap rounded px-2 py-1 hover:outline hover:outline-1 hover:outline-white/70">
              {pick(lang, c.name, c.name_bn)}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-100">
      {icon} {label}
    </Link>
  );
}
