'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Store, Monitor } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface SellerAdminBadgeProps {
  className?: string;
}

/**
 * Module 2 (Task 28): Seller / Admin Quick Status Badge
 *
 * Prominently displays an Amazon-style Seller Central / Admin Panel quick access pill
 * when an authorized store administrator, merchant, or POS staff member is logged in.
 */
export const SellerAdminBadge: React.FC<SellerAdminBadgeProps> = ({ className = '' }) => {
  const { isLoggedIn } = useAuthSession();
  const { isStaffOrAdmin, role, activeRole } = useUserRole();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);

  // If user is not authenticated or does not hold staff/seller permissions, do not render
  if (!isLoggedIn || !isStaffOrAdmin) {
    return null;
  }

  // Determine target route and badge label based on role
  let targetHref = '/seller';
  let badgeLabel = dict.sellerAdmin.sellerCentral;
  let IconComponent = Store;
  let roleTheme = 'border-amber-400/60 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20';

  if (role === 'admin') {
    targetHref = '/admin';
    badgeLabel = dict.sellerAdmin.adminPanel;
    IconComponent = ShieldCheck;
    roleTheme = 'border-amber-400/70 bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 hover:border-amber-300';
  } else if (role === 'pos_staff' || role === 'pos_operator') {
    targetHref = '/pos';
    badgeLabel = dict.sellerAdmin.posCounter;
    IconComponent = Monitor;
    roleTheme = 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-300';
  }

  return (
    <Link
      href={targetHref}
      aria-label={dict.sellerAdmin.ariaLabel}
      title={dict.sellerAdmin.roleLabel(role)}
      className={`amazon-nav-box group relative flex items-center gap-1.5 py-1 px-2 rounded-sm border transition-all duration-150 select-none text-xs font-semibold ${roleTheme} ${className}`}
    >
      {/* Role Vector Icon with subtle pulse */}
      <span className="relative flex items-center justify-center">
        <IconComponent className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      </span>

      {/* Label and Subtitle */}
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[10px] text-gray-300 font-normal leading-none">
          {activeRole === 'seller_dashboard' ? 'Dashboard' : 'Portal'}
        </span>
        <span className="text-xs font-bold leading-tight whitespace-nowrap">
          {badgeLabel}
        </span>
      </div>
    </Link>
  );
};
