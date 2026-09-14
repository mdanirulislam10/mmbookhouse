'use client';

import React, { useState, useMemo } from 'react';
import { Landmark, Search, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { BankNetBankingOption } from '@/types/payment';

// Top-6 Indian Banks (Item 6)
export const TOP_SIX_BANKS: BankNetBankingOption[] = [
  { code: 'SBI', name: 'State Bank of India', name_bn: 'স্টেট ব্যাঙ্ক অফ ইন্ডিয়া', logo_slug: 'sbi', is_top_six: true, active: true },
  { code: 'HDFC', name: 'HDFC Bank', name_bn: 'এইচডিএফসি ব্যাঙ্ক', logo_slug: 'hdfc', is_top_six: true, active: true },
  { code: 'ICICI', name: 'ICICI Bank', name_bn: 'আইসিআইসিআই ব্যাঙ্ক', logo_slug: 'icici', is_top_six: true, active: true },
  { code: 'AXIS', name: 'Axis Bank', name_bn: 'অ্যাক্সিস ব্যাঙ্ক', logo_slug: 'axis', is_top_six: true, active: true },
  { code: 'PNB', name: 'Punjab National Bank', name_bn: 'পাঞ্জাব ন্যাশনাল ব্যাঙ্ক', logo_slug: 'pnb', is_top_six: true, active: true },
  { code: 'UBI', name: 'Union Bank of India', name_bn: 'ইউনিয়ন ব্যাঙ্ক অফ ইন্ডিয়া', logo_slug: 'ubi', is_top_six: true, active: true },
];

// Additional popular Indian Banks
export const OTHER_POPULAR_BANKS: BankNetBankingOption[] = [
  { code: 'BOB', name: 'Bank of Baroda', name_bn: 'ব্যাঙ্ক অফ বরোদা', logo_slug: 'bob', is_top_six: false, active: true },
  { code: 'CANARA', name: 'Canara Bank', name_bn: 'কানাড়া ব্যাঙ্ক', logo_slug: 'canara', is_top_six: false, active: true },
  { code: 'KOTAK', name: 'Kotak Mahindra Bank', name_bn: 'কোটাক মাহিন্দ্রা ব্যাঙ্ক', logo_slug: 'kotak', is_top_six: false, active: true },
  { code: 'BANDHAN', name: 'Bandhan Bank', name_bn: 'বন্ধন ব্যাঙ্ক', logo_slug: 'bandhan', is_top_six: false, active: true },
  { code: 'IDBI', name: 'IDBI Bank', name_bn: 'আইডিবিআই ব্যাঙ্ক', logo_slug: 'idbi', is_top_six: false, active: true },
  { code: 'INDUSIND', name: 'IndusInd Bank', name_bn: 'ইন্ডাসইন্ড ব্যাঙ্ক', logo_slug: 'indusind', is_top_six: false, active: true },
  { code: 'YES', name: 'Yes Bank', name_bn: 'ইয়েস ব্যাঙ্ক', logo_slug: 'yes', is_top_six: false, active: true },
  { code: 'FEDERAL', name: 'Federal Bank', name_bn: 'ফেডারেল ব্যাঙ্ক', logo_slug: 'federal', is_top_six: false, active: true },
];

export const ALL_BANKS = [...TOP_SIX_BANKS, ...OTHER_POPULAR_BANKS];

export interface NetBankingBankGridProps {
  selectedBankCode?: string;
  onSelectBank: (bankCode: string) => void;
  className?: string;
}

export const NetBankingBankGrid: React.FC<NetBankingBankGridProps> = ({
  selectedBankCode,
  onSelectBank,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOtherBanks = useMemo(() => {
    if (!searchQuery.trim()) return OTHER_POPULAR_BANKS;
    const query = searchQuery.toLowerCase();
    return OTHER_POPULAR_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.name_bn.includes(query) ||
        b.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
          {isBengali ? 'শীর্ষ ৬টি প্রধান ব্যাঙ্ক (জনপ্রিয়):' : 'Top 6 Popular Banks:'}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-zinc-400">
          {isBengali ? '১-ক্লিকে নির্বাচন করুন' : '1-Click Direct Select'}
        </span>
      </div>

      {/* Top-6 Bank Quick Buttons Grid (Item 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TOP_SIX_BANKS.map((bank) => {
          const isSelected = selectedBankCode === bank.code;

          return (
            <button
              key={bank.code}
              type="button"
              onClick={() => onSelectBank(bank.code)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-800 dark:text-zinc-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                {bank.code.slice(0, 3)}
              </div>
              <div className="overflow-hidden">
                <span className="font-semibold text-xs truncate block">
                  {isBengali ? bank.name_bn : bank.name}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                  {bank.code}
                </span>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* 50+ Other Banks Dropdown / Search Filter (Item 6) */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 block">
          {isBengali ? 'অন্যান্য ৫০+ ভারতীয় ব্যাঙ্ক অনুসন্ধান করুন:' : 'Search 50+ Other Indian Banks:'}
        </label>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBengali
                ? 'ব্যাঙ্কের নাম লিখুন (যেমন: Baroda, Kotak, Canara...)'
                : 'Type bank name (e.g. Baroda, Kotak, Canara...)'
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {searchQuery.trim() && (
          <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 space-y-1 divide-y divide-gray-100 dark:divide-zinc-800">
            {filteredOtherBanks.length === 0 ? (
              <p className="p-3 text-xs text-gray-500 dark:text-zinc-400 text-center">
                {isBengali ? 'কোনো ব্যাঙ্ক পাওয়া যায়নি' : 'No bank found'}
              </p>
            ) : (
              filteredOtherBanks.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => {
                    onSelectBank(b.code);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 rounded-lg text-xs"
                >
                  <span className="font-medium text-gray-800 dark:text-zinc-200">
                    {isBengali ? b.name_bn : b.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{b.code}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
