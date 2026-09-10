'use client';

import React from 'react';

export type BadgeType = 'HOT' | 'NEW' | 'LIVE' | 'SALE' | 'OFFER' | string;

interface CategoryBadgeProps {
  badge: BadgeType;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Task 23: Dynamic Status Badge System
 * Renders color-coded status badges ('HOT', 'NEW', 'LIVE', 'SALE', or custom text)
 * across Mega Drawer items and Sub-navigation links.
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  badge,
  className = '',
  size = 'sm',
}) => {
  if (!badge) return null;

  const normalized = badge.toUpperCase();

  let badgeStyles = 'bg-amber-500 text-gray-950';

  if (normalized === 'HOT') {
    badgeStyles = 'bg-gradient-to-r from-red-600 to-rose-500 text-white font-black shadow-xs';
  } else if (normalized === 'NEW') {
    badgeStyles = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-xs';
  } else if (normalized === 'LIVE') {
    badgeStyles = 'bg-blue-600 text-white font-bold animate-pulse shadow-xs';
  } else if (normalized === 'TOP 10') {
    badgeStyles = 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-xs';
  } else if (normalized === 'B2B') {
    badgeStyles = 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black shadow-xs';
  } else if (normalized === 'DEAL' || normalized === 'SALE' || normalized === 'OFFER' || normalized.includes('%')) {
    badgeStyles = 'bg-[#f08804] text-gray-950 font-black shadow-xs';
  }

  const sizeClasses = size === 'md' ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5 font-outfit';

  return (
    <span
      role="status"
      aria-label={`অফার ব্যাজ: ${badge}`}
      className={`inline-flex items-center justify-center rounded uppercase tracking-wider leading-none select-none ${sizeClasses} ${badgeStyles} ${className}`}
    >
      {badge}
    </span>
  );
};
