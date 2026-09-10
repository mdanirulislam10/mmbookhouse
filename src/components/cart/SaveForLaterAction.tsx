'use client';

import React, { useState } from 'react';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { cartToast } from '@/lib/utils/cartToast';

export interface SaveForLaterActionProps {
  itemId: string;
  itemTitle?: string;
  itemTitleBn?: string;
  className?: string;
  variant?: 'link' | 'button' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  ariaLabel?: string;
}

/**
 * Module 10 (Task 22): 1-Click "Save for later" Transition Action & Helper
 *
 * Provides:
 * - Reusable accessible trigger ("Save for later" / "পরে কিনুন")
 * - Instant store transition via saveForLater(itemId)
 * - Visual feedback states (idle -> saving -> saved/checkmark -> idle)
 * - Emits toast notification and window CustomEvent ('mm:saved-for-later-moved')
 * - Preserves all item properties during transition
 */
export const SaveForLaterAction: React.FC<SaveForLaterActionProps> = ({
  itemId,
  itemTitle,
  itemTitleBn,
  className = '',
  variant = 'link',
  size = 'sm',
  showIcon = true,
  disabled = false,
  onSuccess,
  ariaLabel,
}) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveForLater = useCartStore((state) => state.saveForLater);
  const { isBengali } = useLanguage();

  const handleSaveForLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== 'idle' || disabled) return;

    setStatus('saving');

    // Perform atomic transition in store (0ms synchronous recalculation of cart totals)
    saveForLater(itemId);

    // Brief visual confirmation
    setTimeout(() => {
      setStatus('saved');

      // Dispatch toast notification via cartToast engine
      cartToast.success(
        itemTitle ? `"${itemTitle}" moved to Saved for Later` : 'Item moved to Save for Later',
        {
          messageBn: itemTitleBn
            ? `"${itemTitleBn}" পরে কেনার তালিকায় রাখা হয়েছে`
            : "আইটেমটি 'Saved for Later'-এ স্থানান্তরিত হয়েছে",
          title: 'Saved for Later',
          titleBn: 'পরে কিনুন',
        }
      );

      // Emit window CustomEvent for analytics, external widgets, and cart badges
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('mm:saved-for-later-moved', {
              detail: {
                itemId,
                itemTitle,
                itemTitleBn,
                timestamp: Date.now(),
              },
              bubbles: true,
            })
          );
        } catch {
          // Graceful handling for non-DOM contexts
        }
      }

      onSuccess?.();

      // Reset state after brief feedback window
      setTimeout(() => {
        setStatus('idle');
      }, 1000);
    }, 180);
  };

  // Accessible Label
  const getAccessibleLabel = () => {
    if (ariaLabel) return ariaLabel;
    const actionText = isBengali ? 'পরে কেনার জন্য সংরক্ষণ করুন' : 'Save this item for later';
    const titleText = isBengali ? itemTitleBn || itemTitle : itemTitle;
    return titleText ? `${actionText}: ${titleText}` : actionText;
  };

  // Button text based on status and locale
  const renderLabel = () => {
    if (status === 'saving') {
      return isBengali ? 'সংরক্ষণ হচ্ছে...' : 'Saving...';
    }
    if (status === 'saved') {
      return isBengali ? 'সংরক্ষিত হয়েছে' : 'Saved!';
    }
    return isBengali ? 'পরে কিনুন' : 'Save for later';
  };

  // Icon based on status
  const renderIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    if (status === 'saving') {
      return <Loader2 className={`${iconSize} animate-spin text-amber-600`} />;
    }
    if (status === 'saved') {
      return <Check className={`${iconSize} text-emerald-600 font-bold`} />;
    }
    return <Bookmark className={`${iconSize} transition-transform group-hover:scale-110`} />;
  };

  // Variant Styles
  if (variant === 'button') {
    const sizeClasses =
      size === 'lg'
        ? 'px-4 py-2 text-sm'
        : size === 'md'
        ? 'px-3 py-1.5 text-xs'
        : 'px-2.5 py-1 text-xs';

    const stateColorClasses =
      status === 'saved'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
        : status === 'saving'
        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
        : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600';

    return (
      <button
        type="button"
        onClick={handleSaveForLater}
        disabled={disabled || status === 'saving'}
        aria-label={getAccessibleLabel()}
        className={`group inline-flex items-center gap-1.5 font-medium border rounded-md shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${stateColorClasses} ${className}`}
      >
        {renderIcon()}
        <span>{renderLabel()}</span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleSaveForLater}
        disabled={disabled || status === 'saving'}
        aria-label={getAccessibleLabel()}
        title={getAccessibleLabel()}
        className={`group p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-amber-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 ${className}`}
      >
        {renderIcon()}
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleSaveForLater}
        disabled={disabled || status === 'saving'}
        aria-label={getAccessibleLabel()}
        className={`group inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
          status === 'saved'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
        } ${className}`}
      >
        {renderIcon()}
        <span>{renderLabel()}</span>
      </button>
    );
  }

  // Default 'link' variant (Amazon inline text action style)
  return (
    <button
      type="button"
      onClick={handleSaveForLater}
      disabled={disabled || status === 'saving'}
      aria-label={getAccessibleLabel()}
      className={`group inline-flex items-center gap-1 font-medium transition-colors cursor-pointer text-xs sm:text-sm ${
        status === 'saved'
          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
          : status === 'saving'
          ? 'text-amber-700 dark:text-amber-400 animate-pulse'
          : 'text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {renderIcon()}
      <span>{renderLabel()}</span>
    </button>
  );
};
