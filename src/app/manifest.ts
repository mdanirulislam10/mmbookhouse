import type { MetadataRoute } from 'next';
import { pwaManifestConfig } from '@/lib/services/pwaManifestService';

/**
 * Module 20: Progressive Web App Manifest (Items 2, 7, 9)
 * Amazon-pattern PWA configuration:
 * - Standalone app display with #131921 Navy theme & #FFFFFF background
 * - Maskable and standard 192x192 & 512x512 icons
 * - 3 App Shortcuts: Track Order, Search Books, Deal of the Day
 * - Splash screen branding metadata
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: pwaManifestConfig.name,
    short_name: pwaManifestConfig.short_name,
    description: pwaManifestConfig.description,
    start_url: pwaManifestConfig.start_url,
    id: 'mm-book-house-pwa-app',
    display: pwaManifestConfig.display,
    background_color: pwaManifestConfig.background_color,
    theme_color: pwaManifestConfig.theme_color,
    lang: pwaManifestConfig.lang,
    dir: pwaManifestConfig.dir,
    orientation: pwaManifestConfig.orientation,
    icons: pwaManifestConfig.icons,
    categories: pwaManifestConfig.categories,
    shortcuts: pwaManifestConfig.shortcuts,
    related_applications: [],
    prefer_related_applications: false,
  };
}
