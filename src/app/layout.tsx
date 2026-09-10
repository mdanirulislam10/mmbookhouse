import type { Metadata } from 'next';
import { Hind_Siliguri, Outfit } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header/Header';
import { SkipToContent } from '@/components/header/SkipToContent';
import { MobileBottomNav } from '@/components/header/MobileBottomNav';
import { CategoryDrawer } from '@/components/category-drawer/CategoryDrawer';
import { SideCartDrawer } from '@/components/cart/SideCartDrawer';
import { CartToastContainer } from '@/components/cart/CartToastContainer';
import { StructuredData } from '@/components/seo';
import { ServiceWorkerRegister } from '@/components/pwa';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mmbookhouse.in'),
  title: 'M.M Book House Malda | অনলাইন বইয়ের দোকান',
  description: 'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের নির্ভরযোগ্য বইয়ের দোকান। স্কুল, কলেজ, WBCS ও সমস্ত চাকরির পরীক্ষার বই সহজলভ্য।',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        {/* Task 47: Schema.org Structured Data & Google Sitelinks Searchbox */}
        <StructuredData />
      </head>
      <body className={`${hindSiliguri.variable} ${outfit.variable} bg-[#eaeded] min-h-screen antialiased text-gray-900`}>
        {/* Task 48: PWA Service Worker Registration */}
        <ServiceWorkerRegister />

        {/* Task 12: WCAG 2.1 A11y Skip Link */}
        <SkipToContent />

        {/* Amazon Global Header */}
        <Header />

        {/* Module 3: All Hamburger Mega Category Drawer */}
        <CategoryDrawer />

        {/* Module 10: 420px Slide-in Side Cart Drawer */}
        <SideCartDrawer />

        {/* Module 10 (Task 10): Rapid-Snap Add-to-Cart Notification Toasts */}
        <CartToastContainer />

        {/* Main Content Area (Target for A11y Skip Link with bottom nav clearance) */}
        <main id="main-content" tabIndex={-1} className="pb-20 md:pb-0 focus:outline-none">
          {children}
        </main>

        {/* Task 13: Dual-Nav Mobile Fixed Bottom Bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
