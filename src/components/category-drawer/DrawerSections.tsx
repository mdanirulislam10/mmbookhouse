'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  School, 
  Briefcase, 
  Library, 
  TrendingUp, 
  Flame, 
  Percent, 
  Clock, 
  User, 
  Package, 
  PhoneCall, 
  Building2, 
  LogOut, 
  Globe, 
  Headset, 
  MessageSquare, 
  Compass, 
  Medal, 
  Tablet, 
  BookMarked, 
  HelpCircle, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { useCategoryPrefetch } from '@/hooks/useCategoryPrefetch';
import { useCategoryHistory } from '@/hooks/useCategoryHistory';
import { useCategoryAnalytics } from '@/hooks/useCategoryAnalytics';
import { DrawerSkeleton } from './DrawerSkeleton';
import { CategoryBadge } from './CategoryBadge';
import { CategoryItem } from '@/types/category-drawer';
import { performCompleteSignOut } from '@/lib/auth/signOutHelper';


export interface DrawerSectionsProps {
  categories?: CategoryItem[];
  isLoading?: boolean;
  onClose?: () => void;
  onSelectCategory?: (category: CategoryItem) => void;
  onNavigate?: (url: string) => void;
}

// Task 27: Specific Vector Category Icons for Core Departments
const DEFAULT_DEPARTMENTS: (CategoryItem & { icon: React.ElementType })[] = [
  {
    id: 'dept-wbcs',
    title: 'WBCS & Civil Services',
    titleBn: 'ডাব্লুবিসিএস ও সিভিল সার্ভিস',
    slug: 'wbcs',
    hasSubcategories: true,
    icon: Compass,
  },
  {
    id: 'dept-college',
    title: 'College & University Books (UGB & Others)',
    titleBn: 'কলেজ ও বিশ্ববিদ্যালয় পাঠ্যবই',
    slug: 'college-books',
    hasSubcategories: true,
    icon: GraduationCap,
  },
  {
    id: 'dept-school',
    title: 'School Education (WBBSE, WBCHSE, CBSE)',
    titleBn: 'স্কুল শিক্ষাক্রম (ক্লাস ১-১২)',
    slug: 'school-books',
    hasSubcategories: true,
    icon: School,
  },
  {
    id: 'dept-gov-jobs',
    title: 'Competitive Exams (Rail, SSC, Police, TET)',
    titleBn: 'চাকরির পরীক্ষা (রেল, SSC, পুলিশ, TET)',
    slug: 'competitive-exams',
    hasSubcategories: true,
    icon: Medal,
  },
  {
    id: 'dept-literature',
    title: 'Literature & General Books',
    titleBn: 'সাহিত্য, উপন্যাস ও কিশোর সাহিত্য',
    slug: 'literature',
    hasSubcategories: true,
    icon: BookOpen,
  },
];

/**
 * Task 5: Drawer Root Section Partitioning
 * Partitions drawer content into 4 primary sections:
 * 1. ডিজিটাল কন্টেন্ট ও স্পেশালস (Digital & Specials)
 * 2. পড়াশোনা ও পরীক্ষা (Shop by Department) - Dynamic / Fallback
 * 3. ট্রেন্ডিং ও অফার (Trending & Programs)
 * 4. হেল্প ও সেটিংস (Help & Settings)
 */
export const DrawerSections: React.FC<DrawerSectionsProps> = ({
  categories,
  isLoading = false,
  onClose,
  onSelectCategory,
  onNavigate,
}) => {
  const router = useRouter();
  const { closeDrawer, user, setUser } = useCategoryDrawer();
  const { isLoggedIn, signOut } = useUserRole();
  const { isLoggedIn: isAuthLoggedIn } = useAuthSession();
  const { language, setLanguage } = useLanguage();
  const { prefetchUrl } = useCategoryPrefetch();
  const dict = getHeaderDictionary(language);

  // Defect 3: Safe link navigation unwinding drawer history before route change
  const handleLinkNavigate = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http')) {
      if (onClose) onClose();
      else closeDrawer();
      return;
    }
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else {
      if (onClose) {
        onClose();
      } else {
        closeDrawer();
      }
      setTimeout(() => {
        router.push(href);
      }, 60);
    }
  };

  // Task 29: Theme Mode (Dark / Light) with system preference detection and localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (typeof window !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  // Task 18: Shimmer Skeleton during dynamic loading
  if (isLoading && (!categories || categories.length === 0)) {
    return <DrawerSkeleton />;
  }

  const userIsLoggedIn = user?.isLoggedIn || isLoggedIn || isAuthLoggedIn;

  // Task 46: Category Browsing Preference Tracking
  const { preferredDepartmentId, recordCategoryVisit } = useCategoryHistory();
  // Task 47: Category Engagement Event Analytics
  const { trackCategoryEvent } = useCategoryAnalytics();

  // 1. Digital & Specials Departments (Drill-down enabled)
  const digitalDepartments: CategoryItem[] = [
    {
      id: 'dept-specials',
      title: 'Specials & Collector Editions',
      titleBn: 'এম.এম বুক হাউস স্পেশাল ও সংগ্রাহক সংস্করণ',
      slug: 'specials',
      hasSubcategories: true,
    },
    {
      id: 'dept-ebooks',
      title: 'E-Books & Syllabus Guidelines',
      titleBn: 'ই-বুক ও সিলেবাস গাইডলাইন (PDF)',
      slug: 'ebooks',
      hasSubcategories: true,
    },
  ];

  // 2. Dynamic Categories with Default Departments Fallback
  const displayDepartments = categories && categories.length > 0 ? categories : DEFAULT_DEPARTMENTS;

  // Task 46: Smart Recommended Department Prioritization
  const sortedDepartments = React.useMemo(() => {
    if (!preferredDepartmentId) return displayDepartments;
    const preferredIndex = displayDepartments.findIndex(
      (d) => d.id === preferredDepartmentId || d.slug === preferredDepartmentId
    );
    if (preferredIndex <= 0) return displayDepartments;
    const preferred = displayDepartments[preferredIndex];
    const rest = displayDepartments.filter((_, idx) => idx !== preferredIndex);
    return [preferred, ...rest];
  }, [displayDepartments, preferredDepartmentId]);

  // Task 27: Dynamic Icon Resolver
  const getCategoryIcon = (dept: CategoryItem): React.ElementType => {
    if ('icon' in dept && (dept as unknown as { icon: React.ElementType }).icon) {
      return (dept as unknown as { icon: React.ElementType }).icon;
    }
    const slug = dept.slug?.toLowerCase() || '';
    if (slug.includes('wbcs') || slug.includes('civil')) return Compass;
    if (slug.includes('college') || slug.includes('university') || slug.includes('ugb') || slug.includes('sem')) return GraduationCap;
    if (slug.includes('school') || slug.includes('board') || slug.includes('madhyamik') || slug.includes('wbbse')) return School;
    if (slug.includes('competitive') || slug.includes('exam') || slug.includes('job') || slug.includes('police') || slug.includes('rail') || slug.includes('tet')) return Medal;
    if (slug.includes('lit') || slug.includes('story') || slug.includes('novel') || slug.includes('poetry')) return BookOpen;
    if (slug.includes('special') || slug.includes('rare') || slug.includes('boxset')) return Sparkles;
    if (slug.includes('ebook') || slug.includes('syllabus') || slug.includes('pdf')) return Tablet;
    return BookMarked;
  };

  // 3. Task 22: Trending, Movers & Shakers, and Deals (Bilingual support)
  const isEn = language === 'en';
  const trendingItems = [
    {
      title: isEn ? 'Top 10 Books This Week' : 'এই সপ্তাহের টপ ১০ বই (Top 10)',
      href: '/bestsellers',
      icon: TrendingUp,
      badge: 'TOP 10',
    },
    {
      title: isEn ? 'Movers & Shakers' : 'Movers & Shakers (সর্বাধিক পঠিত)',
      href: '/trending',
      icon: Flame,
      badge: 'HOT',
    },
    {
      title: isEn ? "Today's Flash Deals" : 'আজকের ফ্ল্যাশ ডিলস (Deals)',
      href: '/deals',
      icon: Sparkles,
      badge: 'DEAL',
    },
    {
      title: isEn ? 'Up to 50% Off Clearance' : '৫০% পর্যন্ত বিশেষ ছাড় (Clearance)',
      href: '/deals',
      icon: Percent,
      badge: '50% OFF',
    },
    {
      title: isEn ? 'New Arrivals' : 'নতুন প্রকাশিত বই (New Arrivals)',
      href: '/new-arrivals',
      icon: Clock,
      badge: 'NEW',
    },
  ];

  // 4. Tasks 25, 36 & 37: Help, Settings, Account & B2B Bulk Orders
  const helpItems = [
    {
      title: isEn ? 'Your Account' : 'আপনার অ্যাকাউন্ট (Your Account)',
      href: '/account',
      icon: User,
    },
    {
      title: isEn ? 'Track Orders' : 'অর্ডার ট্র্যাকিং (Track Orders)',
      href: '/orders',
      icon: Package,
    },
    {
      title: isEn ? 'School & Bulk Orders (Request-a-Quote)' : 'স্কুল ও কোচিং বাল্ক অর্ডার (Request-a-Quote)',
      href: '/bulk-order',
      icon: Building2,
      badge: 'B2B',
    },
    {
      title: isEn ? 'Customer Care & Support' : 'গ্রাহক সেবা ও সহায়তা (Customer Care)',
      href: '/support',
      icon: HelpCircle,
    },
  ];

  const handleDepartmentClick = (dept: CategoryItem) => {
    // Task 46 & 47: Record category preference & track engagement event
    const titleToLog = isEn ? dept.title : (dept.titleBn || dept.title);
    recordCategoryVisit(dept.id, dept.slug, titleToLog);
    trackCategoryEvent({
      event: 'category_select',
      categoryId: dept.id,
      categoryTitle: titleToLog,
      slug: dept.slug,
      source: 'drawer',
    });

    if (onSelectCategory) {
      onSelectCategory(dept);
    } else {
      if (onClose) onClose();
      else closeDrawer();
    }
  };


  const handleSignOut = () => {
    if (onClose) onClose();
    else closeDrawer();
    signOut();
    setUser({ isLoggedIn: false, name: undefined, email: undefined });
    performCompleteSignOut('/');
  };

  return (
    <nav aria-label={isEn ? 'Department & Help Menu' : 'বিভাগ ও সহায়িকা মেনু'} className="py-2 text-gray-800 dark:text-slate-100 font-bengali select-none">
      {/* SECTION 1: ডিজিটাল কন্টেন্ট ও স্পেশালস */}
      <section aria-labelledby="drawer-sec-digital-heading" className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2">
        <h3 id="drawer-sec-digital-heading" className="px-6 pt-2.5 pb-1.5 text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase font-bengali">
          {isEn ? 'Digital Content & Specials' : 'ডিজিটাল কন্টেন্ট ও স্পেশালস'}
        </h3>
        <ul className="space-y-0.5">
          {digitalDepartments.map((dept) => {
            const IconComponent = getCategoryIcon(dept);
            const deptTitle = isEn ? dept.title : (dept.titleBn || dept.title);
            return (
              <li key={dept.id}>
                <button
                  type="button"
                  data-dept-id={dept.id}
                  onClick={() => handleDepartmentClick(dept)}
                  className="w-full flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                    <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                      {deptTitle}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all duration-150 shrink-0 ml-2" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 2: পড়াশোনা ও পরীক্ষা (Shop by Department) */}
      <section aria-labelledby="drawer-sec-dept-heading" className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2">
        <h3 id="drawer-sec-dept-heading" className="px-6 pt-2.5 pb-1.5 text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase font-bengali">
          {isEn ? 'Shop by Department' : 'বিভাগ অনুযায়ী বই (Shop by Department)'}
        </h3>
        <ul className="space-y-0.5">
          {sortedDepartments.map((dept) => {
            const IconComponent = getCategoryIcon(dept);
            const isRecommended = dept.id === preferredDepartmentId || dept.slug === preferredDepartmentId;
            const deptTitle = isEn ? dept.title : (dept.titleBn || dept.title);
            return (
              <li key={dept.id}>
                <button
                  type="button"
                  data-dept-id={dept.id}
                  onClick={() => handleDepartmentClick(dept)}
                  className="w-full flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                    <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                      {deptTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isRecommended && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/40">
                        {isEn ? 'For You' : 'আপনার পছন্দ'}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all duration-150" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 3: ট্রেন্ডিং ও অফার */}
      <section aria-labelledby="drawer-sec-trending-heading" className="border-b border-gray-200 dark:border-slate-700/60 pb-3 mb-2">
        <h3 id="drawer-sec-trending-heading" className="px-6 pt-2.5 pb-1.5 text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase font-bengali">
          {isEn ? 'Trending & Offers' : 'ট্রেন্ডিং ও অফার'}
        </h3>
        <ul className="space-y-0.5">
          {trendingItems.map((item, idx) => (
            <li key={idx}>
              <Link
                href={item.href}
                onClick={(e) => handleLinkNavigate(e, item.href)}
                onPointerEnter={() => prefetchUrl(item.href)}
                className="flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                  <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                    {item.title}
                  </span>
                </div>
                {item.badge && <CategoryBadge badge={item.badge} />}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 4: হেল্প ও সেটিংস */}
      <section aria-labelledby="drawer-sec-help-heading" className="pb-4">
        <h3 id="drawer-sec-help-heading" className="px-6 pt-2.5 pb-1.5 text-xs font-bold text-gray-900 dark:text-slate-200 tracking-wider uppercase font-bengali">
          {isEn ? 'Help & Settings' : 'সহায়তা ও সেটিংস'}
        </h3>

        <ul className="space-y-0.5">
          {/* Mobile Language Switcher */}
          <li>
            <div className="flex items-center justify-between px-6 py-2.5 text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/80 border-y border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-medium text-xs text-gray-800 dark:text-slate-200">{dict.drawer.languageToggle}</span>
              </div>
              <div className="flex items-center bg-gray-200 dark:bg-slate-700 p-1 rounded-lg text-xs font-bold font-outfit">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-md transition-all cursor-pointer flex items-center justify-center ${
                    language === 'bn' ? 'bg-amber-400 text-gray-950 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-md transition-all cursor-pointer flex items-center justify-center ${
                    language === 'en' ? 'bg-amber-400 text-gray-950 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </li>

          {/* Theme Mode Switcher (Dark / Light) */}
          <li>
            <div className="flex items-center justify-between px-6 py-2.5 text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-medium text-xs text-gray-800 dark:text-slate-200">
                  {language === 'bn' ? 'থিম মোড (Theme)' : 'Theme Mode'}
                </span>
              </div>
              <div className="flex items-center bg-gray-200 dark:bg-slate-700 p-1 rounded-lg text-xs font-bold font-outfit">
                <button
                  type="button"
                  onClick={() => toggleTheme(false)}
                  aria-label="Light Mode"
                  className={`px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isDarkMode ? 'bg-amber-400 text-gray-950 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme(true)}
                  aria-label="Dark Mode"
                  className={`px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDarkMode ? 'bg-amber-400 text-gray-950 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </li>

          {/* Direct 1-Tap Click-to-Call Helpline Card */}
          <li className="px-6 py-2">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-800 dark:to-slate-800/60 rounded-lg border border-amber-200 dark:border-amber-600/30 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Headset className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{language === 'bn' ? 'মালদা স্টোর হেল্পলাইন' : 'Malda Store Helpline'}</span>
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 font-outfit">
                  {language === 'bn' ? '১০টা - ৯টা খোলা' : 'Open 10am-9pm'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-tight">
                {language === 'bn'
                  ? 'বইয়ের খোঁজ, অর্ডার নিশ্চিতকরণ বা তথ্যের জন্য সরাসরি কল বা চ্যাট করুন:'
                  : 'Call or chat directly for book queries, order assistance & store pickup:'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:+919800123456"
                  onClick={closeDrawer}
                  className="flex-1 min-h-[44px] py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>কল: ৯৮০০১ ২৩৪৫৬</span>
                </a>
                <a
                  href="https://wa.me/919733000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeDrawer}
                  className="min-h-[44px] py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </li>

          {helpItems.map((item, idx) => {
            const isDirectExternal = item.href.startsWith('tel:') || item.href.startsWith('http');
            return (
              <li key={idx}>
                {isDirectExternal ? (
                  <a
                    href={item.href}
                    onClick={closeDrawer}
                    className="flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                      <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                        {item.title}
                      </span>
                    </div>
                    {item.badge && <CategoryBadge badge={item.badge} />}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={(e) => handleLinkNavigate(e, item.href)}
                    onPointerEnter={() => prefetchUrl(item.href)}
                    className="flex items-center justify-between px-6 py-3 min-h-[48px] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-150 shrink-0" />
                      <span className="truncate group-hover:translate-x-1 transition-transform duration-150 font-normal group-hover:font-medium">
                        {item.title}
                      </span>
                    </div>
                    {item.badge && <CategoryBadge badge={item.badge} />}
                  </Link>
                )}
              </li>
            );
          })}

          {/* Real Sign Out when user is logged in */}
          {userIsLoggedIn && (
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-6 py-3 min-h-[48px] text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-150 text-left group cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 group-hover:scale-110 transition-transform duration-150" />
                <span className="group-hover:translate-x-1 transition-transform duration-150 font-medium">
                  {dict.drawer.signOut}
                </span>
              </button>
            </li>
          )}
        </ul>
      </section>

      {/* Task 39: Community & Social Media Connect */}
      <section aria-labelledby="drawer-sec-social-heading" className="px-6 pt-3 pb-6 border-t border-gray-200 dark:border-slate-700/60 mt-1">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium mb-2.5">
          <span id="drawer-sec-social-heading">{language === 'bn' ? 'আমাদের সাথে যুক্ত থাকুন:' : 'Connect with us:'}</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-outfit">M.M Book House</span>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="https://facebook.com/mmbookhousemalda"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ফেসবুক পেজ - এম.এম বুক হাউস মালদা"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all duration-150 shadow-xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href="https://youtube.com/@mmbookhousemalda"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ইউটিউব চ্যানেল - এম.এম বুক হাউস মালদা"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#FF0000] hover:text-white dark:hover:bg-[#FF0000] dark:hover:text-white text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all duration-150 shadow-xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
          <a
            href="https://wa.me/919733000000"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="হোয়াটসঅ্যাপ হেল্পডেস্ক ও অর্ডার"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] dark:hover:text-white text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all duration-150 shadow-xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </a>
          <a
            href="https://t.me/mmbookhousemalda"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="টেলিগ্রাম স্টুডেন্ট কমিউনিটি"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#229ED9] hover:text-white dark:hover:bg-[#229ED9] dark:hover:text-white text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all duration-150 shadow-xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </a>
        </div>
      </section>
    </nav>
  );
};
