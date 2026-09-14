'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DetailedBookProduct, VariantFormat, VariantCondition, GiftOptionsState } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createBuyNowSession, BuyNowSessionPayload } from '@/lib/services/buyNowService';

export interface UseBuyNowOptions {
  book: DetailedBookProduct | BookProduct;
  quantity?: number;
  format?: VariantFormat;
  condition?: VariantCondition;
  customPrice?: number;
  customMrp?: number;
  giftOptions?: GiftOptionsState;
  onSuccess?: (payload: BuyNowSessionPayload) => void;
  onRequireAuth?: () => void; // For inline OTP slide-over drawer (Item 14)
}

/**
 * Module 12 - Task 3: 1-Click Buy Now Hook
 * 
 * Features:
 * - Isolated Purchase Session (Item 12): Bypasses regular cart and leaves cart items untouched.
 * - Fast-Track Routing: Navigates straight to `/checkout?mode=buy_now` (Item 11, 19).
 * - Inline Auth Drawer Integration (Item 14): Opens inline drawer if guest user.
 */
export function useBuyNow() {
  const router = useRouter();
  const { isLoggedIn } = useAuthSession();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const executeBuyNow = useCallback(
    async ({
      book,
      quantity = 1,
      format,
      condition,
      customPrice,
      customMrp,
      giftOptions,
      onSuccess,
      onRequireAuth,
    }: UseBuyNowOptions) => {
      setIsProcessing(true);
      setError(null);

      try {
        // 1. Create isolated session in storage (preserving regular cart items untouched)
        const sessionPayload = createBuyNowSession({
          book,
          quantity,
          format,
          condition,
          customPrice,
          customMrp,
          giftOptions,
        });

        if (onSuccess) {
          onSuccess(sessionPayload);
        }

        // 2. If user is not logged in and caller provides inline auth trigger, invoke it (Item 14)
        if (!isLoggedIn && onRequireAuth) {
          onRequireAuth();
          return;
        }

        // 3. Fast-Track navigation directly to `/checkout?mode=buy_now` (Item 11, 13, 19)
        const targetUrl = isLoggedIn
          ? '/checkout?mode=buy_now'
          : `/login?redirect=${encodeURIComponent('/checkout?mode=buy_now')}`;

        router.push(targetUrl);
      } catch (err: any) {
        console.error('Express Buy Now Error:', err);
        setError(err?.message || 'Unable to start express checkout. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [router, isLoggedIn]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    executeBuyNow,
    isProcessing,
    error,
    clearError,
  };
}

export default useBuyNow;
