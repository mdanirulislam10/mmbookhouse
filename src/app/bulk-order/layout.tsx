import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'স্কুল, কোচিং ও লাইব্রেরি বাল্ক বুকিং (Request-a-Quote) | M.M Book House Malda',
  description: 'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষা প্রতিষ্ঠান, স্কুল, কোচিং সেন্টার এবং লাইব্রেরির জন্য বিশেষ পাইকারি ছাড় ও জিএসটি ইনভয়েস সহ সরাসরি বই সরবরাহের সুবিধা।',
  keywords: ['বাল্ক বুকিং', 'স্কুল বই অর্ডার', 'কোচিং বুকিং', 'লাইব্রেরি বই', 'M.M Book House Bulk Order'],
};

export default function BulkOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
