'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Award, 
  Calendar, 
  ShieldCheck, 
  GraduationCap, 
  School, 
  Medal, 
  Compass, 
  BookMarked 
} from 'lucide-react';
import { CategoryItem } from '@/types/category-drawer';
import { DEPARTMENT_SUBCATEGORIES } from './departmentData';
import { useCategoryPrefetch } from '@/hooks/useCategoryPrefetch';
import { useCategoryAnalytics } from '@/hooks/useCategoryAnalytics';
import { useCategoryHistory } from '@/hooks/useCategoryHistory';
import { CategoryBadge } from './CategoryBadge';

interface SubmenuPanelProps {
  activeDepartment: CategoryItem;
  onBack: () => void;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

/**
 * Tasks 11 & 12, Tasks 26–30, Tasks 46 & 47: Amazon 2nd-Layer Slide Panel & Micro-Interactions
 *
 * - Task 11: 2nd Layer Slide Panel displaying rich hierarchical subcategories
 * - Task 12: Prominent "← MAIN MENU" Back Button with slide-back animation
 * - Task 26: Bilingual Typography scale (Hind Siliguri & Outfit)
 * - Task 27: Lucide Vector Category & Subcategory Iconography
 * - Task 28: Micro-interaction hover states (4px translate, icon accent scale)
 * - Task 29: Complete Dark & Light mode theme palette
 * - Task 30: 1px Soft Separators & uncluttered structure
 * - Task 46 & 47: Category Affinity Recording & Engagement Analytics
 */
export const SubmenuPanel: React.FC<SubmenuPanelProps> = ({
  activeDepartment,
  onBack,
  onClose,
  onNavigate,
}) => {
  const router = useRouter();
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const { prefetchUrl } = useCategoryPrefetch();
  const { trackCategoryEvent } = useCategoryAnalytics();
  const { recordCategoryVisit } = useCategoryHistory();

  const handleSubcategoryNavigate = (e: React.MouseEvent, url: string, subItem: CategoryItem) => {
    e.preventDefault();
    recordCategoryVisit(subItem.id, subItem.slug, subItem.titleBn || subItem.title);
    trackCategoryEvent({
      event: 'subcategory_click',
      categoryId: subItem.id,
      categoryTitle: subItem.titleBn || subItem.title,
      slug: url,
      source: 'drawer',
    });
    if (onNavigate) {
      onNavigate(url);
    } else {
      onClose();
      setTimeout(() => {
        router.push(url);
      }, 60);
    }
  };


  // Point 8: Support DB UUIDs, embedded activeDepartment.subcategories, and slug lookups
  const subcategories =
    activeDepartment.subcategories && activeDepartment.subcategories.length > 0
      ? activeDepartment.subcategories
      : DEPARTMENT_SUBCATEGORIES[activeDepartment.id] ||
        DEPARTMENT_SUBCATEGORIES[activeDepartment.slug] || [
          {
            id: `${activeDepartment.id}-all`,
            title: `All in ${activeDepartment.title}`,
            titleBn: `সকল ${activeDepartment.titleBn || activeDepartment.title} বই`,
            slug: activeDepartment.slug,
          },
        ];

  // Point 6: Autofocus back button on entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      backBtnRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Point 9: ArrowLeft keyboard shortcut to smoothly return to main menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Task 27: Vector Icon Resolver for 2nd Layer Subcategories
  const getSubcategoryIcon = (item: CategoryItem): React.ElementType => {
    const slug = (item.slug || '').toLowerCase();
    if (slug.includes('solved') || slug.includes('answer')) return CheckCircle2;
    if (slug.includes('prelim') || slug.includes('main')) return FileText;
    if (slug.includes('mock') || slug.includes('test')) return Award;
    if (slug.includes('optional')) return Compass;
    if (slug.includes('yearbook') || slug.includes('current')) return Calendar;
    if (slug.includes('ugb') || slug.includes('college') || slug.includes('sem')) return GraduationCap;
    if (slug.includes('school') || slug.includes('madhyamik') || slug.includes('board')) return School;
    if (slug.includes('police') || slug.includes('defense')) return ShieldCheck;
    if (slug.includes('rail') || slug.includes('ssc') || slug.includes('job') || slug.includes('tet')) return Medal;
    if (slug.includes('lit') || slug.includes('story') || slug.includes('novel')) return BookOpen;
    return BookMarked;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e293b] text-gray-800 dark:text-slate-100 font-bengali select-none">
      {/* Task 12: "← MAIN MENU" Top Back Button */}
      <button
        ref={backBtnRef}
        id="submenu-back-button"
        type="button"
        onClick={onBack}
        aria-label="মূল মেনুতে ফিরে যান"
        className="flex items-center gap-2.5 px-6 py-3.5 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700/60 text-gray-800 dark:text-slate-200 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/80 font-bold text-xs tracking-wider uppercase font-bengali transition-all cursor-pointer group focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700 focus:ring-1 focus:ring-amber-400"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-1 transition-all duration-150" />
        <span className="group-hover:text-gray-950 dark:group-hover:text-white">প্রধান মেনু (MAIN MENU)</span>
      </button>

      {/* Current Department Header */}
      <div className="px-6 pt-3.5 pb-2.5 border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
            {activeDepartment.titleBn || activeDepartment.title}
          </h3>
        </div>
      </div>

      {/* Subcategories List - Task 42: Slim Scrollbar & Task 44: Semantic Accessible Nav */}
      <nav 
        aria-label={`${activeDepartment.titleBn || activeDepartment.title} সাব-ক্যাটাগরি`}
        className="flex-1 overflow-y-auto overscroll-contain slim-scrollbar py-2"
      >
        <ul className="space-y-0.5">

          {subcategories.map((subItem) => {
            const targetUrl =
              subItem.fullPath ||
              (subItem.slug.startsWith('/category/')
                ? subItem.slug
                : `/category/${subItem.slug}`);

            const SubIcon = getSubcategoryIcon(subItem);

            return (
              <li key={subItem.id}>
                <Link
                  href={targetUrl}
                  onClick={(e) => handleSubcategoryNavigate(e, targetUrl, subItem)}
                  onPointerEnter={() => prefetchUrl(targetUrl)}

                  prefetch={true}
                  className="flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SubIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                    <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                      {subItem.titleBn || subItem.title}
                    </span>
                  </div>

                  {subItem.badge && (
                    <div className="shrink-0 ml-2">
                      <CategoryBadge badge={subItem.badge} />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

