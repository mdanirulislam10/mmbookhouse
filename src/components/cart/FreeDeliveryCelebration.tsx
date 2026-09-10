'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle2, PartyPopper, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartSubtotal } from '@/hooks/useCartStore';
import { AppLanguage } from '@/types/header';

export interface FreeDeliveryCelebrationProps {
  /**
   * Cart subtotal amount in INR. If omitted, automatically tracks `useCartSubtotal()`.
   */
  subtotal?: number;

  /**
   * Target threshold for free delivery in INR (default ₹499).
   */
  threshold?: number;

  /**
   * Force celebration display regardless of subtotal (useful for previews, manual triggers, tests).
   */
  forceShow?: boolean;

  /**
   * Compact badge mode for embedding in mini-carts, slide-over drawers, or inside progress bars.
   */
  compact?: boolean;

  /**
   * Language override ('bn' | 'en'). Defaults to active app language.
   */
  language?: AppLanguage;

  /**
   * Callback when user dismisses the celebration.
   */
  onDismiss?: () => void;

  /**
   * Auto-collapse / dismiss timeout in milliseconds (e.g. 5000).
   */
  autoCollapseMs?: number;

  /**
   * Additional CSS classes.
   */
  className?: string;

  /**
   * Whether to disable confetti burst particles (e.g. for accessibility / reduced motion).
   */
  disableConfetti?: boolean;
}

interface ConfettiParticle {
  id: number;
  x: number; // percentage horizontally
  color: string;
  size: number;
  delayMs: number;
  durationMs: number;
  shape: 'circle' | 'square' | 'strip';
  rotation: number;
}

const CONFETTI_COLORS = [
  '#10b981', // emerald-500
  '#059669', // emerald-600
  '#34d399', // emerald-400
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
];

/**
 * Task 32: Free Shipping Confetti Celebration Badge (`FreeDeliveryCelebration.tsx`)
 *
 * Renders an engaging, high-converting celebratory banner when the cart subtotal
 * qualifies for Free Delivery (subtotal >= ₹499), featuring:
 * - Emerald green gradient styling with `border-emerald-300`
 * - Animated celebratory icons (`PartyPopper`, `Sparkles`, `CheckCircle2`)
 * - Pure CSS confetti burst particles
 * - Dynamic bilingual messaging (Bengali & English)
 * - Accessible `role="status"` and `aria-live="polite"`
 * - Compact and dismissible modes
 */
export const FreeDeliveryCelebration: React.FC<FreeDeliveryCelebrationProps> = ({
  subtotal,
  threshold = 499,
  forceShow = false,
  compact = false,
  language: langOverride,
  onDismiss,
  autoCollapseMs,
  className = '',
  disableConfetti = false,
}) => {
  const cartSubtotal = useCartSubtotal();
  const { language: contextLang } = useLanguage();

  const activeLanguage = langOverride ?? contextLang;
  const isBengali = activeLanguage === 'bn';

  const [isDismissed, setIsDismissed] = useState(false);
  const [showConfettiBurst, setShowConfettiBurst] = useState(true);

  const effectiveSubtotal = typeof subtotal === 'number' ? Math.max(0, subtotal) : cartSubtotal;
  const isQualified = forceShow || effectiveSubtotal >= threshold;

  // Generate deterministic confetti particle configuration
  const confettiParticles: ConfettiParticle[] = useMemo(() => {
    if (disableConfetti) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 5 + (i * 90) / 18,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + (i % 4) * 2.5,
      delayMs: (i * 65) % 450,
      durationMs: 1400 + (i % 3) * 300,
      shape: i % 3 === 0 ? 'strip' : i % 2 === 0 ? 'square' : 'circle',
      rotation: (i * 47) % 360,
    }));
  }, [disableConfetti]);

  // Handle auto-collapse if specified
  useEffect(() => {
    if (isQualified && autoCollapseMs && autoCollapseMs > 0 && !isDismissed) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
        onDismiss?.();
      }, autoCollapseMs);
      return () => clearTimeout(timer);
    }
  }, [isQualified, autoCollapseMs, isDismissed, onDismiss]);

  // Reset dismissed state if subtotal falls below and re-qualifies
  useEffect(() => {
    if (!isQualified) {
      setIsDismissed(false);
      setShowConfettiBurst(true);
    }
  }, [isQualified]);

  // Stop active confetti burst animation after 2.5 seconds to save resources
  useEffect(() => {
    if (isQualified && !disableConfetti) {
      const timer = setTimeout(() => setShowConfettiBurst(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isQualified, disableConfetti]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // If not qualified and not forced, or dismissed, render nothing
  if (!isQualified || isDismissed) {
    return null;
  }

  // 1. Compact Badge Mode
  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={isBengali ? 'ফ্রি ডেলিভারি সক্রিয় বার্তা' : 'Free delivery unlocked notice'}
        data-testid="free-delivery-celebration-compact"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 via-emerald-100 to-teal-50 border border-emerald-300 text-emerald-900 text-xs font-bold font-bengali shadow-xs transition-all ${className}`}
      >
        <PartyPopper className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-bounce" />
        <span className="leading-none">
          {isBengali
            ? '🎉 অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়ে গেছেন!'
            : '🎉 Congratulations! You have unlocked FREE Delivery on this order!'}
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isBengali ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss notice'}
            className="ml-1 p-0.5 text-emerald-700 hover:text-emerald-950 rounded-full hover:bg-emerald-200/50 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // 2. High-Engagement Full Celebration Banner
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isBengali ? 'ফ্রি ডেলিভারি আনলক সেলিব্রেশন' : 'Free delivery celebration banner'}
      data-testid="free-delivery-celebration-banner"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/90 to-green-50 border-2 border-emerald-300 p-4 shadow-sm ring-1 ring-emerald-200 transition-all ${className}`}
    >
      {/* Confetti Burst Particle Layer */}
      {showConfettiBurst && !disableConfetti && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10"
        >
          {confettiParticles.map((particle) => (
            <span
              key={particle.id}
              className="absolute top-0 animate-confetti"
              style={{
                left: `${particle.x}%`,
                width: `${particle.size}px`,
                height:
                  particle.shape === 'strip'
                    ? `${particle.size * 2.2}px`
                    : `${particle.size}px`,
                backgroundColor: particle.color,
                borderRadius:
                  particle.shape === 'circle'
                    ? '9999px'
                    : particle.shape === 'strip'
                    ? '2px'
                    : '1px',
                transform: `rotate(${particle.rotation}deg)`,
                animation: `confetti-fall ${particle.durationMs}ms ease-out ${particle.delayMs}ms forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Embedded CSS for Confetti fall and icon animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-8px) rotate(0deg) scale(0.6);
          }
          50% {
            opacity: 0.9;
            transform: translateY(22px) rotate(180deg) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(55px) rotate(360deg) scale(0.8);
          }
        }
      `}</style>

      {/* Main Content Layout */}
      <div className="relative z-20 flex items-start justify-between gap-3">
        {/* Left Celebratory Badge & Icon Cluster */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0 ring-2 ring-white">
            <PartyPopper className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 bg-white text-emerald-700 rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" />
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            {/* Primary Localized Headline */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-emerald-950 text-sm sm:text-base font-bengali leading-snug tracking-tight">
                {isBengali
                  ? '🎉 অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়ে গেছেন!'
                  : '🎉 Congratulations! You have unlocked FREE Delivery on this order!'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                <Sparkles className="w-3 h-3 text-amber-600 fill-amber-400 inline" />
                <span>{isBengali ? 'ফ্রি শিপিং' : 'FREE SHIPPING'}</span>
              </span>
            </div>

            {/* Explanatory Subtext */}
            <p className="text-xs text-emerald-800/90 font-medium font-bengali leading-relaxed">
              {isBengali ? (
                <>
                  অর্ডার করার সময় কোনো শিপিং চার্জ প্রযোজ্য হবে না{' '}
                  <span className="font-mono text-[11px] text-emerald-700">
                    (Zero Shipping Fee applied at checkout)
                  </span>
                </>
              ) : (
                <>
                  Zero Shipping Fee applied at checkout{' '}
                  <span className="font-bengali text-[11px] text-emerald-700">
                    (অর্ডার করার সময় কোনো শিপিং চার্জ প্রযোজ্য হবে না)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Action / Dismiss Button */}
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isBengali ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss celebration'}
            className="shrink-0 p-1 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FreeDeliveryCelebration;
