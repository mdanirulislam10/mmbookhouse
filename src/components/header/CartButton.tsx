'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartCount, useCartAnimation } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { MiniCartFlyout } from './MiniCartFlyout';

interface CartButtonProps {
  className?: string;
  isMobile?: boolean;
}

export const CartButton: React.FC<CartButtonProps> = ({
  className = '',
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const totalCount = useCartCount();
  const isAnimating = useCartAnimation();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Smooth hover with debounce for desktop
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
    >
      {/* Main Cart Link Button (Task 21 & 22) */}
      <Link
        href="/cart"
        aria-label={dict.cart.ariaLabel(isMounted ? totalCount : 0)}
        className="amazon-nav-box group flex items-center gap-1 select-none text-white focus:outline-none cursor-pointer"
      >
        {/* Trolley Icon with Live Count Badge */}
        <div className="relative">
          <ShoppingCart
            className={`w-6 h-6 text-white transition-transform duration-300 ${
              isAnimating ? 'scale-115 text-amber-400' : 'group-hover:text-amber-300'
            }`}
          />

          {/* Task 21 & 22: Amazon Amber Badge with Pulse/Bounce Effect */}
          <span
            className={`absolute -top-1.5 -right-2 bg-[#f08804] text-gray-950 text-[11px] font-black min-w-[1.125rem] h-[1.125rem] px-1 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 select-none ${
              isAnimating && isMounted
                ? 'scale-135 ring-2 ring-white ring-offset-1 ring-offset-amber-500 animate-bounce'
                : 'scale-100'
            }`}
          >
            {!isMounted ? '0' : (language === 'bn' ? toBengaliNumerals(totalCount) : totalCount)}
          </span>
        </div>

        {/* Text Label ("কার্ট" / "Cart") */}
        {!isMobile && (
          <span className="text-xs font-bold text-white hidden sm:inline self-end mb-0.5 tracking-tight group-hover:text-amber-300 transition-colors">
            {dict.cart.label}
          </span>
        )}
      </Link>

      {/* Task 23: Mini-Cart Hover Flyout (Desktop only) */}
      {!isMobile && (
        <MiniCartFlyout
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
