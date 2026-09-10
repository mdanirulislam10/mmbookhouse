'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Tag, ChevronDown, CheckCircle2, X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR } from '@/lib/utils/currency';
import { AppLanguage } from '@/types/header';
import { AppliedCouponResult } from '@/types/cart';
import { AvailableCouponsPills } from '@/components/cart/AvailableCouponsPills';

export interface AppliedCouponInfo {
  code: string;
  discountAmount?: number;
  title?: string;
  titleBn?: string;
  message?: string;
  messageBn?: string;
}

export interface CartCouponBoxProps {
  /**
   * Currently applied coupon details, or null if no coupon applied.
   */
  appliedCoupon?: AppliedCouponResult | AppliedCouponInfo | null;

  /**
   * Callback when customer applies a coupon code.
   * Return true/void for success, false or string for error message.
   */
  onApplyCoupon?: (code: string) => Promise<boolean | string | void> | boolean | string | void;

  /**
   * Callback when customer removes the currently applied coupon.
   */
  onRemoveCoupon?: () => Promise<void> | void;

  /**
   * Initial or default open state for the accordion.
   */
  defaultExpanded?: boolean;

  /**
   * External error message override.
   */
  errorMessage?: string;

  /**
   * External success message override.
   */
  successMessage?: string;

  /**
   * External loading state override.
   */
  isLoading?: boolean;

  /**
   * Language override ('bn' | 'en'). Defaults to active app language.
   */
  language?: AppLanguage;

  /**
   * Compact mode for mini-carts or small sidebars.
   */
  compact?: boolean;

  /**
   * Additional Tailwind classes.
   */
  className?: string;
}

/**
 * Task 33: Order Summary Slim Promo Code Accordion/Dropdown (`CartCouponBox.tsx`)
 *
 * Provides an accessible, high-converting promo code application box:
 * - Collapsed toggle row with `Tag` icon and rotating chevron.
 * - Smooth animated accordion expansion.
 * - Uppercase formatted mono input with instant clear (X) button.
 * - Apply button with asynchronous loading spinner.
 * - Accessible error and helper messaging.
 * - Active applied coupon chip with emerald badge and "Remove / মুছুন" button.
 * - Full WCAG 2.1 AA keyboard navigation (Enter to apply, Escape to collapse).
 */
export const CartCouponBox: React.FC<CartCouponBoxProps> = ({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  defaultExpanded = false,
  errorMessage: externalError,
  successMessage: externalSuccess,
  isLoading: externalLoading,
  language: langOverride,
  compact = false,
  className = '',
}) => {
  const { language: contextLang } = useLanguage();
  const activeLanguage = langOverride ?? contextLang;
  const isBengali = activeLanguage === 'bn';

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded || Boolean(appliedCoupon));
  const [couponInput, setCouponInput] = useState<string>('');
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headerId = useId();

  const isLoading = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;
  const success = externalSuccess ?? internalSuccess;

  // Sync expanded state when coupon is applied
  useEffect(() => {
    if (appliedCoupon) {
      setIsExpanded(true);
      setInternalError(null);
    }
  }, [appliedCoupon]);

  // Focus input when accordion expands
  useEffect(() => {
    if (isExpanded && !appliedCoupon) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, appliedCoupon]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
    setInternalError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force uppercase and strip spaces for promo codes
    const sanitized = e.target.value.toUpperCase().replace(/\s+/g, '');
    setCouponInput(sanitized);
    if (internalError) setInternalError(null);
  };

  const handleClearInput = () => {
    setCouponInput('');
    setInternalError(null);
    inputRef.current?.focus();
  };

  const handleApply = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const targetCode = (codeOverride ?? couponInput).trim();
    if (!targetCode || isLoading) return;

    setInternalLoading(true);
    setInternalError(null);
    setInternalSuccess(null);

    try {
      if (onApplyCoupon) {
        const result = await onApplyCoupon(targetCode);
        if (typeof result === 'string') {
          setInternalError(result);
        } else if (result === false) {
          setInternalError(
            isBengali
              ? 'অবৈধ অথবা মেয়াদোত্তীর্ণ প্রমো কোড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
              : 'Invalid or expired promo code. Please try again.'
          );
        } else {
          setInternalSuccess(
            isBengali
              ? `প্রমো কোড "${targetCode}" সফলভাবে প্রয়োগ করা হয়েছে!`
              : `Promo code "${targetCode}" applied successfully!`
          );
          setCouponInput('');
        }
      } else {
        // Fallback demo handler
        await new Promise((res) => setTimeout(res, 400));
        if (
          targetCode === 'WELCOME50' ||
          targetCode === 'MALDAFREE' ||
          targetCode === 'WBCS2026' ||
          targetCode === 'BOOKWORM15'
        ) {
          setInternalSuccess(
            isBengali
              ? `প্রমো কোড "${targetCode}" প্রয়োগ করা হয়েছে!`
              : `Promo code "${targetCode}" applied!`
          );
          setCouponInput('');
        } else {
          setInternalError(
            isBengali
              ? 'অবৈধ প্রমো কোড। সঠিক কোড লিখুন।'
              : 'Invalid promo code. Please enter a valid coupon.'
          );
        }
      }
    } catch {
      setInternalError(
        isBengali
          ? 'প্রমো কোড প্রয়োগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Failed to apply promo code. Please try again.'
      );
    } finally {
      setInternalLoading(false);
    }
  };

  const handleSelectPillCoupon = (code: string) => {
    setCouponInput(code);
    handleApply(undefined, code);
  };

  const handleRemove = async () => {
    setInternalLoading(true);
    setInternalError(null);
    setInternalSuccess(null);
    try {
      if (onRemoveCoupon) {
        await onRemoveCoupon();
      }
      setCouponInput('');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsExpanded(false);
      toggleButtonRef.current?.focus();
    }
  };

  return (
    <div
      data-testid="cart-coupon-box"
      className={`rounded-xl border border-gray-200 bg-white transition-all ${className}`}
    >
      {/* 1. Header / Accordion Toggle Row */}
      <button
        ref={toggleButtonRef}
        id={headerId}
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between gap-2 p-3 text-left rounded-xl transition-colors cursor-pointer select-none hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          isExpanded ? 'border-b border-gray-100' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-bold text-xs sm:text-sm text-gray-800 font-bengali">
              {isBengali ? 'প্রমো কোড ব্যবহার করুন' : 'Apply Promo Code'}
            </span>
            <span className="text-[11px] text-gray-500 font-sans ml-1.5 hidden xs:inline">
              / {isBengali ? 'Promo Code' : 'প্রমো কোড'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          <span className="text-xs font-mono font-medium">
            {isExpanded ? (isBengali ? 'লুকান' : 'Hide') : (isBengali ? 'খুলুন' : 'Open')}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-amber-600' : ''
            }`}
          />
        </div>
      </button>

      {/* 2. Accordion Panel */}
      {isExpanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="p-3 sm:p-3.5 space-y-3 animate-in fade-in duration-200"
        >
          {/* A. If a coupon is already active / applied */}
          {appliedCoupon ? (
            <div
              data-testid="active-coupon-chip"
              className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs sm:text-sm tracking-wider uppercase bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 shadow-2xs">
                      {'coupon' in appliedCoupon ? appliedCoupon.coupon.code : appliedCoupon.code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 font-bengali">
                      {isBengali ? 'প্রযুক্ত হয়েছে' : 'Applied'}
                    </span>
                  </div>
                  {appliedCoupon.discountAmount && appliedCoupon.discountAmount > 0 ? (
                    <p className="text-[11px] text-emerald-800 font-semibold font-bengali mt-0.5">
                      {isBengali
                        ? `সাশ্রয়: ${formatINR(appliedCoupon.discountAmount, activeLanguage)}`
                        : `Discount: ${formatINR(appliedCoupon.discountAmount, activeLanguage)}`}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Remove Coupon Action */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                aria-label={isBengali ? 'প্রমো কোড মুছুন' : 'Remove coupon'}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-800 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>{isBengali ? 'মুছুন' : 'Remove'}</span>
              </button>
            </div>
          ) : (
            /* B. Input Form to enter coupon code */
            <form onSubmit={handleApply} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={couponInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={
                      isBengali ? 'প্রমো কোড লিখুন (যেমন MM50)' : 'Enter promo code (e.g. MM50)'
                    }
                    aria-label={isBengali ? 'প্রমো কোড' : 'Promo code input'}
                    className={`w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 bg-gray-50 border rounded-lg transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      error ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'
                    }`}
                  />
                  {/* Clear Button inside Input */}
                  {couponInput.length > 0 && !isLoading && (
                    <button
                      type="button"
                      onClick={handleClearInput}
                      aria-label={isBengali ? 'লেখা মুছুন' : 'Clear input'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Apply Button */}
                <button
                  type="submit"
                  disabled={!couponInput.trim() || isLoading}
                  className="px-3.5 sm:px-4 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-950 font-bold rounded-lg text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center min-w-[75px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                  ) : (
                    <span>{isBengali ? 'প্রয়োগ করুন' : 'Apply'}</span>
                  )}
                </button>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-red-600 font-medium font-bengali pt-0.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div
                  role="status"
                  className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-bengali pt-0.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Helper text */}
              {!error && !success && (
                <p className="text-[11px] text-gray-500 font-bengali">
                  {isBengali
                    ? 'আপনার কাছে ডিসকাউন্ট ভাউচার বা প্রমো কোড থাকলে এখানে দিন।'
                    : 'Enter your valid promotional code or coupon to get instant discount.'}
                </p>
              )}
            </form>
          )}

          {/* C. Available 1-Click Coupon Pills (Task 34) */}
          <div className="pt-2.5 border-t border-gray-100">
            <AvailableCouponsPills
              appliedCouponCode={
                appliedCoupon
                  ? 'code' in appliedCoupon
                    ? (appliedCoupon as any).code
                    : appliedCoupon.coupon.code
                  : null
              }
              onSelectCoupon={handleSelectPillCoupon}
              isLoading={isLoading}
              language={activeLanguage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCouponBox;
