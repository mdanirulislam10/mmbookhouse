import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'বই অনুসন্ধান ও ফিল্টারিং ক্যাটালগ | M.M Book House Malda',
  description:
    'মালদার বৃহত্তম অনলাইন বুক স্টোর - কলেজ, বিশ্ববিদ্যালয় (UGB), WBCS, প্রাথমিক টেট, স্কুল ও প্রতিযোগিতামূলক পরীক্ষার বই সুলভ মূল্যে খুঁজুন ও কিনুন। নেতাজি সুভাষ রোড, মালদা।',
  alternates: {
    canonical: '/search',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'বই অনুসন্ধান ও ফিল্টারিং ক্যাটালগ | M.M Book House Malda',
    description:
      'মালদার বৃহত্তম অনলাইন বুক স্টোর থেকে বিষয়, লেখক, প্রকাশনী, বাঁধাই ও ছাড় অনুযায়ী বই খুঁজুন।',
    url: 'https://mmbookhouse.com/search',
    siteName: 'M.M Book House Malda',
    locale: 'bn_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'বই অনুসন্ধান ও ফিল্টারিং ক্যাটালগ | M.M Book House Malda',
    description:
      'মালদার বৃহত্তম অনলাইন বুক স্টোর থেকে বিষয়, লেখক, প্রকাশনী, বাঁধাই ও ছাড় অনুযায়ী বই খুঁজুন।',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
