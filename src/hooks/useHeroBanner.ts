'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HeroBanner, BannerSliderConfig } from '@/types/banner';

interface UseHeroBannerProps {
  banners: HeroBanner[];
  config?: BannerSliderConfig;
}

export function useHeroBanner({ banners, config }: UseHeroBannerProps) {
  const autoRotateInterval = config?.autoRotateInterval ?? 5000;
  const pauseOnHover = config?.pauseOnHover ?? true;
  const pauseOnTouch = config?.pauseOnTouch ?? true;
  const swipeThreshold = config?.swipeThreshold ?? 50; // 50px threshold

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'left' | 'right' | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);
  const swipeResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = banners.length;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentIndex(index);
      }
    },
    [totalSlides]
  );

  const isPaused = manualPause || (pauseOnHover && isHovered) || (pauseOnTouch && isTouching) || isFocused;

  // Task 3: 5-Second Interval Auto-Slide Rotator with Clean Lifecycle Cleanup
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoRotateInterval);

    return () => {
      clearInterval(timer);
    };
  }, [isPaused, autoRotateInterval, nextSlide, totalSlides]);

  // Clean up swipe reset timer on unmount
  useEffect(() => {
    return () => {
      if (swipeResetTimerRef.current) {
        clearTimeout(swipeResetTimerRef.current);
      }
    };
  }, []);

  // Task 4: Hover & Focus Handlers
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsHovered(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsHovered(false);
  }, [pauseOnHover]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Task 5: Touch Swipe Gesture Handlers (With Issue 2 & 3 Fixes)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      touchEndXRef.current = touch.clientX;
      touchEndYRef.current = touch.clientY;

      // Issue 2 Fix: Clear existing swipe reset timer on new touch
      if (swipeResetTimerRef.current) {
        clearTimeout(swipeResetTimerRef.current);
        swipeResetTimerRef.current = null;
      }
      setLastSwipeDirection(null);

      if (pauseOnTouch) {
        setIsTouching(true);
      }
    },
    [pauseOnTouch]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (
      touchStartXRef.current !== null &&
      touchEndXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchEndYRef.current !== null
    ) {
      const deltaX = touchStartXRef.current - touchEndXRef.current;
      const deltaY = touchStartYRef.current - touchEndYRef.current;

      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swiped left -> next slide
          setLastSwipeDirection('left');
          nextSlide();
        } else {
          // Swiped right -> previous slide
          setLastSwipeDirection('right');
          prevSlide();
        }

        // Issue 2 Fix: Automatically auto-clear lastSwipeDirection after 2000ms
        if (swipeResetTimerRef.current) {
          clearTimeout(swipeResetTimerRef.current);
        }
        swipeResetTimerRef.current = setTimeout(() => {
          setLastSwipeDirection(null);
        }, 2000);
      }
    }

    // Reset touch coordinates and release touch pause
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;

    if (pauseOnTouch) {
      setIsTouching(false);
    }
  }, [swipeThreshold, nextSlide, prevSlide, pauseOnTouch]);

  // Issue 3 Fix: touchcancel event handler
  const handleTouchCancel = useCallback(() => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
    setLastSwipeDirection(null);
    if (swipeResetTimerRef.current) {
      clearTimeout(swipeResetTimerRef.current);
      swipeResetTimerRef.current = null;
    }
    if (pauseOnTouch) {
      setIsTouching(false);
    }
  }, [pauseOnTouch]);

  return {
    currentIndex,
    totalSlides,
    isPaused,
    isHovered,
    isTouching,
    isFocused,
    manualPause,
    setManualPause,
    lastSwipeDirection,
    nextSlide,
    prevSlide,
    goToSlide,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
}
