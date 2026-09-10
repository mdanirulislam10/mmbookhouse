'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { useCartDrawer, useCart } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { GuestCartBadge } from '@/components/cart/GuestCartBadge';
import { DrawerConfirmationCard } from '@/components/cart/DrawerConfirmationCard';

interface SideCartDrawerProps {
  className?: string;
  isOpen?: boolean;
}

/**
 * Module 10: 420px Slide-in Side Cart Drawer
 *
 * Task 1: Slide-in Canvas & Drawer State Architecture
 * - 420px-wide smooth slide-over canvas (100vw on mobile, 420px on desktop)
 * - Backdrop overlay with subtle blur and dimming (bg-black/50 backdrop-blur-xs)
 * - Cubic-bezier slide-in transition from right (translate-x-full to translate-x-0)
 *
 * Task 2: Confirmation Summary Card
 * - Embeds DrawerConfirmationCard when lastAddedItem exists
 *
 * Task 3: Robust 3-Way Dismiss Mechanism & Accessibility
 * - 1. Backdrop Click: Clicking on semi-transparent backdrop dismisses drawer.
 *      Clicks inside <aside> are isolated via stopPropagation.
 * - 2. Keyboard Escape: Global window listener for Escape key smoothly triggers closeDrawer().
 * - 3. Continue Shopping: Explicit action buttons in footer and empty state.
 * - Accessible Focus Restoration: Captures activeElement on open and restores focus on close.
 * - Focus Trap: Tab and Shift+Tab loop within focusable elements inside drawer.
 * - Safe Scroll Lock Cleanup: Body scroll locking with scrollbar width compensation and failsafe unmount cleanup.
 */
export const SideCartDrawer: React.FC<SideCartDrawerProps> = ({ className = '', isOpen }) => {
  const { isDrawerOpen: storeIsOpen, closeDrawer } = useCartDrawer();
  const isDrawerOpen = isOpen !== undefined ? isOpen : storeIsOpen;
  const { items, totalCount, subtotal, totalSavings, lastAddedItem, removeItem, updateQuantity } = useCart();
  const { language, isBengali } = useLanguage();

  const [shouldRender, setShouldRender] = useState(isDrawerOpen);
  const [isAnimatedOpen, setIsAnimatedOpen] = useState(isDrawerOpen);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // 1. Capture previously active element before drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      if (typeof document !== 'undefined' && document.activeElement && document.activeElement !== document.body) {
        previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      }
    }
  }, [isDrawerOpen]);

  // 2. Handle open/close animation lifecycle
  useEffect(() => {
    if (isDrawerOpen) {
      setShouldRender(true);
      // Double rAF ensures DOM element is rendered at translate-x-full before transitioning to translate-x-0
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimatedOpen(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsAnimatedOpen(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // matches duration-300 transition
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  // 3. Focus Restoration on Drawer Close (WCAG 2.1 AA Compliance)
  useEffect(() => {
    if (!isDrawerOpen && previouslyFocusedElementRef.current) {
      const elementToFocus = previouslyFocusedElementRef.current;
      const restoreTimer = setTimeout(() => {
        if (typeof elementToFocus.focus === 'function' && document.contains(elementToFocus)) {
          elementToFocus.focus();
        }
      }, 80);
      return () => clearTimeout(restoreTimer);
    }
  }, [isDrawerOpen]);

  // 4. Body Scroll Lock & Desktop Scrollbar Layout Shift Compensation with cleanup safety
  useEffect(() => {
    if (isDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow || '';
        document.body.style.paddingRight = originalPaddingRight || '';
      };
    }
  }, [isDrawerOpen]);

  // Failsafe unmount cleanup to guarantee no orphaned scroll lock
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // 5. Accessible Focus Trap & Global Keyboard 'Escape' Listener (Task 3 Mechanism 2)
  useEffect(() => {
    if (!isAnimatedOpen) return;

    // Focus close button on open
    const focusTimer = setTimeout(() => {
      const closeButton = drawerRef.current?.querySelector<HTMLElement>('#side-cart-close-button');
      if (closeButton) {
        closeButton.focus();
      }
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      // 3-Way Mechanism 2: Keyboard Escape listener
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }

      // Focus trap within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            el.offsetParent !== null &&
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-hidden') !== 'true'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
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
  }, [isAnimatedOpen, closeDrawer]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isAnimatedOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isAnimatedOpen}
    >
      {/* 3-Way Mechanism 1: Backdrop overlay with subtle blur and dimming (Click to Close) */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={closeDrawer}
        aria-hidden="true"
        title={isBengali ? 'কার্ট বন্ধ করতে এখানে ক্লিক করুন' : 'Click here to close cart'}
      />

      {/* Task 1 & Task 8: Responsive Smart Bottom Sheet on Mobile (75% height) & 420px Slide-over Drawer on Desktop */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={isBengali ? 'শপিং কার্ট / Shopping Cart' : 'Shopping Cart / শপিং কার্ট'}
        onClick={(e) => e.stopPropagation()} // Prevent drawer clicks from bubbling to backdrop
        className={`fixed bottom-0 left-0 right-0 w-full max-h-[75vh] h-[75vh] rounded-t-2xl sm:rounded-none sm:top-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[420px] max-w-full bg-white dark:bg-[#1a222d] text-gray-900 dark:text-gray-100 shadow-2xl flex flex-col font-bengali transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isAnimatedOpen
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        } ${className}`}
      >
        {/* Task 8: Mobile Drag / Pull Indicator Handle */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center shrink-0 bg-[#f0f2f2] dark:bg-[#131921] rounded-t-2xl">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        {/* Clean Header displaying "Shopping Cart / শপিং কার্ট", item count badge, and close button (X) */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#f0f2f2] dark:bg-[#131921] border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/40">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {isBengali ? 'শপিং কার্ট' : 'Shopping Cart'}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5 hidden xs:inline">
                    / {isBengali ? 'Shopping Cart' : 'শপিং কার্ট'}
                  </span>
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-[#ffd814] text-gray-950 rounded-full border border-amber-400 shadow-2xs shrink-0">
                  {isBengali ? `${toBengaliNumerals(totalCount)} টি বই` : `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`}
                </span>
              </div>
            </div>
          </div>

          <button
            id="side-cart-close-button"
            type="button"
            onClick={closeDrawer}
            aria-label={isBengali ? 'কার্ট ড্রয়ার বন্ধ করুন' : 'Close Cart Drawer'}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain slim-scrollbar p-4 space-y-4">
          {items.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
                <ShoppingCart className="w-8 h-8 opacity-75" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  {isBengali ? 'আপনার কার্ট বর্তমানে খালি' : 'Your Shopping Cart is empty'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isBengali
                    ? 'আপনার পছন্দের বই খুঁজে নিয়ে কার্টে যোগ করুন এবং এক ক্লিকে অর্ডার করুন।'
                    : 'Explore our vast catalog of competitive exam, school, and college books.'}
                </p>
              </div>

              {/* 3-Way Mechanism 3 (Empty state): Continue Shopping */}
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-950 font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer"
              >
                <span>{isBengali ? 'কেনাকাটা চালিয়ে যান (বইয়ের ক্যাটালগ দেখুন)' : 'Continue Shopping / কেনাকাটা চালিয়ে যান'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Filled Cart Items List */
            <div className="space-y-4">
              {/* Module 10 (Task 2): Dedicated Confirmation Summary Card when lastAddedItem exists */}
              {lastAddedItem && (
                <DrawerConfirmationCard
                  item={lastAddedItem}
                  onCloseDrawer={closeDrawer}
                />
              )}

              <div className="space-y-2">
                {lastAddedItem && (
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 pt-1">
                    {isBengali ? 'কার্টের অন্যান্য বইসমূহ' : 'Other items in cart'}
                  </h4>
                )}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 flex gap-3 items-start">
                      {/* Cover Image Thumbnail */}
                      <div className="w-14 h-18 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-amber-600 opacity-60" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                          {isBengali ? item.titleBn : item.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {item.author}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-gray-950 dark:text-white font-mono">
                              {formatINR(item.price, language)}
                            </span>
                            {item.mrp > item.price && (
                              <span className="text-[10px] text-gray-400 line-through font-mono">
                                {formatINR(item.mrp, language)}
                              </span>
                            )}
                          </div>

                          {/* Quantity and Delete */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="সংখ্যা কমান"
                                className="px-2 py-0.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-bold font-mono text-gray-800 dark:text-gray-200">
                                {isBengali ? toBengaliNumerals(item.quantity) : item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label="সংখ্যা বাড়ান"
                                className="px-2 py-0.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`${item.title} কার্ট থেকে মুছে ফেলুন`}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guest Cart Badge */}
              <div className="pt-2">
                <GuestCartBadge variant="pill" className="w-full justify-center" />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Summary & Checkout CTAs */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#131921] p-4 shrink-0 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {isBengali ? 'সাবটোটাল (Subtotal):' : 'Subtotal:'}
                </span>
                <span className="text-base font-black text-gray-950 dark:text-white font-mono">
                  {formatINR(subtotal, language)}
                </span>
              </div>
              {totalSavings > 0 && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-right font-medium">
                  {isBengali
                    ? `মোট সাশ্রয়: ${formatINR(totalSavings, language)}`
                    : `Total Savings: ${formatINR(totalSavings, language)}`}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="w-full py-2.5 px-3 text-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-xs shadow-2xs transition-colors cursor-pointer"
              >
                {isBengali ? 'কার্ট দেখুন' : 'View Cart'}
              </Link>
              {/* Task 9: Primary Amazon Yellow CTA with item count and subtotal */}
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="w-full py-2.5 px-3 text-center bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 font-bold rounded-lg border border-[#fcd200] shadow-xs text-xs transition-all cursor-pointer truncate"
              >
                {isBengali
                  ? `অর্ডার সম্পন্ন করুন (${toBengaliNumerals(totalCount)}টি বই - ${formatINR(subtotal, language)})`
                  : `Proceed to Buy (${totalCount} ${totalCount === 1 ? 'item' : 'items'} - ${formatINR(subtotal, language)})`}
              </Link>
            </div>

            {/* 3-Way Mechanism 3 (Footer action): Continue Shopping */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={closeDrawer}
                className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold hover:underline cursor-pointer py-1 px-3 rounded inline-flex items-center gap-1 transition-colors"
              >
                <span>{isBengali ? '← কেনাকাটা চালিয়ে যান (Continue Shopping)' : '← Continue Shopping / কেনাকাটা চালিয়ে যান'}</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
