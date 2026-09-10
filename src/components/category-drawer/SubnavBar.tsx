'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HamburgerTrigger } from './HamburgerTrigger';
import { SubnavTicker } from './SubnavTicker';
import { DEFAULT_SUBNAV_LINKS, SubnavLinkItem } from './subnavData';
import { CategoryBadge } from './CategoryBadge';
import { BulkOrderLink } from '@/components/header/BulkOrderLink';
import { SellerModeSwitch } from '@/components/header/SellerModeSwitch';
import { useCategoryAnalytics } from '@/hooks/useCategoryAnalytics';
import { useCategoryHistory } from '@/hooks/useCategoryHistory';
import { useLanguage } from '@/hooks/useLanguage';
import { useCategoryPrefetch } from '@/hooks/useCategoryPrefetch';

interface SubnavBarProps {
  className?: string;
  links?: SubnavLinkItem[];
  showEmergencyNotice?: boolean;
  onOpenCategories?: () => void;
}


/**
 * Module 3 (Part 2 & Part 9): Unified Amazon-Pattern Sub-Navigation Strip
 *
 * - Task 6: Top Sub-nav Quick Links (Bestsellers, Deals, WBCS, College, School, New, Support)
 * - Task 7: Mobile Horizontal Touch Swipe Bar (overflow-x-auto, no-scrollbar, momentum scrolling)
 * - Task 8: Direct Navigation Architecture (1-click prefetching without dropdown lag)
 * - Task 9: Amazon Signature Hover Outline Box Styling with Active Route Highlighting
 * - Task 10: Local Malda Student Hub & Emergency Notice Ticker
 * - Task 20: Instant Hover Pre-fetching via useCategoryPrefetch
 * - Task 26: Full Bilingual (bn / en) Support
 * - Task 45: Header & Sub-nav Content Separation (Order history is preserved in Header account area,
 *            while the sub-nav strip remains an uncluttered pure catalog and student browsing funnel)
 */

export const SubnavBar: React.FC<SubnavBarProps> = ({
  className = '',
  links = DEFAULT_SUBNAV_LINKS,
  showEmergencyNotice = true,
  onOpenCategories,
}) => {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { trackCategoryEvent } = useCategoryAnalytics();
  const { recordCategoryVisit } = useCategoryHistory();
  const { language } = useLanguage();
  const { prefetchUrl } = useCategoryPrefetch();


  // Check scroll boundary to conditionally show smooth scroll helpers on desktop
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    // Timing compensation for custom web fonts (Hind Siliguri) & initial render calculations
    const timer1 = setTimeout(checkScroll, 100);
    const timer2 = setTimeout(checkScroll, 350);

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        checkScroll();
      }).catch(() => {});
    }

    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <nav
      role="navigation"
      aria-label={language === 'bn' ? 'ক্যাটাগরি সাব-ন্যাভিগেশন' : 'Category sub-navigation'}
      className={`bg-[#232f3e] dark:bg-slate-900 border-t border-black/20 text-white text-xs select-none relative min-h-[39px] flex items-center font-bengali ${className}`}
    >
      <div className="max-w-[1500px] mx-auto px-2 sm:px-4 py-0.5 sm:py-1 flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Left Side: Tasks 6, 7, 8, 9 - Scrollable Sub-Nav Row */}
        <div className="relative flex-1 min-w-0 flex items-center">
          
          {/* Desktop Scroll Left Button Indicator */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label={language === 'bn' ? 'বামে স্ক্রোল করুন' : 'Scroll left'}
              className="hidden md:flex absolute left-0 z-20 w-7 h-full items-center justify-center bg-gradient-to-r from-[#232f3e] via-[#232f3e]/95 to-transparent text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Task 7: Mobile Horizontal Touch Swipe Bar (overflow-x-auto, no-scrollbar) */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Task 1: "All" Hamburger Drawer Trigger Button */}
            <div className="shrink-0">
              <HamburgerTrigger onClick={onOpenCategories} />
            </div>

            {/* Task 6: Top Sub-nav Quick Links */}
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`));
              const Icon = link.icon;
              const displayLabel = language === 'en' ? (link.labelEn || link.label) : (link.labelBn || link.label);

              return (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch={true}
                  onPointerEnter={() => prefetchUrl(link.href)}
                  onClick={() => {
                    recordCategoryVisit(link.id, link.href, displayLabel);
                    trackCategoryEvent({
                      event: 'subnav_click',
                      categoryId: link.id,
                      categoryTitle: displayLabel,
                      slug: link.href,
                      source: 'subnav',
                    });
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`amazon-nav-box shrink-0 flex items-center gap-1 py-1.5 px-2 text-gray-200 hover:text-white font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive ? '!border-amber-400 hover:!border-amber-300 text-white font-bold bg-white/5' : ''
                  }`}
                >

                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        link.iconColor ? link.iconColor : 'text-gray-300'
                      }`}
                    />
                  )}
                  <span>{displayLabel}</span>

                  {/* Task 6 & 23: Dynamic Badges ('HOT', 'NEW', 'SALE') */}
                  {link.badge && (
                    <CategoryBadge badge={link.badge} size="sm" className="ml-1 shrink-0" />
                  )}
                </Link>
              );
            })}

            {/* Task 14 (Module 2 coordination): Bulk & School Orders Link */}
            <div className="shrink-0 hidden lg:block">
              <BulkOrderLink />
            </div>
          </div>

          {/* Desktop Scroll Right Button Indicator */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label={language === 'bn' ? 'ডানে স্ক্রোল করুন' : 'Scroll right'}
              className="hidden md:flex absolute right-0 z-20 w-7 h-full items-center justify-center bg-gradient-to-l from-[#232f3e] via-[#232f3e]/95 to-transparent text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Side: Task 10 - Malda Student Hub & Ticker + Module 2 Seller Mode Switch */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 pl-1">
          {/* Task 10: Local Malda Student Hub & Emergency Store Ticker */}
          <SubnavTicker showEmergencyNotice={showEmergencyNotice} />

          {/* Module 2: Seller & Staff Mode Switcher (Isolated & Pinned) */}
          <div className="flex-shrink-0 relative pl-1 sm:pl-2 border-l border-[#3a4553]">
            <SellerModeSwitch />
          </div>
        </div>

      </div>
    </nav>
  );
};
