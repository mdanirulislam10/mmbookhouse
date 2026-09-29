import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { ToastProvider } from "@/components/ui/Toaster";
import { publicEnv } from "@/lib/env";
import { PwaRegister } from "@/components/layout/Pwa";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const bengali = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-bengali", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "mmbookhouse | অনলাইন বইয়ের দোকান", template: "%s | mmbookhouse" },
  description: "Your trusted online bookstore — competitive exam, school and college books, delivered across West Bengal and India or collected free at our counter.",
  applicationName: "mmbookhouse",
  manifest: "/manifest.webmanifest",
  openGraph: { type: "website", siteName: "mmbookhouse", locale: "bn_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#131921",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${sans.variable} ${bengali.variable}`}>
      <body className="min-h-screen font-sans" id="top">
        <I18nProvider lang={lang}>
          <ToastProvider>{children}</ToastProvider>
          <PwaRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
