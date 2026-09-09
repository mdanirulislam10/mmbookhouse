'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, ChevronDown, ShoppingBag, LayoutDashboard, Monitor, Check } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface SellerModeSwitchProps {
  className?: string;
}

export const SellerModeSwitch: React.FC<SellerModeSwitchProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { role, activeView, switchView, isStaffOrAdmin } = useUserRole();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  if (!isStaffOrAdmin) {
    return null;
  }

  const handleSelect = (view: 'customer_view' | 'seller_dashboard' | 'pos_counter') => {
    switchView(view);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative select-none ${className}`}>
      {/* Trigger Button Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="সেলার ও পিওএস মোড সুইচ"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
      >
        <Shield className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">সেলার মোড</span>
        <span className="sm:hidden">মার্চেন্ট</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="মোড নির্বাচন"
          className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-900 z-[90] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-[#131921] px-4 py-2.5 text-white flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>স্টাফ ও সেলার মোড সুইচ</span>
            </span>
            <span className="text-[10px] bg-amber-400 text-gray-950 px-1.5 py-0.5 rounded font-bold uppercase">
              {role}
            </span>
          </div>

          {/* Options */}
          <div className="p-2 space-y-1">
            {/* 1. Customer View */}
            <button
              type="button"
              onClick={() => handleSelect('customer_view')}
              className={`w-full flex items-center justify-between p-2.5 rounded-md text-left text-xs transition-colors ${
                activeView === 'customer_view'
                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="font-semibold text-gray-900">কাস্টমার ভিউ (Storefront)</div>
                  <div className="text-[10px] text-gray-500">সাধারণ ক্রেতার অভিজ্ঞতা পরীক্ষা</div>
                </div>
              </div>
              {activeView === 'customer_view' && (
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>

            {/* 2. Seller Central */}
            <button
              type="button"
              onClick={() => handleSelect('seller_dashboard')}
              className={`w-full flex items-center justify-between p-2.5 rounded-md text-left text-xs transition-colors ${
                activeView === 'seller_dashboard'
                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">সেলার সেন্ট্রাল অ্যাডমিন</div>
                  <div className="text-[10px] text-gray-500">বইয়ের স্টক, দাম ও অর্ডার প্রসেসিং</div>
                </div>
              </div>
              {activeView === 'seller_dashboard' && (
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>

            {/* 3. POS Counter */}
            <button
              type="button"
              onClick={() => handleSelect('pos_counter')}
              className={`w-full flex items-center justify-between p-2.5 rounded-md text-left text-xs transition-colors ${
                activeView === 'pos_counter'
                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">কাউন্টার POS ক্যাশিয়ার</div>
                  <div className="text-[10px] text-gray-500">দোকানের অফলাইন দ্রুত বিলিং ও প্রিন্ট</div>
                </div>
              </div>
              {activeView === 'pos_counter' && (
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>
          </div>

          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-[10px] text-gray-500 text-center">
            শুধুমাত্র অনুমোদিত দোকানদার ও সেলস স্টাফদের জন্য সংরক্ষিত।
          </div>
        </div>
      )}
    </div>
  );
};
