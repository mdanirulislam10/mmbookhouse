import type { MetadataRoute } from 'next';

/**
 * Task 48: Web App Manifest for PWA Support
 * Enables Add to Home Screen, offline shell caching, and standalone app-like experience.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'M.M Book House Malda | অনলাইন বইয়ের দোকান',
    short_name: 'MM Book House',
    description: 'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের নির্ভরযোগ্য অনলাইন বইয়ের দোকান।',
    start_url: '/',
    display: 'standalone',
    background_color: '#eaeded',
    theme_color: '#131921',
    lang: 'bn',
    dir: 'ltr',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['shopping', 'education', 'books'],
    shortcuts: [
      {
        name: 'ডিলস ও অফার',
        short_name: 'Deals',
        description: 'আজকের ফ্ল্যাশ ডিলস ও বিশেষ ছাড়',
        url: '/deals',
      },
      {
        name: 'মালদা স্টুডেন্ট হাব',
        short_name: 'Student Hub',
        description: 'মালদার শিক্ষার্থীদের পছন্দের বই',
        url: '/malda-student-hub',
      },
      {
        name: 'বেস্টসেলার্স',
        short_name: 'Bestsellers',
        description: 'শীর্ষ বিক্রিত বইসমূহ',
        url: '/bestsellers',
      },
    ],
  };
}
