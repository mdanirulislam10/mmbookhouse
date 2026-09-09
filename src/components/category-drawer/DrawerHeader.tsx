'use client';

import React from 'react';
import Link from 'next/link';
import { User, X } from 'lucide-react';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface DrawerHeaderProps {
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

/**
 * Task 4: Customer Greeting Banner (Drawer Header)
 * Renders signature Amazon Navy banner with user greeting & close button.
 * Synced with useAuthSession and useUserRole for live auth context.
 */
export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ onClose, onNavigate }) => {
  const { user } = useCategoryDrawer();
  const { userRole, isLoggedIn: isRoleLoggedIn } = useUserRole();
  const { isLoggedIn: isAuthLoggedIn, fullName } = useAuthSession();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);

  const isUserLoggedIn = user?.isLoggedIn || isRoleLoggedIn || isAuthLoggedIn;

  const getGreetingName = () => {
    if (fullName) return fullName;
    if (user?.name) return user.name;
    switch (userRole) {
      case 'admin':
        return 'অ্যাডমিনিস্ট্রেটর (Admin)';
      case 'merchant':
        return 'মার্চেন্ট পার্টনার';
      case 'seller':
        return 'বুক সেলার';
      case 'pos_staff':
        return 'কাউন্টার স্টাফ';
      case 'pos_operator':
        return 'পিওএস অপারেটর';
      case 'customer':
        return 'সম্মানিত গ্রাহক';
      default:
        return dict.drawer.greetingGuest;
    }
  };

  const greetingName = isUserLoggedIn ? getGreetingName() : dict.drawer.greetingGuest;
  const targetUrl = isUserLoggedIn ? '/account' : '/login';

  return (
    <div className="relative bg-[#232f3e] text-white px-6 py-4 flex items-center justify-between select-none shadow-md">
      {/* User Greeting & Avatar */}
      <Link
        href={targetUrl}
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate(targetUrl);
          } else {
            onClose();
          }
        }}
        aria-label={isUserLoggedIn ? `ব্যবহারকারী অ্যাকাউন্ট: ${greetingName}` : `${dict.drawer.greetingPrefix} ${dict.drawer.greetingGuest} - সাইন ইন করুন`}
        className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-sm p-0.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-gray-950 transition-colors">
          <User className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-300 font-normal">{dict.drawer.greetingPrefix}</span>
          <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
            {greetingName}
          </span>
        </div>
      </Link>

      {/* Task 3 (Method 1): Top-Right Close 'X' Button */}
      <button
        id="category-drawer-close-button"
        type="button"
        onClick={onClose}
        aria-label={language === 'bn' ? 'ক্যাটাগরি মেনু বন্ধ করুন' : 'Close category menu'}
        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>

    </div>
  );
};
