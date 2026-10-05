import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { getSettings } from "@/lib/data/settings";
import { getCartCount } from "@/lib/data/cart";
import { getSessionUser, getStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { InstallPrompt } from "@/components/layout/Pwa";
import { Wrench } from "lucide-react";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, staff] = await Promise.all([getSettings(), getStaff()]);
  const { t, lang } = await getT();

  // Maintenance mode: everyone but signed-in staff sees the notice.
  if (settings.maintenance.enabled && !staff) {
    const message = pick(lang, settings.maintenance.message, settings.maintenance.message_bn) || t("maintenance.default");
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-brand-navy px-6 text-center text-white">
        <Wrench size={48} className="mb-4 text-brand-amber" />
        <h1 className="text-2xl font-bold">{t("maintenance.title")}</h1>
        <p className="mt-3 max-w-md text-slate-300">{message}</p>
      </main>
    );
  }

  const [cartCount, user] = await Promise.all([getCartCount(), getSessionUser()]);
  const userName = user ? (user.fullName ?? user.email ?? "").split(/[ @]/)[0] || null : null;
  return (
    <>
      <Header />
      <main className="min-h-[60vh] pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav cartCount={cartCount} userName={userName} />
      <InstallPrompt />
    </>
  );
}
