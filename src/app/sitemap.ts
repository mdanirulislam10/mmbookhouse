import { MetadataRoute } from 'next';

/**
 * Task 39: Sitemap Crawl Optimization Rules (সাইটম্যাপ ক্রল অপ্টিমাইজেশন রুল)
 *
 * Excludes infinite faceted search parameter permutations (?q=..., ?authors=...)
 * to prevent burning Google Search Engine crawl budget.
 * Contains only canonical base routes and permanent SSR/ISR category landing pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mmbookhouse.com';
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
