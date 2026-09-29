import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/data/settings";
import { pick } from "@/lib/i18n";

export async function Footer() {
  const { t, lang } = await getT();
  const s = (await getSettings()).store_profile;
  const col = "space-y-2 text-sm text-slate-300";
  const head = "mb-3 text-sm font-semibold text-white";
  return (
    <footer className="no-print mt-12 bg-brand-slate text-slate-300">
      <a href="#top" className="block bg-[#37475a] py-3 text-center text-sm font-medium text-white hover:bg-[#485769]">
        {t("footer.backToTop")}
      </a>
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className={head}>{t("footer.about")}</h2>
          <p className="text-sm leading-relaxed">{t("footer.aboutText")}</p>
        </div>
        <div>
          <h2 className={head}>{t("footer.shop")}</h2>
          <ul className={col}>
            <li><Link className="hover:text-white hover:underline" href="/deals">{t("nav.deals")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/bestsellers">{t("nav.bestsellers")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/new-arrivals">{t("nav.newArrivals")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/bulk-order">{t("nav.bulkOrders")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={head}>{t("footer.help")}</h2>
          <ul className={col}>
            <li><Link className="hover:text-white hover:underline" href="/account/orders">{t("nav.orders")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/track">{t("nav.trackOrder")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/support">{t("nav.support")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/privacy">{t("footer.privacy")}</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/terms">{t("footer.terms")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={head}>{t("footer.contact")}</h2>
          <ul className={col}>
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> <span>{pick(lang, s.address, s.address_bn)}</span></li>
            {s.phone ? <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" /> <a href={`tel:${s.phone}`} className="hover:text-white">{s.phone}</a></li> : null}
            {s.email ? <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" /> <a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a></li> : null}
            {s.hours ? <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0" /> <span>{t("footer.hours")}: {s.hours}</span></li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 bg-brand-navy py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {pick(lang, s.name, s.name_bn)}. {t("footer.rights")}
      </div>
    </footer>
  );
}
