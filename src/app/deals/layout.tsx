import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'আজকের সেরা ডিলস ও ছাড়ের বই | M.M Book House Malda',
  description: 'M.M Book House-এ আজকের সেরা ডিলস ও ফ্ল্যাশ সেল! WBCS, কলেজ সেমিস্টার, মাধ্যমিক ও চাকরির পরীক্ষার বইয়ে ৫০% পর্যন্ত বিশেষ ছাড়। দ্রুত সীমিত স্টক!',
  keywords: ['আজকের ডিলস', 'ফ্ল্যাশ সেল', 'বইয়ে ছাড়', 'WBCS ডিলস', 'M.M Book House Deals'],
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
