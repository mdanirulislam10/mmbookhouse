'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Bell, X, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallPromptProps {
  forceShow?: boolean;
  onInstalled?: () => void;
  onDismissed?: () => void;
}

/**
 * Module 20: PWA Install Prompt Bottom-Sheet & Push Notification Requester (Items 3, 5, 8)
 * Displays a mobile-friendly bottom-sheet inviting users to install the app:
 * - "📲 এম.এম বুক হাউস অ্যাপ আপনার ফোনে ইনস্টল করুন — বিদ্যুৎগতিতে বই কিনুন!"
 * - "Install Now" one-tap prompt execution
 * - Push notification permission toggle for live parcel tracking
 */
export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  forceShow = false,
  onInstalled,
  onDismissed,
}) => {
  const { isBengali } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(forceShow);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    if (typeof window === 'undefined') return;

    // Check if user dismissed the prompt recently (7-day cooldown)
    const lastDismissed = localStorage.getItem('mm_pwa_prompt_dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return;
      }
    }

    // Check if already installed in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Inspect notification permission
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [forceShow]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction if manual install
      alert(
        isBengali
          ? 'আপনার ব্রাউজার মেনু থেকে "Add to Home Screen" বা "Install App" চাপুন।'
          : 'Please select "Add to Home Screen" or "Install App" from your browser menu.'
      );
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
        if (onInstalled) onInstalled();
      }
    } catch (err) {
      console.warn('[PWA] Installation prompt error:', err);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mm_pwa_prompt_dismissed', Date.now().toString());
    }
    if (onDismissed) onDismissed();
  };

  const handleEnablePush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === 'granted') {
        // Trigger vibration confirmation if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-prompt-title"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
    >
      <div className="max-w-lg mx-auto bg-[#131921] text-white rounded-2xl shadow-2xl border border-gray-700/60 p-4 sm:p-5 backdrop-blur-md relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label={isBengali ? 'বন্ধ করুন' : 'Dismiss'}
          className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4">
          {/* App Icon */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-amber-400/30 bg-[#232f3e] flex items-center justify-center p-1.5 shadow-md">
            <Image
              src="/icons/icon-192.png"
              alt="M.M Book House App Icon"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{isBengali ? 'অফিসিয়াল মোবাইল অ্যাপ' : 'Official Mobile App'}</span>
            </div>

            <h3
              id="pwa-prompt-title"
              className="text-sm sm:text-base font-bold font-bengali text-white leading-snug"
            >
              {isBengali
                ? '📲 এম.এম বুক হাউস অ্যাপ আপনার ফোনে ইনস্টল করুন'
                : '📲 Install M.M Book House on your Phone'}
            </h3>

            <p className="text-xs text-gray-300 font-bengali mt-1 leading-relaxed">
              {isBengali
                ? 'বিদ্যুৎগতিতে বই কিনুন — প্লে-স্টোর ছাড়াই ইনস্ট্যান্ট ইনস্টল করুন ও স্পেশাল ছাড় পান!'
                : 'Instant 1-tap install without Play Store. Fast checkout, zero lag, and live order alerts.'}
            </p>
          </div>
        </div>

        {/* Push Notification Toggle Option */}
        {pushStatus !== 'granted' && (
          <div className="mt-3.5 pt-3 border-t border-gray-800 flex items-center justify-between text-xs font-bengali">
            <div className="flex items-center gap-2 text-gray-300">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>{isBengali ? 'পার্সেল ট্র্যাকিং নোটিফিকেশন' : 'Live Parcel Notifications'}</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-amber-300 font-medium text-xs transition-colors cursor-pointer"
            >
              {isBengali ? 'চালু করুন' : 'Enable'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2.5">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#febd69] hover:bg-[#f3a847] active:scale-[0.98] text-gray-950 font-bold py-2.5 px-4 rounded-xl text-sm font-bengali shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? (isBengali ? 'ইনস্টল হচ্ছে...' : 'Installing...') : (isBengali ? 'Install Now' : 'Install Now')}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800/80 text-gray-300 hover:text-white text-sm font-bengali transition-colors cursor-pointer"
          >
            {isBengali ? 'পরে করবো' : 'Later'}
          </button>
        </div>

        {/* Trust Badge */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isBengali ? '১০০% নিরাপদ ও মেমরি সেভিং PWA অ্যাপ' : '100% Secure & Lightweight PWA'}</span>
        </div>
      </div>
    </div>
  );
};
