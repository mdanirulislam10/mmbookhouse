'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DetailedBookProduct, VariantFormat, VariantCondition, GiftOptionsState, ExpressBuyNowPayload } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';
import { useCartStore } from '@/hooks/useCartStore';
import { useAuthSession } from '@/hooks/useAuthSession';

export interface UseBuyNowOptions {
  book: DetailedBookProduct | BookProduct;
  quantity?: number;
  format?: VariantFormat;
  condition?: VariantCondition;
  customPrice?: number;
  customMrp?: number;
  giftOptions?: GiftOptionsState;
  onSuccess?: (payload: ExpressBuyNowPayload) => void;
}

export const EXPRESS_CHECKOUT_STORAGE_KEY = 'mm_express_checkout_payload';

export function useBuyNow() {
  const router = useRouter();
  const { isLoggedIn } = useAuthSession();
  const addItem = useCartStore((state) => state.addItem);
  const triggerBounce = useCartStore((state) => state.triggerBounce);

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
    }: UseBuyNowOptions) => {
      setIsProcessing(true);
      setError(null);

      try {
        const finalPrice = customPrice ?? book.price;
        const finalMrp = customMrp ?? book.mrp;
        const bookId = book.bookId || book.id;

        const payload: ExpressBuyNowPayload = {
          bookId,
          title: book.title,
          titleBn: book.titleBn,
          author: book.author,
          price: finalPrice,
          mrp: finalMrp,
          quantity: Math.max(1, quantity),
          coverImage: book.coverImage,
          variantFormat: format,
          condition: condition,
          giftOptions,
        };

        // 1. Persist express payload in storage for direct checkout recovery
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(EXPRESS_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
            localStorage.setItem(EXPRESS_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
          } catch {
            // Storage quota or restriction fallback
          }
        }

        // 2. Sync into cart store with exact quantity
        addItem({
          id: `express-${bookId}-${format || 'default'}-${condition || 'new'}`,
          bookId,
          title: book.title,
          titleBn: book.titleBn,
          author: book.author,
          price: finalPrice,
          mrp: finalMrp,
          quantity,
          coverImage: book.coverImage,
        });

        triggerBounce();

        if (onSuccess) {
          onSuccess(payload);
        }

        // 3. Navigate straight to express checkout or login if unauthenticated
        const targetUrl = isLoggedIn
          ? `/orders?express=true&bookId=${encodeURIComponent(bookId)}`
          : `/login?redirect=${encodeURIComponent(`/orders?express=true&bookId=${bookId}`)}`;

        router.push(targetUrl);
      } catch (err: any) {
        console.error('Express Buy Now Error:', err);
        setError(err?.message || 'Unable to start express checkout. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [addItem, triggerBounce, router, isLoggedIn]
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
