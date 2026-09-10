import { MetadataRoute } from 'next';

/**
 * Task 39: Sitemap & Crawl Budget Optimization Rules (ক্রল বাজেট সুরক্ষা)
 * Protects search engine crawl budget by preventing indexing of infinite
 * faceted query string combinations (/search?*), while allowing crawling
 * of permanent category landing pages (/category/*) and primary landing routes.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mmbookhouse.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search$', '/category/'],
        disallow: [
          '/search?*', // Disallow infinite faceted filter permutations (Task 34 & 39)
          '/api/',
          '/account/',
          '/orders/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/search$', '/category/'],
        disallow: ['/search?*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
