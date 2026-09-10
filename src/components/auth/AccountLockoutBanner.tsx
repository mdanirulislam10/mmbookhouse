'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { lockoutService } from '@/lib/auth/lockoutService';

interface AccountLockoutBannerProps {
  phoneNumber: string;
  onReset: () => void;
  className?: string;
}

/**
 * Task 29: 15-Minute Lockout Interactive Countdown Widget
 */
export const AccountLockoutBanner: React.FC<AccountLockoutBannerProps> = ({
  phoneNumber,
  onReset,
  className = '',
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(15 * 60);

  useEffect(() => {
    const status = lockoutService.checkLockout(phoneNumber);
    if (status.isLocked) {
      setRemainingSec(status.remainingSeconds);
    }

    const interval = setInterval(() => {
      const currentStatus = lockoutService.checkLockout(phoneNumber);
      if (!currentStatus.isLocked) {
        clearInterval(interval);
        setRemainingSec(0);
        onReset();
      } else {
        setRemainingSec(currentStatus.remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phoneNumber, onReset]);

  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  };

  return (
    <div className={`p-6 bg-red-50/90 border border-red-200 rounded-2xl text-center space-y-4 font-bengali shadow-sm ${className}`}>
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div>
        <h3 className="text-lg font-black text-gray-950">অ্যাকাউন্ট সাময়িকভাবে স্থগিত</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          পরপর ৫ বার ভুল ওটিপি দেওয়ার কারণে আপনার অ্যাকাউন্ট সুরক্ষার জন্য <span className="font-bold text-red-700">+91 {phoneNumber}</span> নম্বরটি ১৫ মিনিটের জন্য লক করা হয়েছে।
        </p>
      </div>

      {/* Live Ticking Countdown Timer */}
      <div className="bg-white border border-red-200/80 rounded-xl p-3 inline-flex items-center gap-2 shadow-xs">
        <Clock className="w-4 h-4 text-red-600 animate-spin" />
        <span className="text-xs text-gray-600 font-semibold">লক খোলার বাকি সময়:</span>
        <span className="font-mono font-black text-base text-red-700">
          {formatCountdown(remainingSec)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>অন্য নম্বর ব্যবহার করুন</span>
        </button>

        <a
          href="https://wa.me/919800123456?text=আমার+অ্যাকাউন্ট+ভুল+ওটিপির+কারণে+লক+হয়েছে,+সাহায্য+প্রয়োজন"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>হোয়াটসঅ্যাপ সহায়তায় যোগাযোগ</span>
        </a>
      </div>
    </div>
  );
};
