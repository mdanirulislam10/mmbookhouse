import type {
  PwaAppManifestConfig,
  PwaSplashScreenConfig,
  PwaAppShortcut,
} from '@/types/pwaSecurity';

/**
 * Module 20: PWA Manifest & App Shortcuts Engine (Items 2, 7, 9)
 * Amazon-pattern Progressive Web App specifications:
 * 1. Zero-install native-feel experience (Item 1)
 * 2. Standalone display, #131921 theme, maskable icons (Item 2)
 * 3. 3 App Shortcuts for long-press on home screen (Item 7)
 * 4. 1-second branded navy & gold splash screen (Item 9)
 */

export const pwaSplashConfig: PwaSplashScreenConfig = {
  backgroundColor: '#131921',
  themeColor: '#febd69',
  logoUrl: '/icons/icon-512.png',
  taglineBengali: 'উত্তরবঙ্গের নির্ভরযোগ্য বইয়ের দোকান',
  taglineEnglish: "North Bengal's Trusted Bookstore",
  durationMs: 1000,
};

export const pwaShortcuts: PwaAppShortcut[] = [
  {
    name: '📦 ট্র্যাক অর্ডার',
    short_name: 'Track Order',
    description: 'অর্ডারের লাইভ পার্সেল ট্র্যাকিং স্ট্যাটাস',
    url: '/orders?action=track',
    icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  {
    name: '🔍 বই খুঁজুন',
    short_name: 'Search Books',
    description: '৫০,০০০+ পাঠ্য ও রেফারেন্স বই অনুসন্ধান',
    url: '/search?focus=true',
    icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  {
    name: '⚡ ডিল অফ দ্য ডে',
    short_name: 'Deal of the Day',
    description: 'আজকের ফ্ল্যাশ ছাড় ও আকর্ষণীয় অফার',
    url: '/deals?flash=true',
    icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
];

export const pwaManifestConfig: PwaAppManifestConfig = {
  name: 'M.M Book House Malda | উত্তরবঙ্গের নির্ভরযোগ্য বইয়ের দোকান',
  short_name: 'MM Books',
  description: 'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের নির্ভরযোগ্য অনলাইন বইয়ের দোকান। স্কুল, কলেজ ও প্রতিযোগিতামূলক পরীক্ষার বই দ্রুততম হোম ডেলিভারিতে পান।',
  start_url: '/?source=pwa',
  display: 'standalone',
  background_color: '#FFFFFF',
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
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
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
  shortcuts: pwaShortcuts,
  splashScreen: pwaSplashConfig,
};

/**
 * Validates whether the manifest meets Google PWA installability criteria.
 */
export function validatePwaInstallability(config: PwaAppManifestConfig = pwaManifestConfig): {
  isInstallable: boolean;
  checks: { criterion: string; satisfied: boolean }[];
} {
  const checks = [
    {
      criterion: 'Name and short_name are defined',
      satisfied: Boolean(config.name && config.short_name),
    },
    {
      criterion: 'Start URL is specified with valid route',
      satisfied: Boolean(config.start_url && config.start_url.startsWith('/')),
    },
    {
      criterion: 'Display mode is standalone or fullscreen',
      satisfied: config.display === 'standalone' || config.display === 'fullscreen',
    },
    {
      criterion: 'Theme color matches Amazon Navy (#131921)',
      satisfied: config.theme_color.toLowerCase() === '#131921',
    },
    {
      criterion: '192x192 icon exists with maskable purpose',
      satisfied: config.icons.some(
        (i) => i.sizes === '192x192' && i.purpose === 'maskable'
      ),
    },
    {
      criterion: '512x512 icon exists with any/maskable purpose',
      satisfied: config.icons.some((i) => i.sizes === '512x512'),
    },
    {
      criterion: 'At least 3 quick app shortcuts defined',
      satisfied: config.shortcuts.length >= 3,
    },
  ];

  const isInstallable = checks.every((c) => c.satisfied);
  return { isInstallable, checks };
}
