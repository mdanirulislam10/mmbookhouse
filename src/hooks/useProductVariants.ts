'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DetailedBookProduct, VariantFormat, VariantCondition, ProductVariantState } from '@/types/pdp';
import { BookVariantOption } from '@/types/catalog-filter';

interface UseProductVariantsProps {
  product: DetailedBookProduct;
  initialFormat?: VariantFormat;
  initialCondition?: VariantCondition;
  onVariantChange?: (state: ProductVariantState) => void;
}

export function useProductVariants({
  product,
  initialFormat,
  initialCondition,
  onVariantChange,
}: UseProductVariantsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // 1. Determine starting values based on URL query params > initial props > product defaults
  const queryFormat = searchParams?.get('format') as VariantFormat | null;
  const queryCondition = searchParams?.get('condition') as VariantCondition | null;

  const validFormats: VariantFormat[] = ['paperback', 'hardcover', 'bundle'];
  const validConditions: VariantCondition[] = ['new', 'used'];

  const defaultFormat: VariantFormat =
    (queryFormat && validFormats.includes(queryFormat) && queryFormat) ||
    initialFormat ||
    product.binding ||
    'paperback';

  const defaultCondition: VariantCondition =
    (queryCondition && validConditions.includes(queryCondition) && queryCondition) ||
    initialCondition ||
    product.condition ||
    'new';

  // 2. Local optimistic state for instant UI rendering without waiting for navigation
  const [format, setFormat] = useState<VariantFormat>(defaultFormat);
  const [condition, setCondition] = useState<VariantCondition>(defaultCondition);
  const [isOptimisticChanging, setIsOptimisticChanging] = useState<boolean>(false);

  // Sync state if searchParams changes from browser back/forward buttons
  useEffect(() => {
    if (queryFormat && validFormats.includes(queryFormat) && queryFormat !== format) {
      setFormat(queryFormat);
    }
    if (queryCondition && validConditions.includes(queryCondition) && queryCondition !== condition) {
      setCondition(queryCondition);
    }
  }, [queryFormat, queryCondition, format, condition]);

  // Find active variant data
  const activeVariantOption: BookVariantOption | undefined = product.variants?.find(
    (v) => v.format === format
  );

  // Compute effective price, MRP, stock based on format and condition
  const isUsed = condition === 'used' && Boolean(product.usedBookOption?.isAvailable);

  let currentPrice = product.price;
  let currentMrp = product.mrp;
  let currentStockQuantity = product.stockQuantity ?? (product.inStock ? 10 : 0);
  let isInStock = product.inStock;

  if (isUsed && product.usedBookOption) {
    currentPrice = product.usedBookOption.price;
    currentMrp = product.usedBookOption.mrp || product.mrp;
    currentStockQuantity = 1; // Used book usually single or limited copies
    isInStock = product.usedBookOption.isAvailable;
  } else if (activeVariantOption) {
    currentPrice = activeVariantOption.price;
    currentMrp = activeVariantOption.mrp;
    currentStockQuantity = activeVariantOption.stockQuantity;
    isInStock = activeVariantOption.stockQuantity > 0;
  }

  const savingsAmount = Math.max(0, currentMrp - currentPrice);
  const discountPercent =
    currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  // Function to push or replace URL queries seamlessly without page reload
  const updateUrlParams = useCallback(
    (newFormat: VariantFormat, newCondition: VariantCondition) => {
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));

      // Update parameters
      current.set('format', newFormat);
      current.set('condition', newCondition);

      const search = current.toString();
      const query = search ? `?${search}` : '';

      // Optimistic replace URL without reloading page or losing scroll position
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `${pathname}${query}`);
      }

      startTransition(() => {
        router.replace(`${pathname}${query}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Handlers for switching format and condition
  const selectFormat = useCallback(
    (newFormat: VariantFormat) => {
      if (newFormat === format) return;

      setIsOptimisticChanging(true);
      setFormat(newFormat);

      // If switching format, default to 'new' unless user already is on used
      updateUrlParams(newFormat, condition);

      // Brief flash animation for optimistic feel
      setTimeout(() => {
        setIsOptimisticChanging(false);
      }, 150);
    },
    [format, condition, updateUrlParams]
  );

  const selectCondition = useCallback(
    (newCondition: VariantCondition) => {
      if (newCondition === condition) return;

      setIsOptimisticChanging(true);
      setCondition(newCondition);
      updateUrlParams(format, newCondition);

      setTimeout(() => {
        setIsOptimisticChanging(false);
      }, 150);
    },
    [condition, format, updateUrlParams]
  );

  const toggleUsedCondition = useCallback(() => {
    const nextCondition: VariantCondition = condition === 'used' ? 'new' : 'used';
    selectCondition(nextCondition);
  }, [condition, selectCondition]);

  // Trigger callback when variant state changes
  useEffect(() => {
    if (onVariantChange) {
      onVariantChange({
        format,
        condition,
        price: currentPrice,
        mrp: currentMrp,
        discountPercent,
        stockQuantity: currentStockQuantity,
        inStock: isInStock,
        isUsed,
      });
    }
  }, [
    format,
    condition,
    currentPrice,
    currentMrp,
    discountPercent,
    currentStockQuantity,
    isInStock,
    isUsed,
    onVariantChange,
  ]);

  return {
    activeFormat: format,
    activeCondition: condition,
    selectFormat,
    selectCondition,
    toggleUsedCondition,
    currentPrice,
    currentMrp,
    savingsAmount,
    discountPercent,
    currentStockQuantity,
    isInStock,
    isUsed,
    activeVariantOption,
    isOptimisticChanging,
  };
}
