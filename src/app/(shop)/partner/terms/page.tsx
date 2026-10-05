import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLang, getT } from "@/lib/i18n/server";
import { PARTNER_TERMS_VERSION } from "@/lib/validation/partner";

export const metadata: Metadata = { title: "Partner terms and conditions" };

const CONTENT = {
  en: [
    ["Who can apply", "Publishers, authors and book suppliers or distributors, in India or abroad. You must be legally able to enter into this agreement and the details in your application must be true and kept up to date."],
    ["Rights to the books", "You confirm that you own or are authorised to supply every book you submit, and that the books are genuine and not pirated, counterfeit or illegal under Indian law. You are responsible for any claim arising from books you supply."],
    ["Listing and selling price", "We decide whether to list a book, its selling price in Indian Rupees, its description and its categories. We may decline, hide or remove any book at any time."],
    ["Supply and quality", "When we order copies, you supply them in new, saleable condition, correctly packed and with matching ISBN, edition and price, within the time agreed for that order."],
    ["Payment", "We pay the agreed supply price for copies sold (or for copies bought outright, if agreed in writing). The schedule, currency and method of payment are agreed in writing with each partner. Bank and transfer charges are borne by the party that incurs them unless agreed otherwise."],
    ["Partners outside India", "Export, shipping, customs paperwork and any duties or taxes for consignments to India are handled as agreed in writing for each consignment. You are responsible for complying with the laws of your own country."],
    ["Returns", "Damaged, defective or wrongly supplied copies may be returned or adjusted against future payments. Arrangements for unsold copies are agreed in writing."],
    ["Taxes", "Each party is responsible for its own taxes. Partners in India should provide a valid GSTIN where applicable."],
    ["Communication and data", "We use your contact details only to run this partnership and may contact you by e-mail, phone or WhatsApp. We do not share them except as needed to fulfil orders or by law."],
    ["Ending the partnership", "Either side may end the partnership by written notice. We may suspend an account immediately for false information, pirated books or repeated quality problems. Payments due for copies already sold remain payable."],
    ["Law", "These terms are governed by the laws of India. Disputes are subject to the courts at Malda, West Bengal."],
    ["Changes", "We may update these terms. The version you accepted is recorded; we will ask you to accept a new version before you submit further books."],
  ],
  bn: [
    ["কারা আবেদন করতে পারবেন", "ভারত বা বিদেশের প্রকাশক, লেখক এবং বই সরবরাহকারী বা ডিস্ট্রিবিউটর। আপনাকে আইনগতভাবে এই চুক্তি করার যোগ্য হতে হবে, এবং আবেদনের তথ্য সত্য ও হালনাগাদ রাখতে হবে।"],
    ["বইয়ের স্বত্ব", "আপনি নিশ্চিত করছেন যে জমা দেওয়া প্রতিটি বইয়ের স্বত্ব আপনার, অথবা সরবরাহের অনুমতি আপনার আছে, এবং বইগুলো আসল — পাইরেটেড, নকল বা ভারতের আইনে নিষিদ্ধ নয়। আপনার সরবরাহ করা বই নিয়ে কোনো দাবি উঠলে তার দায় আপনার।"],
    ["তালিকাভুক্তি ও বিক্রয়মূল্য", "কোন বই তালিকাভুক্ত হবে, ভারতীয় টাকায় তার বিক্রয়মূল্য, বিবরণ ও বিভাগ আমরা ঠিক করব। আমরা যেকোনো সময় কোনো বই গ্রহণ না করতে, লুকিয়ে রাখতে বা সরিয়ে দিতে পারি।"],
    ["সরবরাহ ও মান", "আমরা অর্ডার দিলে আপনি নতুন, বিক্রয়যোগ্য অবস্থায়, ঠিকমতো প্যাক করে এবং মিল থাকা ISBN, সংস্করণ ও দামসহ বই নির্ধারিত সময়ের মধ্যে সরবরাহ করবেন।"],
    ["পেমেন্ট", "বিক্রি হওয়া কপির জন্য (অথবা লিখিতভাবে সম্মত হলে সরাসরি কেনা কপির জন্য) আমরা নির্ধারিত সরবরাহ মূল্য পরিশোধ করব। পেমেন্টের সময়সূচি, মুদ্রা ও পদ্ধতি প্রত্যেক অংশীদারের সাথে লিখিতভাবে ঠিক করা হবে। অন্যভাবে সম্মত না হলে ব্যাংক ও ট্রান্সফারের খরচ যার হয় তিনিই বহন করবেন।"],
    ["ভারতের বাইরের অংশীদার", "ভারতে চালানের রপ্তানি, পরিবহন, কাস্টমসের কাগজপত্র এবং শুল্ক বা কর প্রতিটি চালানের জন্য লিখিতভাবে যেভাবে সম্মত হবে সেভাবে সামলানো হবে। নিজের দেশের আইন মেনে চলার দায় আপনার।"],
    ["ফেরত", "ক্ষতিগ্রস্ত, ত্রুটিপূর্ণ বা ভুল সরবরাহ করা কপি ফেরত দেওয়া যাবে অথবা পরবর্তী পেমেন্টে সমন্বয় করা হবে। অবিক্রীত কপির ব্যবস্থা লিখিতভাবে ঠিক করা হবে।"],
    ["কর", "প্রত্যেক পক্ষ নিজের কর নিজে দেবে। ভারতের অংশীদারদের প্রযোজ্য ক্ষেত্রে বৈধ GSTIN দিতে হবে।"],
    ["যোগাযোগ ও তথ্য", "আপনার যোগাযোগের তথ্য আমরা শুধু এই অংশীদারিত্ব চালাতে ব্যবহার করব এবং ইমেইল, ফোন বা WhatsApp-এ যোগাযোগ করতে পারি। অর্ডার পূরণ বা আইনের প্রয়োজন ছাড়া তা কারও সাথে শেয়ার করা হবে না।"],
    ["অংশীদারিত্ব শেষ করা", "যেকোনো পক্ষ লিখিত নোটিশ দিয়ে অংশীদারিত্ব শেষ করতে পারবে। ভুল তথ্য, পাইরেটেড বই বা বারবার মানের সমস্যার জন্য আমরা তাৎক্ষণিকভাবে অ্যাকাউন্ট স্থগিত করতে পারি। ইতিমধ্যে বিক্রি হওয়া কপির পাওনা পরিশোধযোগ্য থাকবে।"],
    ["আইন", "এই শর্তাবলী ভারতের আইন অনুযায়ী পরিচালিত। বিরোধ মালদা, পশ্চিমবঙ্গের আদালতের এখতিয়ারভুক্ত।"],
    ["পরিবর্তন", "আমরা এই শর্তাবলী হালনাগাদ করতে পারি। আপনি কোন সংস্করণে সম্মতি দিয়েছেন তা সংরক্ষিত থাকে; আরও বই জমা দেওয়ার আগে নতুন সংস্করণে সম্মতি চাওয়া হবে।"],
  ],
} as const;

export default async function PartnerTermsPage() {
  const [lang, { t }] = await Promise.all([getLang(), getT()]);
  const back = (
    <Link href="/partner" className="link inline-flex items-center gap-1 text-sm">
      <ArrowLeft size={16} /> {t("partner.backToForm")}
    </Link>
  );
  return (
    <article className="container-page max-w-3xl py-6">
      {back}
      <h1 className="mt-3 text-2xl font-bold">{t("partner.termsTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("partner.termsVersion", { v: PARTNER_TERMS_VERSION })}</p>
      {CONTENT[lang].map(([h, p], i) => (
        <section key={h} className="mt-5">
          <h2 className="text-lg font-semibold">
            {i + 1}. {h}
          </h2>
          <p className="mt-1 leading-relaxed text-slate-700">{p}</p>
        </section>
      ))}
      <div className="mt-8">{back}</div>
    </article>
  );
}
