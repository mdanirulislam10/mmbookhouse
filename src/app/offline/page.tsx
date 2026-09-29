import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { RetryButton } from "./RetryButton";

export const metadata: Metadata = { title: "Offline", robots: { index: false, follow: false } };

/** Shown by the service worker when a page cannot be reached. Bilingual, no data access, safe to cache. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-navy px-6 text-center text-white">
      <WifiOff size={48} className="mb-4 text-brand-amber" />
      <h1 className="text-2xl font-bold">আপনি অফলাইনে আছেন</h1>
      <p className="mt-2 max-w-md text-slate-300">ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>
      <h2 className="mt-6 text-lg font-semibold">You are offline</h2>
      <p className="mt-1 max-w-md text-sm text-slate-300">Check your internet connection and try again.</p>
      <RetryButton />
    </main>
  );
}
