import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Home, BookOpen, Layers, Filter, Sparkles } from 'lucide-react';
import { DEPARTMENT_SUBCATEGORIES } from '@/components/category-drawer/departmentData';

interface CategoryPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export const revalidate = 3600; // 1 Hour ISR

/**
 * Task 17 & 19: Pre-render top-traffic department and category routes for True ISR
 */
export async function generateStaticParams() {
  return [
    { slug: ['wbcs'] },
    { slug: ['college'] },
    { slug: ['school'] },
    { slug: ['competitive-exams'] },
    { slug: ['literature'] },
    { slug: ['specials'] },
    { slug: ['ebooks'] },
    { slug: ['wbcs', 'prelims'] },
    { slug: ['wbcs', 'mains'] },
    { slug: ['wbcs', 'solved-papers'] },
    { slug: ['wbcs', 'mock-tests'] },
    { slug: ['wbcs', 'optional-history'] },
    { slug: ['wbcs', 'optional-geography'] },
    { slug: ['wbcs', 'current-affairs'] },
    { slug: ['college', 'ugb'] },
    { slug: ['college', 'cu'] },
    { slug: ['college', 'other-universities'] },
    { slug: ['college', 'ba-arts'] },
    { slug: ['college', 'bsc-science'] },
    { slug: ['college', 'bcom'] },
    { slug: ['school', 'madhyamik'] },
    { slug: ['school', 'higher-secondary'] },
    { slug: ['school', 'test-papers'] },
    { slug: ['school', 'prashna-bichitra'] },
    { slug: ['competitive-exams', 'wb-police'] },
    { slug: ['competitive-exams', 'tet'] },
    { slug: ['competitive-exams', 'railway'] },
    { slug: ['competitive-exams', 'ssc'] },
    { slug: ['competitive-exams', 'wbpsc-clerkship'] },
    { slug: ['literature', 'novels'] },
    { slug: ['literature', 'short-stories'] },
    { slug: ['literature', 'history'] },
    { slug: ['literature', 'poetry'] },
    { slug: ['literature', 'biography'] },
    { slug: ['literature', 'translation'] },
    { slug: ['literature', 'detective-thriller'] },
    { slug: ['specials', 'malda-heritage'] },
    { slug: ['specials', 'combo-boxsets'] },
    { slug: ['specials', 'rare-editions'] },
    { slug: ['ebooks', 'syllabus-guidelines'] },
    { slug: ['ebooks', 'question-banks'] },
    { slug: ['ebooks', 'periodicals'] },
  ];
}

/**
 * Task 19: Dynamic Metadata for SEO indexing with Bengali Title Resolution
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const rootSlug = slug[0];
  const lastSlug = slug[slug.length - 1];
  const fullPath = slug.join('/');

  const deptKey = `dept-${rootSlug}`;
  const deptSubcategories =
    DEPARTMENT_SUBCATEGORIES[deptKey] ||
    DEPARTMENT_SUBCATEGORIES[rootSlug] ||
    [];

  const matchedSubcategory = deptSubcategories.find(
    (sub) => sub.slug === fullPath || sub.slug === lastSlug || sub.slug.endsWith(`/${lastSlug}`)
  );

  const rootDeptMatch = deptSubcategories.find((s) => s.slug === rootSlug || s.slug === fullPath);
  const bengaliTitle = matchedSubcategory?.titleBn || rootDeptMatch?.titleBn;
  const formattedTitle = lastSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const displayTitle = bengaliTitle ? `${bengaliTitle} (${formattedTitle})` : formattedTitle;

  return {
    title: `${displayTitle} বইয়ের তালিকা | M.M Book House Malda`,
    description: `মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের জন্য ${displayTitle} সম্পর্কিত নির্ভরযোগ্য প্রামাণ্য বই, সিলেবাস সহায়িকা ও টেস্ট পেপারস। সেরা ছাড় ও দ্রুত ডেলিভারি সুবিধা।`,
    keywords: [formattedTitle, bengaliTitle || '', 'WBCS', 'কলেজ বই', 'মালদা বইয়ের দোকান', 'M.M Book House'].filter(Boolean),
  };
}

/**
 * Task 19: SEO Friendly Hierarchical Category Page
 * Handles routes like /category/wbcs, /category/college/ugb, /category/wbcs/prelims
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    notFound();
  }

  const rootSlug = slug[0];
  const fullPath = slug.join('/');
  const lastSlug = slug[slug.length - 1];

  // Point 4: Robust department mapping supporting both dept-gov-jobs and direct competitive-exams key
  const deptKey = `dept-${rootSlug}`;
  const subcategories =
    DEPARTMENT_SUBCATEGORIES[deptKey] ||
    DEPARTMENT_SUBCATEGORIES[rootSlug] ||
    [];

  const matchedSubcategory = subcategories.find(
    (sub) => sub.slug === fullPath || sub.slug === lastSlug || sub.slug.endsWith(`/${lastSlug}`)
  );

  const rootDeptMatch = subcategories.find((s) => s.slug === rootSlug || s.slug === fullPath);

  const categoryTitle =
    matchedSubcategory?.titleBn ||
    rootDeptMatch?.titleBn ||
    lastSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4 min-h-[70vh]">
      {/* 1. Breadcrumbs Trail */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-600">ক্যাটাগরি</span>
        {slug.map((segment, idx) => {
          const isLast = idx === slug.length - 1;
          const href = `/category/${slug.slice(0, idx + 1).join('/')}`;
          const label = segment
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              {isLast ? (
                <span className="font-bold text-gray-900 truncate">{label}</span>
              ) : (
                <Link href={href} className="hover:text-amber-600 truncate">
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* 2. Category Title Header */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              M.M Book House ক্যাটালগ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {categoryTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            পশ্চিমবঙ্গের শীর্ষস্থানীয় প্রকাশকদের নির্ভরযোগ্য প্রামাণ্য বই ও সহায়ক গাইড।
          </p>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>সরাসরি কাউন্টার ও অনলাইন ডেলিভারি</span>
          </span>
        </div>
      </div>

      {/* 3. Related Subcategories Filter Chips (if available) */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span>সম্পর্কিত সাব-ক্যাটাগরি ও বিষয়সমূহ:</span>
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {subcategories.map((sub) => {
              const isSelected = fullPath.includes(sub.slug);
              return (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-[#232f3e] text-white border-[#232f3e] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {sub.titleBn}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Books Grid Placeholder / Catalog View */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {categoryTitle} বিভাগের বইসমূহ লোড হচ্ছে
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
          মডিউল ১-এর ডেটাবেস ক্যাটালগ থেকে বইয়ের তালিকা ও ফিল্টারিং ইঞ্জিন সংযুক্ত করার প্রক্রিয়া চলমান।
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
        >
          হোমপেজে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
