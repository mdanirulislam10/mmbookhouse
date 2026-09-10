import { Coupon } from '@/types/cart';

/**
 * Standard M.M Book House Available Coupons Catalog (Task 34)
 */
export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'WELCOME50',
    type: 'FLAT',
    value: 50,
    minOrderValue: 399,
    title: 'Flat ₹50 Off',
    titleBn: '৫০ টাকা ফ্ল্যাট ছাড়',
    description: 'Flat ₹50 off on orders ₹399+',
    descriptionBn: '₹৩৯৯ বা তদূর্ধ্ব অর্ডারে ৫০ টাকা ফ্ল্যাট ছাড়',
    applicableCategory: 'all',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    code: 'MALDAFREE',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrderValue: 0,
    title: '100% Free Delivery',
    titleBn: 'সম্পূর্ণ ফ্রি ডেলিভারি',
    description: '100% Free Shipping on Malda orders',
    descriptionBn: 'মালদা জেলার সমস্ত অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি',
    applicableCategory: 'all',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    code: 'WBCS2026',
    type: 'PERCENTAGE',
    value: 10,
    minOrderValue: 299,
    maxDiscount: 150,
    title: '10% WBCS Special',
    titleBn: '১০% ডাব্লুবিসিএস ছাড়',
    description: '10% off competitive exam books',
    descriptionBn: 'প্রতিযোগিতামূলক ও WBCS পরীক্ষার বইয়ে অতিরিক্ত ১০% ছাড়',
    applicableCategory: 'wbcs',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    code: 'BOOKWORM15',
    type: 'PERCENTAGE',
    value: 15,
    minOrderValue: 999,
    maxDiscount: 300,
    title: '15% Bookworm Saver',
    titleBn: '১৫% বুকওয়ার্ম সেভার',
    description: '15% off on orders ₹999+',
    descriptionBn: '₹৯৯৯ বা তদূর্ধ্ব অর্ডারে অতিরিক্ত ১৫% সাশ্রয়ী ছাড়',
    applicableCategory: 'all',
    expiresAt: '2026-12-31T23:59:59Z',
  },
];
