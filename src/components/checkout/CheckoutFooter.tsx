'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Shield, HelpCircle, MapPin, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface CheckoutFooterProps {
  className?: string;
}

/**
 * Module 12 - Task 2: Amazon Minimal Compliance Checkout Footer
 * 
 * Features:
 * - Minimal Compliance Layout: Strips bulky category footers and marketing links to keep
 *   customer focused purely on completing order checkout (Item 10).
 * - Trust & Legal Policies: Direct links to Privacy Notice, Conditions of Sale, and Return Policy.
 * - Malda Store Contact: Quick customer care dialer and physical store location in Malda.
 * - RBI & E-Commerce Compliance: Clear reassurance of 256-Bit SSL encryption & secure tokenization.
 */
export const CheckoutFooter: React.FC<CheckoutFooterProps> = ({ className = '' }) => {
  const { isBengali } = useLanguage();
  const storePhone = '+919733085000';
  const displayPhone = '+91 97330 85000';

  return (
    <footer
      aria-label="চেকআউট ফুটার"
      className={`w-full bg-gray-50 border-t border-gray-200/80 py-8 px-4 sm:px-6 lg:px-8 text-xs text-gray-500 select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Compliance Assurance Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-center text-gray-600 font-medium pb-4 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isBengali ? '২৫৬-বিট SSL এনক্রিপ্টেড পেমেন্ট' : '256-Bit SSL Encrypted Payment'}</span>
          </div>
          <div className="hidden sm:inline text-gray-300">•</div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-black">✓</span>
            <span>{isBengali ? '১০০% আসল ও নতুন বইয়ের গ্যারান্টি' : '100% Genuine Books Guarantee'}</span>
          </div>
          <div className="hidden sm:inline text-gray-300">•</div>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isBengali ? 'সহায়তা প্রয়োজন?' : 'Need Help?'}{' '}
              <a
                href={`tel:${storePhone}`}
                className="font-bold text-gray-900 hover:text-emerald-700 hover:underline"
              >
                {displayPhone}
              </a>
            </span>
          </div>
        </div>

        {/* Minimal Legal Links */}
        <nav
          aria-label="লিগ্যাল ও পলিসি লিঙ্ক"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-xs font-semibold text-emerald-700"
        >
          <Link
            href="/support#terms"
            target="_blank"
            className="hover:text-emerald-900 hover:underline transition-colors"
          >
            {isBengali ? 'ব্যবহারের শর্তাবলী' : 'Conditions of Use & Sale'}
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            href="/support#privacy"
            target="_blank"
            className="hover:text-emerald-900 hover:underline transition-colors"
          >
            {isBengali ? 'গোপনীয়তা নীতি' : 'Privacy Notice'}
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            href="/support#refunds"
            target="_blank"
            className="hover:text-emerald-900 hover:underline transition-colors"
          >
            {isBengali ? 'রিটার্ন ও রিফান্ড পলিসি' : 'Return & Refund Policy'}
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            href="/support"
            target="_blank"
            className="hover:text-emerald-900 hover:underline transition-colors"
          >
            {isBengali ? 'কাস্টমার কেয়ার ও হেল্পলাইন' : 'Customer Care & FAQ'}
          </Link>
        </nav>

        {/* Store Location & Copyright */}
        <div className="text-center space-y-1 text-[11px] text-gray-400">
          <p className="flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400 inline" />
            <span>
              {isBengali
                ? 'এম.এম বুক হাউস, নেতাজী সুভাষ রোড, রথবাড়ি, মালদা, পশ্চিমবঙ্গ - ৭৩২১০১'
                : 'M.M Book House, Netaji Subhash Road, Rathbari, Malda, West Bengal - 732101'}
            </span>
          </p>
          <p>
            © {new Date().getFullYear()} M.M Book House Malda. {isBengali ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default CheckoutFooter;
