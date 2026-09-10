'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2, Trash2 } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { cartToast } from '@/lib/utils/cartToast';

export interface MoveToCartActionProps {
  itemId: string;
  itemTitle?: string;
  itemTitleBn?: string;
  showDeleteButton?: boolean;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  onMoved?: () => void;
  onDeleted?: () => void;
  ariaLabel?: string;
}

/**
 * Module 10 (Task 23): "Move to Cart" Immediate Restoration Action
 *
 * Provides:
 * - Prominent Amazon-Yellow "Move to cart / কার্টে ফিরিয়ে আনুন" action button
 * - 1-click execution calling moveToCart(itemId) and triggerBounce()
 * - Visual feedback states (idle -> moving -> moved/checkmark -> vanished)
 * - 0ms synchronous subtotal and count recalculation
 * - Toast notification: "বইটি সক্রিয় কার্টে যোগ করা হয়েছে"
 * - Secondary "Delete from saved / মুছে ফেলুন" action button alongside it
 */
export const MoveToCartAction: React.FC<MoveToCartActionProps> = ({
  itemId,
  itemTitle,
  itemTitleBn,
  showDeleteButton = true,
  className = '',
  buttonSize = 'sm',
  onMoved,
  onDeleted,
  ariaLabel,
}) => {
  const [moveStatus, setMoveStatus] = useState<'idle' | 'moving' | 'moved'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);

  const moveToCart = useCartStore((state) => state.moveToCart);
  const removeSavedItem = useCartStore((state) => state.removeSavedItem);
  const triggerBounce = useCartStore((state) => state.triggerBounce);
  const { isBengali } = useLanguage();

  const handleMoveToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (moveStatus !== 'idle' || isDeleting) return;

    setMoveStatus('moving');

    // Perform atomic store transition (0ms synchronous recalculation)
    moveToCart(itemId);
    triggerBounce();

    // Brief visual confirmation
    setTimeout(() => {
      setMoveStatus('moved');

      // Dispatch toast notification
      const displayName = isBengali
        ? itemTitleBn || itemTitle || 'বইটি'
        : itemTitle || itemTitleBn || 'Book';

      cartToast.success(
        itemTitle ? `"${itemTitle}" added back to cart` : 'Item added back to active cart',
        {
          messageBn: itemTitleBn
            ? `"${itemTitleBn}" সক্রিয় কার্টে যোগ করা হয়েছে`
            : 'বইটি সক্রিয় কার্টে যোগ করা হয়েছে',
          title: 'Moved to Cart',
          titleBn: 'কার্টে ফিরিয়ে আনা হয়েছে',
        }
      );

      // Emit window CustomEvent
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('mm:moved-to-cart', {
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
          // Ignore event dispatch errors in restricted environments
        }
      }

      onMoved?.();

      // Reset state
      setTimeout(() => {
        setMoveStatus('idle');
      }, 1000);
    }, 180);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting || moveStatus !== 'idle') return;

    setIsDeleting(true);
    removeSavedItem(itemId);

    cartToast.info(
      itemTitle ? `"${itemTitle}" removed from saved list` : 'Item removed from saved list',
      {
        messageBn: itemTitleBn
          ? `"${itemTitleBn}" তালিকা থেকে মুছে ফেলা হয়েছে`
          : 'বইটি তালিকা থেকে মুছে ফেলা হয়েছে',
        title: 'Removed from Saved',
        titleBn: 'মুছে ফেলা হয়েছে',
      }
    );

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('mm:saved-item-removed', {
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
        // Ignore
      }
    }

    onDeleted?.();
  };

  const sizeClasses =
    buttonSize === 'lg'
      ? 'px-4 py-2 text-sm'
      : buttonSize === 'md'
      ? 'px-3.5 py-1.5 text-xs'
      : 'px-3 py-1 text-xs';

  const getMoveButtonLabel = () => {
    if (moveStatus === 'moving') {
      return isBengali ? 'যোগ হচ্ছে...' : 'Moving...';
    }
    if (moveStatus === 'moved') {
      return isBengali ? 'কার্টে যোগ হয়েছে' : 'Moved to cart!';
    }
    return isBengali ? 'কার্টে ফিরিয়ে আনুন' : 'Move to cart';
  };

  const getAccessibleLabel = () => {
    if (ariaLabel) return ariaLabel;
    const titleText = isBengali ? itemTitleBn || itemTitle : itemTitle;
    const actionText = isBengali ? 'কার্টে ফিরিয়ে আনুন' : 'Move item to cart';
    return titleText ? `${actionText}: ${titleText}` : actionText;
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Prominent Amazon-Yellow Move to Cart Action Button */}
      <button
        type="button"
        onClick={handleMoveToCart}
        disabled={moveStatus !== 'idle' || isDeleting}
        aria-label={getAccessibleLabel()}
        className={`group inline-flex items-center justify-center gap-1.5 font-medium rounded-lg shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${
          moveStatus === 'moved'
            ? 'bg-emerald-600 text-white border border-emerald-700 shadow-xs'
            : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200] hover:border-[#f2c200]'
        }`}
      >
        {moveStatus === 'moving' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-900" />
        ) : moveStatus === 'moved' ? (
          <Check className="w-3.5 h-3.5 text-white font-bold" />
        ) : (
          <ShoppingCart className="w-3.5 h-3.5 text-gray-900 group-hover:scale-105 transition-transform" />
        )}
        <span className="font-semibold">{getMoveButtonLabel()}</span>
      </button>

      {/* Secondary Action: Delete from Saved List */}
      {showDeleteButton && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || moveStatus !== 'idle'}
          aria-label={
            isBengali
              ? `সংরক্ষিত তালিকা থেকে মুছে ফেলুন: ${itemTitleBn || itemTitle || ''}`
              : `Delete from saved list: ${itemTitle || ''}`
          }
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium transition-colors cursor-pointer hover:underline disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isBengali ? 'মুছে ফেলুন' : 'Delete'}</span>
        </button>
      )}
    </div>
  );
};
