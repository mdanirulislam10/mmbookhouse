import { 
  ProductBundle, 
  BundleItem, 
  BundleCalculationResult 
} from '../../types/bundle';

/**
 * Module 15: Bundle Pricing, Combo Discount Calculator & Deduplication Guard
 * (Items 7, 8, 9, 10, 13, 14, 17, 20, 40, 43)
 */

export interface BundlePricingOptions {
  bundle: ProductBundle;
  selectedItemIds: string[];
  activeCartItemIds?: string[]; // Item 40: Deduplication check
  locale?: 'en' | 'bn';
}

/**
 * Generates selection-sensitive CTA button label (Item 14)
 */
export function generateBundleButtonLabel(
  selectedCount: number,
  totalItemsInBundle: number,
  isPrimarySelected: boolean,
  payableAmount: number,
  locale: 'en' | 'bn' = 'en'
): string {
  const formattedAmount = `₹${payableAmount.toFixed(0)}`;

  if (locale === 'bn') {
    if (selectedCount === 3) {
      return `৩টি বই একসাথে কার্টে যোগ করুন (${formattedAmount})`;
    } else if (selectedCount === 2) {
      return `উভয় বই কার্টে যোগ করুন (${formattedAmount})`;
    } else if (selectedCount === 1) {
      return isPrimarySelected
        ? `মূল বইটি কার্টে যোগ করুন (${formattedAmount})`
        : `সম্পূরক বইটি কার্টে যোগ করুন (${formattedAmount})`;
    } else {
      return 'বই নির্বাচন করুন';
    }
  }

  // English default
  if (selectedCount === 3) {
    return `Add all 3 to Cart (${formattedAmount})`;
  } else if (selectedCount === 2) {
    return `Add both to Cart (${formattedAmount})`;
  } else if (selectedCount === 1) {
    return isPrimarySelected
      ? `Add 1 item to Cart (${formattedAmount})`
      : `Add other item to Cart (${formattedAmount})`;
  } else {
    return 'Select items to add';
  }
}

/**
 * Real-Time Zero-Lag Bundle Pricing Engine (Item 13)
 * Handles combo savings, OOS auto-elimination, and conditional discount reversal (Item 43)
 */
export function calculateBundlePricing(options: BundlePricingOptions): BundleCalculationResult {
  const { bundle, selectedItemIds, activeCartItemIds = [], locale = 'en' } = options;

  // Filter available and in-stock items (Item 8: OOS elimination)
  const availableItems = bundle.items.filter((it) => it.is_in_stock && it.stock_quantity > 0);

  // Selected items that are also in-stock
  const selectedItems = availableItems.filter((it) => selectedItemIds.includes(it.product_id));

  let totalMrp = 0;
  let totalSellingPrice = 0;

  for (const item of selectedItems) {
    totalMrp += item.unit_mrp;
    totalSellingPrice += item.unit_selling_price;
  }

  const regularSavings = Math.max(0, totalMrp - totalSellingPrice);

  // Combo discount only applies when at least 2 items are selected (Item 7 & 43)
  // If user unchecks down to 1 item, the combo discount is conditionally reversed
  let comboDiscount = 0;
  if (selectedItems.length >= 2) {
    if (bundle.discount_type === 'PERCENTAGE') {
      comboDiscount = Math.round(totalSellingPrice * (bundle.discount_value / 100) * 100) / 100;
    } else if (bundle.discount_type === 'FLAT') {
      comboDiscount = Math.min(bundle.discount_value, totalSellingPrice);
    }
  }

  const finalPayable = Math.max(0, Math.round((totalSellingPrice - comboDiscount) * 100) / 100);
  const totalSavings = Math.round((regularSavings + comboDiscount) * 100) / 100;

  const isPrimarySelected = selectedItems.some((it) => it.is_primary);

  const buttonLabel = generateBundleButtonLabel(
    selectedItems.length,
    availableItems.length,
    isPrimarySelected,
    finalPayable,
    locale
  );

  return {
    total_mrp: Math.round(totalMrp * 100) / 100,
    total_selling_price: Math.round(totalSellingPrice * 100) / 100,
    combo_discount: Math.round(comboDiscount * 100) / 100,
    final_payable_amount: finalPayable,
    total_savings: totalSavings,
    button_label: buttonLabel,
    item_count: selectedItems.length,
    selected_item_ids: selectedItems.map((i) => i.product_id),
  };
}

/**
 * Deduplication Guard: Checks if product is already in user's active cart (Item 40)
 */
export function checkCartDeduplication(
  items: BundleItem[],
  activeCartProductIds: string[]
): { item: BundleItem; isAlreadyInCart: boolean }[] {
  return items.map((it) => ({
    item: it,
    isAlreadyInCart: activeCartProductIds.includes(it.product_id),
  }));
}
