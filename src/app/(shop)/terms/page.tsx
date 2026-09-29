import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Terms & conditions" };

const CONTENT = {
  en: {
    title: "Terms & Conditions",
    sections: [
      ["Orders", "An order is confirmed once we accept it (after payment verification for UPI orders). We may cancel an order if a book turns out to be unavailable and will refund any payment made."],
      ["Prices", "Prices are in Indian Rupees and include applicable taxes (printed books are exempt from GST under HSN 4901). Prices and offers may change without notice; the price at checkout applies."],
      ["Delivery", "Delivery times are estimates. Delivery fees and cash-on-delivery availability depend on your pincode and are shown before you pay."],
      ["Cancellation & returns", "You can cancel an order until it is packed. For damaged or wrong books, contact us within 48 hours of delivery with photos and we will replace or refund."],
      ["Store pickup", "Bring your 4-digit pickup code to the counter. Orders not collected within 7 days may be cancelled."],
    ],
  },
  bn: {
    title: "শর্তাবলি",
    sections: [
      ["অর্ডার", "আমরা অর্ডার গ্রহণ করলে (UPI অর্ডারে পেমেন্ট যাচাইয়ের পর) তা নিশ্চিত হয়। কোনো বই না পাওয়া গেলে আমরা অর্ডার বাতিল করতে পারি এবং দেওয়া টাকা ফেরত দেব।"],
      ["মূল্য", "মূল্য ভারতীয় টাকায় এবং প্রযোজ্য কর অন্তর্ভুক্ত (ছাপা বই HSN 4901-এ GST-মুক্ত)। মূল্য ও অফার বিনা নোটিশে বদলাতে পারে; চেকআউটের মূল্যই প্রযোজ্য।"],
      ["ডেলিভারি", "ডেলিভারির সময় আনুমানিক। ডেলিভারি চার্জ ও ক্যাশ অন ডেলিভারি আপনার পিনকোডের উপর নির্ভর করে এবং পেমেন্টের আগেই দেখানো হয়।"],
      ["বাতিল ও ফেরত", "প্যাকিংয়ের আগে পর্যন্ত অর্ডার বাতিল করা যায়। ক্ষতিগ্রস্ত বা ভুল বই পেলে ডেলিভারির ৪৮ ঘণ্টার মধ্যে ছবিসহ জানান — আমরা বদলে দেব বা টাকা ফেরত দেব।"],
      ["দোকান থেকে সংগ্রহ", "কাউন্টারে ৪ সংখ্যার পিকআপ কোড দেখান। ৭ দিনের মধ্যে না নিলে অর্ডার বাতিল হতে পারে।"],
    ],
  },
} as const;

export default async function TermsPage() {
  const lang = await getLang();
  const c = CONTENT[lang];
  return (
    <article className="container-page max-w-3xl py-6">
      <h1 className="text-2xl font-bold">{c.title}</h1>
      {c.sections.map(([h, p]) => (
        <section key={h} className="mt-5">
          <h2 className="text-lg font-semibold">{h}</h2>
          <p className="mt-1 leading-relaxed text-slate-700">{p}</p>
        </section>
      ))}
    </article>
  );
}
