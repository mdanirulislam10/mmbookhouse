import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/server";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Privacy policy" };

const CONTENT = {
  en: {
    title: "Privacy Policy",
    sections: [
      ["What we collect", "Your name, e-mail, phone number, delivery addresses and order history — only what is needed to sell and deliver books to you. Sign-in is handled by Supabase Auth; we never see or store your password in plain text."],
      ["How we use it", "To process and deliver orders, send order updates, provide support and prevent fraud. We do not sell your data."],
      ["Payments", "We do not store card details. UPI payments are made directly to our UPI ID; we store only the transaction reference you submit."],
      ["Who sees it", "Our staff (to fulfil orders) and delivery partners (name, phone, address). Data is stored on Supabase infrastructure."],
      ["Your choices", "You can update or delete your addresses and profile from your account. To delete your account and data, contact us at the store details in the footer."],
    ],
  },
  bn: {
    title: "গোপনীয়তা নীতি",
    sections: [
      ["আমরা কী সংগ্রহ করি", "আপনার নাম, ইমেইল, ফোন নম্বর, ডেলিভারির ঠিকানা ও অর্ডারের ইতিহাস — শুধু যতটুকু বই বিক্রি ও ডেলিভারির জন্য দরকার। সাইন-ইন Supabase Auth-এর মাধ্যমে হয়; আপনার পাসওয়ার্ড আমরা কখনো দেখি বা সরল লেখায় রাখি না।"],
      ["কীভাবে ব্যবহার করি", "অর্ডার প্রক্রিয়া ও ডেলিভারি, অর্ডারের আপডেট পাঠানো, সহায়তা এবং প্রতারণা প্রতিরোধে। আপনার তথ্য আমরা বিক্রি করি না।"],
      ["পেমেন্ট", "আমরা কার্ডের তথ্য রাখি না। UPI পেমেন্ট সরাসরি আমাদের UPI ID-তে হয়; শুধু আপনার দেওয়া লেনদেনের রেফারেন্স সংরক্ষিত থাকে।"],
      ["কারা দেখতে পায়", "আমাদের কর্মীরা (অর্ডার পূরণে) ও ডেলিভারি অংশীদাররা (নাম, ফোন, ঠিকানা)। তথ্য Supabase-এর অবকাঠামোতে সংরক্ষিত।"],
      ["আপনার নিয়ন্ত্রণ", "অ্যাকাউন্ট থেকে ঠিকানা ও প্রোফাইল হালনাগাদ বা মুছতে পারবেন। অ্যাকাউন্ট ও তথ্য মুছতে ফুটারে দেওয়া ঠিকানায় যোগাযোগ করুন।"],
    ],
  },
} as const;

export default async function PrivacyPage() {
  const lang = await getLang();
  const c = CONTENT[lang];
  const s = (await getSettings()).store_profile;
  return (
    <article className="container-page max-w-3xl py-6">
      <h1 className="text-2xl font-bold">{c.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{s.name}</p>
      {c.sections.map(([h, p]) => (
        <section key={h} className="mt-5">
          <h2 className="text-lg font-semibold">{h}</h2>
          <p className="mt-1 leading-relaxed text-slate-700">{p}</p>
        </section>
      ))}
    </article>
  );
}
