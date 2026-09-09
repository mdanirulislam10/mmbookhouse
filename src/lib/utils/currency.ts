import { AppLanguage } from '@/types/header';

/**
 * Module 2 (Task 33): Local Currency (₹ INR) & Bengali Numeral Utility
 *
 * Formats monetary amounts in standard Indian Rupee notation (lakhs & crores)
 * and formats numerals into Bengali script when viewing in Bengali mode.
 */

const BENGALI_NUMERALS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

/**
 * Converts standard ASCII digits to Bengali script digits (০-৯).
 */
export function toBengaliNumerals(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_NUMERALS[digit] ?? digit);
}

/**
 * Formats a numeric price into INR currency string with ₹ symbol.
 * Example:
 * formatINR(1499, 'bn') => "₹১,৪৯৯"
 * formatINR(1499, 'en') => "₹1,499"
 */
export function formatINR(amount: number, language: AppLanguage = 'bn'): string {
  // Format using standard Indian numbering system (en-IN format: 1,00,000)
  const formattedInr = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  if (language === 'bn') {
    return `₹${toBengaliNumerals(formattedInr)}`;
  }

  return `₹${formattedInr}`;
}
