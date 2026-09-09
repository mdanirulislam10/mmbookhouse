'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useLanguage } from '@/hooks/useLanguage';


interface HamburgerTriggerProps {
  className?: string;
  label?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

/**
 * Task 1 & Tasks 43–44: "All" Hamburger Mega Menu Trigger Button
 * - WCAG 2.1 AA: aria-expanded, aria-haspopup="dialog", aria-controls="category-mega-drawer"
 * - Persistent id="category-hamburger-trigger" for keyboard focus restoration
 * - Dynamic bilingual label sync
 */
export const HamburgerTrigger: React.FC<HamburgerTriggerProps> = ({
  className = '',
  label,
  showIcon = true,
  onClick,
}) => {
  const { isOpen, openDrawer } = useCategoryDrawer();
  const { language } = useLanguage();

  const displayLabel = label || (language === 'bn' ? 'সকল বিভাগ' : 'All Departments');


  const handleClick = () => {
    onClick?.();
    openDrawer();
  };

  return (
    <button
      id="category-hamburger-trigger"
      type="button"
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls="category-mega-drawer"
      aria-label={`${displayLabel} - মেগা মেনু খুলুন`}
      data-drawer-trigger="category"
      className={`amazon-nav-box flex items-center gap-1.5 py-1 px-2 font-bold text-white transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-amber-400 ${className}`}
    >
      {showIcon && <Menu className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />}
      <span className="text-xs tracking-tight">{displayLabel}</span>
    </button>
  );
};

