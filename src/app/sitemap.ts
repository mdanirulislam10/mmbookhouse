import { MetadataRoute } from 'next';

/**
 * Task 39 & Module 20: Sitemap Crawl Optimization & Legal Policy Indexing
 * Contains canonical landing routes, permanent category landing pages,
 * and mandatory legal policy routes for Google Search Console & Google Merchant Center.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mmbookhouse.in';
  const now = new Date();

  // 1. Primary Canonical Landing Pages
  const primaryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bestsellers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/new-arrivals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/bulk-order`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Legal & Policy Pages (Module 20: Item 46)
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Permanent Category SEO Pages (Tasks 35 & 39)
  const permanentCategorySlugs = [
    'wbcs',
    'college',
    'school',
    'competitive-exams',
    'literature',
    'specials',
    'ebooks',
    'wbcs/prelims',
    'wbcs/mains',
    'wbcs/solved-papers',
    'wbcs/mock-tests',
    'wbcs/optional-history',
    'wbcs/optional-geography',
    'wbcs/current-affairs',
    'college/ugb',
    'college/cu',
    'college/ba-arts',
    'college/bsc-science',
    'college/bcom',
    'school/madhyamik',
    'school/higher-secondary',
    'school/test-papers',
    'competitive-exams/wb-police',
    'competitive-exams/tet',
    'competitive-exams/railway',
    'competitive-exams/ssc',
    'competitive-exams/wbpsc-clerkship',
    'literature/novels',
    'literature/detective-thriller',
    'specials/malda-heritage',
  ];

  const categoryRoutes: MetadataRoute.Sitemap = permanentCategorySlugs.map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...primaryRoutes, ...categoryRoutes];
}
