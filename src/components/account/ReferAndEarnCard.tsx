'use client';

import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Sparkles, Users, Coins, HelpCircle } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface ReferAndEarnCardProps {
  userId?: string;
  fullName?: string;
  referralCode?: string;
  pointsBalance?: number;
  referralCount?: number;
  className?: string;
}

/**
 * Task 48: "Refer & Earn" Customer Rewards Card
 * Allows customers to copy their unique referral code, share via WhatsApp,
 * and track accumulated book discount reward points.
 */
export const ReferAndEarnCard: React.FC<ReferAndEarnCardProps> = ({
  userId = 'guest',
  fullName = 'গ্রাহক',
  referralCode: propCode,
  pointsBalance = 350,
  referralCount = 3,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Generate deterministic referral code if not provided
  const generatedCode = React.useMemo(() => {
    if (propCode) return propCode;
    const cleanPrefix = fullName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 5)
      .toUpperCase() || 'MMB';
    const hashNum = Math.abs(
      (userId + fullName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 100)
    ) % 9000 + 1000;
    return `MM-${cleanPrefix}-${hashNum}`;
  }, [propCode, userId, fullName]);

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${generatedCode}`
    : `https://mmbookhouse.com/?ref=${generatedCode}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedCode);
      } else {
        const input = document.createElement('input');
        input.value = generatedCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Graceful fallback
    }
  };

  const shareText = encodeURIComponent(
    `নমস্কার! M.M Book House মালদা থেকে যেকোনো সিলেবাস, WBCS বা কলেজের বই অর্ডারে আমার রেফারেল কোড ব্যবহার করুন: *${generatedCode}*। আপনি পাবেন বিশেষ ছাড় এবং আমিও পাব রিওয়ার্ড পয়েন্ট! লিঙ্ক: ${referralUrl}`
  );
  const whatsappShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className={`bg-white rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner with Gold Gradient */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>রেফার করুন ও পয়েন্ট জিতুন</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              বন্ধুকে আমন্ত্রণ জানান, পান <span className="underline decoration-white/40">১০০ রিওয়ার্ড পয়েন্ট</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl">
              আপনার বন্ধুদের M.M Book House-এ আমন্ত্রণ জানান। তারা প্রথম বই কিনলেই আপনি পাবেন ১০০ পয়েন্ট (₹১০ সমমূল্য) যা পরবর্তী বই কেনায় ছাড় হিসেবে প্রযোজ্য।
            </p>
          </div>

          {/* Points Highlight Chip */}
          <div className="shrink-0 bg-white/15 backdrop-blur-xs rounded-xl p-4 border border-white/25 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-white/80 font-medium">আপনার ব্যালেন্স</span>
            <div className="flex items-center gap-1 text-2xl font-black text-white mt-0.5">
              <Coins className="w-5 h-5 text-amber-200" />
              <span>{toBengaliNumerals(pointsBalance)}</span>
            </div>
            <span className="text-[10px] text-amber-200 font-bold mt-0.5">
              ≈ ₹{toBengaliNumerals(Math.floor(pointsBalance / 10))} ওয়ালেট ছাড়
            </span>
          </div>
        </div>
      </div>

      {/* Referral Code & Sharing Actions */}
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Code Box */}
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">আপনার ইউনিক রেফারেল কোড:</span>
              <span className="text-lg font-black text-gray-900 tracking-wider font-mono">
                {generatedCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-gray-950 hover:text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>কোড কপি</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Share Button */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-sm shrink-0 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে শেয়ার</span>
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">সফল রেফারেল</span>
              <span className="text-base font-black text-gray-900">
                {toBengaliNumerals(referralCount)} জন বন্ধু
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">অর্জিত মোট ছাড়</span>
              <span className="text-base font-black text-gray-900">
                ₹{toBengaliNumerals(Math.floor(pointsBalance / 10))}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">পয়েন্টের মেয়াদ</span>
              <span className="text-xs font-bold text-emerald-700">আজীবন বৈধ (No Expiry)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
