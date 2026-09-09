import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'লগইন ও সাইন-ইন | M.M Book House Malda',
  description: 'M.M Book House Malda গ্রাহক লগইন। ওটিপি ও মোবাইল নম্বরের সাহায্যে নিরাপদে সাইন-ইন করুন।',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
