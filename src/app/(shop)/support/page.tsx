import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/data/settings";
import { pick } from "@/lib/i18n";

export const metadata: Metadata = { title: "Help & support" };

const FAQ: { q: { en: string; bn: string }; a: { en: string; bn: string } }[] = [
  {
    q: { en: "How long does delivery take?", bn: "ডেলিভারিতে কতদিন লাগে?" },
    a: {
      en: "Nearby areas: 1–2 days, West Bengal: 2–4 days, rest of India: 4–8 days. You can see the estimate for your pincode on every book page.",
      bn: "কাছাকাছি এলাকায় ১–২ দিন, পশ্চিমবঙ্গে ২–৪ দিন, ভারতের অন্যান্য জায়গায় ৪–৮ দিন। প্রতিটি বইয়ের পাতায় আপনার পিনকোডের আনুমানিক সময় দেখতে পাবেন।",
    },
  },
  {
    q: { en: "Can I collect my order from the store?", bn: "দোকান থেকে কি অর্ডার সংগ্রহ করা যায়?" },
    a: {
      en: "Yes. Choose “Pick up from store” at checkout, then show your 4-digit pickup code at the counter. It is free.",
      bn: "হ্যাঁ। চেকআউটে “দোকান থেকে সংগ্রহ” বাছুন, তারপর কাউন্টারে ৪ সংখ্যার পিকআপ কোড দেখান। এটি বিনামূল্যে।",
    },
  },
  {
    q: { en: "How does UPI payment work?", bn: "UPI পেমেন্ট কীভাবে কাজ করে?" },
    a: {
      en: "Pay the exact amount to our UPI ID or scan the QR, then enter the UTR (transaction reference) on the order page. We verify it and confirm your order.",
      bn: "আমাদের UPI ID-তে সঠিক টাকা পাঠান বা QR স্ক্যান করুন, তারপর অর্ডার পাতায় UTR (লেনদেনের রেফারেন্স) দিন। আমরা যাচাই করে অর্ডার নিশ্চিত করব।",
    },
  },
  {
    q: { en: "Can I cancel an order?", bn: "অর্ডার কি বাতিল করা যায়?" },
    a: {
      en: "You can cancel from the order page until we start packing it. After that, please contact us.",
      bn: "প্যাকিং শুরুর আগে পর্যন্ত অর্ডার পাতা থেকে বাতিল করা যায়। তারপর আমাদের সাথে যোগাযোগ করুন।",
    },
  },
];

export default async function SupportPage() {
  const { t, lang } = await getT();
  const s = (await getSettings()).store_profile;
  const wa = s.whatsapp.replace(/\D/g, "");
  return (
    <div className="container-page max-w-3xl py-6">
      <h1 className="text-2xl font-bold">{t("support.title")}</h1>
      <p className="mt-1 text-slate-600">{t("support.text")}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="card flex gap-3 p-4">
          <MapPin className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">{t("support.visit")}</p>
            <p className="text-sm text-slate-600">{pick(lang, s.address, s.address_bn)}</p>
            {s.hours ? <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> {s.hours}</p> : null}
          </div>
        </div>
        {s.phone ? (
          <a href={`tel:${s.phone}`} className="card flex gap-3 p-4 hover:shadow-pop">
            <Phone className="mt-0.5 shrink-0 text-amber-600" />
            <div><p className="font-semibold">{t("support.call")}</p><p className="text-sm text-slate-600">{s.phone}</p></div>
          </a>
        ) : null}
        {wa ? (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="card flex gap-3 p-4 hover:shadow-pop">
            <MessageCircle className="mt-0.5 shrink-0 text-amber-600" />
            <div><p className="font-semibold">{t("support.whatsapp")}</p><p className="text-sm text-slate-600">{s.whatsapp}</p></div>
          </a>
        ) : null}
        {s.email ? (
          <a href={`mailto:${s.email}`} className="card flex gap-3 p-4 hover:shadow-pop">
            <Mail className="mt-0.5 shrink-0 text-amber-600" />
            <div><p className="font-semibold">{t("support.email")}</p><p className="text-sm text-slate-600">{s.email}</p></div>
          </a>
        ) : null}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">{t("support.faq")}</h2>
      <div className="space-y-2">
        {FAQ.map((f) => (
          <details key={f.q.en} className="card group p-4">
            <summary className="cursor-pointer list-none font-medium">{f.q[lang]}</summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{f.a[lang]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
