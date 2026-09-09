'use client';

import React from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface StickyHeaderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const StickyHeaderWrapper: React.FC<StickyHeaderWrapperProps> = ({
  children,
  className = '',
}) => {
  const { isScrolledPast } = useScrollDirection();

  return (
    <header
      className={`sticky top-0 z-50 w-full min-h-[60px] bg-[#131921] transition-shadow duration-200 ${
        isScrolledPast ? 'shadow-lg shadow-black/40' : ''
      } ${className}`}
    >
      {children}
    </header>
  );
};

