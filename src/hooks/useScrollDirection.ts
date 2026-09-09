'use client';

import { useState, useEffect } from 'react';

interface ScrollDirectionOptions {
  threshold?: number;
  compactThreshold?: number;
  initialDirection?: 'up' | 'down';
}

/**
 * Module 2 (Task 25 & Task 31): Intelligent Directional Scroll Detection
 *
 * Automatically detects whether user is scrolling down or up.
 * - When scrolling down past 200px: Triggers compact mode (80px -> 50px) and auto-hides auxiliary strips.
 * - When scrolling up even by a slight amount: Smoothly restores full header viewports.
 */
export function useScrollDirection({
  threshold = 200,
  compactThreshold = 200,
  initialDirection = 'up',
}: ScrollDirectionOptions = {}) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>(initialDirection);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      setScrollY(currentScrollY);
      setIsScrolledPast(currentScrollY > 50);

      // Require a minimal scroll delta (e.g. 8px) to prevent jitter from elastic bouncing
      if (Math.abs(currentScrollY - lastScrollY) < 8) {
        ticking = false;
        return;
      }

      // If scrolling down past threshold
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        // If scrolling up, immediately restore header
        setScrollDirection('up');
      }

      lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const shouldHideSubHeader = scrollDirection === 'down' && scrollY > threshold;
  const isCompactMode = scrollY > compactThreshold && scrollDirection === 'down';

  return {
    scrollDirection,
    scrollY,
    isScrolledPast,
    shouldHideSubHeader,
    isCompactMode,
  };
}
