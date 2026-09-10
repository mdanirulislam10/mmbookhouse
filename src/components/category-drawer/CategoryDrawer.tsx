'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { DrawerHeader } from './DrawerHeader';
import { DrawerSections } from './DrawerSections';
import { SubmenuPanel } from './SubmenuPanel';
import { CategoryItem } from '@/types/category-drawer';
import { useCategoryData } from '@/hooks/useCategoryData';
import { useCategoryAnalytics } from '@/hooks/useCategoryAnalytics';

interface CategoryDrawerProps {
  className?: string;
  categories?: CategoryItem[];
}

/**
 * Tasks 2, 3, 11 & 12: Mega Category Slide-over Drawer with 2-Layer Drill-Down
 * - Task 2: 350px desktop / 85vw mobile smooth slide-in canvas with dark blur backdrop (z-[90])
 * - Task 3: 3-way closing mechanisms (Top-right 'X', Backdrop click, Keyboard 'ESC')
 * - Task 11: 2nd-layer slide panel architecture with smooth horizontal transition
 * - Task 12: "← MAIN MENU" back navigation button with slide-back animation
 * - Task 16 & 17: Dynamic Category Tree Fetching & Next.js ISR integration
 * - Bidirectional Browser History popstate synchronization with zero stack pollution
 * - WCAG 2.1 AA compliant keyboard focus trap (Tab/Shift+Tab cycling & autofocus on open)
 * - Desktop scrollbar layout shift compensation via document.body.style.paddingRight
 * - Conflict-free mobile touch swipe-to-close (|deltaX| > |deltaY| * 1.5)
 * - Tasks 46 & 47: Category Affinity & Open/Close Event Telemetry
 */
export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  className = '',
  categories,
}) => {
  const router = useRouter();
  const { isOpen, closeDrawer, activeSubmenu, setActiveSubmenu } = useCategoryDrawer();
  const { categories: dynamicCategories, isLoading } = useCategoryData();
  const effectiveCategories = categories && categories.length > 0 ? categories : dynamicCategories;
  const { trackCategoryEvent } = useCategoryAnalytics();

  // Defect 4 & Task 41: Smooth 60fps GPU slide-in and slide-out animation retention
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatedOpen, setIsAnimatedOpen] = useState(false);
  const isNavigatingBackToMainRef = useRef(false);
  const [displayedSubmenu, setDisplayedSubmenu] = useState<CategoryItem | null>(activeSubmenu);

  // Keep displayedSubmenu rendered during 260ms slide-back animation so panel doesn't vanish abruptly
  useEffect(() => {
    if (activeSubmenu) {
      setDisplayedSubmenu(activeSubmenu);
    } else {
      const timer = setTimeout(() => {
        setDisplayedSubmenu(null);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [activeSubmenu]);

  useEffect(() => {
    if (isOpen) {
      trackCategoryEvent({ event: 'drawer_open', source: 'header' });
      setShouldRender(true);
      // Double requestAnimationFrame guarantees initial -100% transform is rendered before transitioning to 0
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimatedOpen(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      trackCategoryEvent({ event: 'drawer_close', source: 'drawer' });
      setIsAnimatedOpen(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen, trackCategoryEvent]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const lastClickedDepartmentIdRef = useRef<string | null>(null);

  // Touch gesture tracking for Mobile Swipe-to-Close (Task 33)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Point 6 & 7: Hierarchical Back to Main Menu Handler (with department button focus restoration & history back)
  const handleBackToMainMenu = useCallback(() => {
    setActiveSubmenu(null);
    if (typeof window !== 'undefined' && window.history.state?.drawerLayer === 2) {
      isNavigatingBackToMainRef.current = true;
      window.history.back();
      setTimeout(() => {
        isNavigatingBackToMainRef.current = false;
      }, 150);
    }
    setTimeout(() => {
      if (lastClickedDepartmentIdRef.current && drawerRef.current) {
        const deptBtn = drawerRef.current.querySelector<HTMLElement>(
          `button[data-dept-id="${lastClickedDepartmentIdRef.current}"]`
        );
        deptBtn?.focus();
      } else if (drawerRef.current) {
        const firstBtn = drawerRef.current.querySelector<HTMLElement>(
          '#category-drawer-close-button, button, [href]'
        );
        firstBtn?.focus();
      }
    }, 60);
  }, [setActiveSubmenu]);

  // Point 7 & Task 43: UI Action Close handler (X button, Backdrop click, or Swipe-to-close)
  // Ensures bidirectional multi-layer sync with browser history stack without creating phantom back entries
  // Restores focus safely to trigger button without jump or race conditions (WCAG 2.1 AA Compliance)
  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.history.state?.drawerLayer === 2) {
        window.history.go(-2);
      } else if (window.history.state?.categoryDrawerOpen) {
        window.history.back();
      }
    }
    closeDrawer();
    setActiveSubmenu(null);

    setTimeout(() => {
      const mobileTrigger = document.getElementById('category-hamburger-trigger-mobile');
      const desktopTrigger = document.getElementById('category-hamburger-trigger');

      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function' &&
        previouslyFocusedElementRef.current !== document.body &&
        document.contains(previouslyFocusedElementRef.current)
      ) {
        previouslyFocusedElementRef.current.focus();
      } else if (mobileTrigger && window.innerWidth < 768) {
        mobileTrigger.focus();
      } else if (desktopTrigger) {
        desktopTrigger.focus();
      }
    }, 60);
  }, [closeDrawer, setActiveSubmenu]);

  const isProgrammaticNavRef = useRef(false);

  // Defect 3 & Task 8: Safe Link Navigation with Clean History Unwinding
  // Prevents race conditions between history.go(-2) and router.push(url)
  const handleNavigate = useCallback(
    (url: string) => {
      closeDrawer();
      setActiveSubmenu(null);

      if (typeof window === 'undefined') {
        router.push(url);
        return;
      }

      const hasLayer2 = window.history.state?.drawerLayer === 2;
      const hasLayer1 = window.history.state?.categoryDrawerOpen;

      if (hasLayer2 || hasLayer1) {
        isProgrammaticNavRef.current = true;
        const targetDelta = hasLayer2 ? -2 : -1;

        const handleNavPop = () => {
          window.removeEventListener('popstate', handleNavPop);
          isProgrammaticNavRef.current = false;
          router.push(url);
        };

        window.addEventListener('popstate', handleNavPop);
        window.history.go(targetDelta);

        // Safety fallback timer if popstate is delayed
        setTimeout(() => {
          window.removeEventListener('popstate', handleNavPop);
          if (isProgrammaticNavRef.current) {
            isProgrammaticNavRef.current = false;
            router.push(url);
          }
        }, 150);
      } else {
        router.push(url);
      }
    },
    [closeDrawer, setActiveSubmenu, router]
  );


  // 1. WCAG 2.1 AA Compliant Keyboard Focus Trap & Autofocus Management
  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element to restore when drawer closes
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Autofocus Close button or first focusable element inside drawer once rendered
    const focusTimer = setTimeout(() => {
      if (!drawerRef.current) return;
      const closeBtn = drawerRef.current.querySelector<HTMLElement>(
        '#category-drawer-close-button, button[aria-label*="ক্যাটাগরি মেনু বন্ধ করুন"]'
      );
      if (closeBtn) {
        closeBtn.focus();
      } else {
        const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Hierarchical Escape: if inside 2nd layer submenu, slide back to main menu first
        if (useCategoryDrawer.getState().activeSubmenu) {
          handleBackToMainMenu();
        } else {
          handleClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;

        // Point 5: Filter out elements that are inside invisible or aria-hidden panels
        const focusableElements = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !el.hasAttribute('disabled') &&
            el.offsetParent !== null &&
            !el.closest('.invisible') &&
            el.getAttribute('aria-hidden') !== 'true'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element or focus is outside drawer, cycle to last
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element or focus is outside drawer, cycle to first
          if (document.activeElement === lastElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, handleBackToMainMenu]);


  // 2. Body Scroll Locking & Desktop Scrollbar Layout Shift Compensation
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Compute scrollbar width to prevent desktop layout shift (jank)
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // 3. Point 7: Android / Browser History Back-button integration (Multi-Layer Bidirectional Sync)
  useEffect(() => {
    if (!isOpen) return;

    // Push Layer 1 history state if not already pushed
    if (typeof window !== 'undefined' && !window.history.state?.categoryDrawerOpen) {
      window.history.pushState({ categoryDrawerOpen: true, drawerLayer: 1 }, '');
    }

    const handlePopState = () => {
      // If a programmatic navigation is currently popping drawer history entries, ignore here
      if (isProgrammaticNavRef.current) {
        return;
      }

      // If user clicked the Main Menu button, the history state was already handled
      if (isNavigatingBackToMainRef.current) {
        isNavigatingBackToMainRef.current = false;
        return;
      }

      // Browser back button was pressed; state has already been popped by browser.
      // Point 7: If user was inside 2nd layer submenu, step back to main menu first!
      if (useCategoryDrawer.getState().activeSubmenu) {
        setActiveSubmenu(null);
        setTimeout(() => {
          if (lastClickedDepartmentIdRef.current && drawerRef.current) {
            const deptBtn = drawerRef.current.querySelector<HTMLElement>(
              `button[data-dept-id="${lastClickedDepartmentIdRef.current}"]`
            );
            deptBtn?.focus();
          }
        }, 60);
        return;
      }

      // If at layer 1, close drawer
      closeDrawer();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, closeDrawer, setActiveSubmenu]);

  // Point 7: Push Layer 2 history state when entering a submenu
  useEffect(() => {
    if (!isOpen) return;

    if (activeSubmenu) {
      if (typeof window !== 'undefined' && window.history.state?.drawerLayer !== 2) {
        window.history.pushState({ categoryDrawerOpen: true, drawerLayer: 2 }, '');
      }
    }
  }, [isOpen, activeSubmenu]);

  // 4. Mobile Touch Swipe-to-Close Listeners (Guarded against vertical scroll conflict - Task 33)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentXRef.current = e.touches[0].clientX;
    touchCurrentYRef.current = e.touches[0].clientY;
  };

  // Defect 6: Reset touch coordinates on gesture interruption or incoming call
  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchCurrentXRef.current = null;
    touchCurrentYRef.current = null;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null &&
      touchCurrentXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchCurrentYRef.current !== null
    ) {
      const deltaX = touchCurrentXRef.current - touchStartXRef.current;
      const deltaY = touchCurrentYRef.current - touchStartYRef.current;
      const duration = Date.now() - touchStartTimeRef.current;
      const isQuickFlick = duration < 300;

      // Defect 7: Predominantly horizontal swipe leftward to close - Layer 1 only
      if (
        !activeSubmenu &&
        (deltaX < -50 || (isQuickFlick && deltaX < -30)) &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        handleClose();
      }
      // Task 33 (Bonus): Swipe rightward in 2nd layer to slide back to main menu
      else if (
        activeSubmenu &&
        (deltaX > 50 || (isQuickFlick && deltaX > 30)) &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        handleBackToMainMenu();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchCurrentXRef.current = null;
    touchCurrentYRef.current = null;
  };

  // Defect 4: Keep drawer rendered during 250ms closing animation
  if (!shouldRender && !isOpen) {
    return null;
  }

  return (
    <div
      id="category-mega-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="সকল বিভাগ ও মেগা মেনু"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[90] select-none ${
        isOpen ? 'visible pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Task 3 (Method 2) & Task 32: Backdrop Blur & Dark Overlay (z-[90]) */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-[4px] touch-none overscroll-contain overscroll-y-contain transition-opacity duration-250 ease-out cursor-pointer ${
          isAnimatedOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Task 2 & Task 41: GPU Hardware-Accelerated Canvas Container (350px Desktop, 85vw Mobile, z-[90]) */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className={`fixed top-0 bottom-0 left-0 z-[90] w-[85vw] sm:w-[350px] max-w-[380px] bg-white dark:bg-[#1e293b] text-gray-800 dark:text-slate-100 shadow-2xl flex flex-col drawer-canvas-gpu ${
          isAnimatedOpen ? 'drawer-canvas-open' : ''
        } overscroll-contain overscroll-y-contain font-bengali ${className}`}
      >
        {/* Task 4: Customer Greeting Banner & Top-right Close Button */}
        <DrawerHeader onClose={handleClose} onNavigate={handleNavigate} />

        {/* Task 11: 2nd-Layer Sliding 2-Panel Viewport */}
        <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#1e293b]">
          {/* Panel 1: Root Drawer Sections (Main Menu) - Task 41 GPU Transform, Task 42 Slim Scrollbar & Task 44 Semantic Nav */}
          <nav
            role="navigation"
            aria-label="প্রধান বিভাগ ও ক্যাটাগরি তালিকা"
            aria-hidden={Boolean(activeSubmenu)}
            className={`absolute inset-0 overflow-y-auto overscroll-contain overscroll-y-contain slim-scrollbar drawer-panel-layer ${
              activeSubmenu ? 'drawer-panel-left pointer-events-none' : 'drawer-panel-center'
            }`}
          >
            <DrawerSections
              categories={effectiveCategories}
              isLoading={isLoading}
              onClose={handleClose}
              onNavigate={handleNavigate}
              onSelectCategory={(dept) => {
                lastClickedDepartmentIdRef.current = dept.id;
                setActiveSubmenu(dept);
              }}
            />
          </nav>

          {/* Panel 2: Task 11 & 12 2nd Layer Submenu Panel - Task 41 GPU Transform, Task 42 Slim Scrollbar & Task 44 Semantic Nav */}
          <nav
            role="navigation"
            aria-label="সাব-ক্যাটাগরি ড্রিল-ডাউন তালিকা"
            aria-hidden={!activeSubmenu}
            className={`absolute inset-0 drawer-panel-layer overscroll-contain overscroll-y-contain slim-scrollbar ${
              activeSubmenu ? 'drawer-panel-center' : 'drawer-panel-right pointer-events-none'
            }`}
          >
            {displayedSubmenu && (
              <SubmenuPanel
                activeDepartment={displayedSubmenu}
                onBack={handleBackToMainMenu}
                onClose={handleClose}
                onNavigate={handleNavigate}
              />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

