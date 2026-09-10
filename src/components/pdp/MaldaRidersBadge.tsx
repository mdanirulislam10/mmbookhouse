'use client';

import React, { useState } from 'react';
import {
  Bike,
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronDown,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { DEFAULT_PINCODE } from '@/lib/data/pincodeData';

export interface MaldaRidersBadgeProps {
  compact?: boolean;
  pincode?: string;
  showCoverageList?: boolean;
  className?: string;
}

const MALDA_RIDERS_HUBS = [
  'ইংলিশবাজার সদর',
  'ফোয়ারা মোড় ও নেতাজি সুভাষ রোড',
  'রথবাড়ি ও ঝলঝলিয়া',
  'মঙ্গলবাড়ি ও ওল্ড মালদা',
  'মহানন্দাপল্লী ও কৃষ্ণপল্লী',
  'পিরোজপুর ও সানন্দা মোড়',
  'সুজাপুর ও মোখলেসপুর হাব',
];

const MALDA_RIDERS_HUBS_EN = [
  'English Bazar H.O.',
  'Foara More & NS Road',
  'Rathbari & Jhaljhalia',
  'Mangalbari & Old Malda',
  'Mahanandapally & Krishnapally',
  'Pirozpur & Sananda More',
  'Sujapur & Mokleshpur Hub',
];

/**
 * Task 30: Malda Local Book Riders Network Trust Badge
 * "মালদা শহরের ভেতরে নিজস্ব লোকাল বুক রাইডার্স নেটওয়ার্কের ট্রাস্ট ব্যাজ"
 * "মালদা শহরের অর্ডারে কোনো থার্ড-পার্টি কুরিয়ারের অপেক্ষা না করে নিজস্ব ডেলিভারি টিম দিয়ে দ্রুততম সময়ে বই পৌঁছানো হবে।"
 */
export const MaldaRidersBadge: React.FC<MaldaRidersBadgeProps> = ({
  compact = false,
  pincode: propPincode,
  showCoverageList = true,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const { location } = useDeliveryLocation();
  const [showAreas, setShowAreas] = useState(false);

  const activePincode = propPincode || location.pincode || DEFAULT_PINCODE;
  const isMaldaPincode = activePincode.startsWith('732');

  return (
    <div
      className={`rounded-xl border transition-all ${
        compact
          ? 'p-2.5 bg-emerald-50/70 border-emerald-300'
          : 'p-3.5 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/50 border-emerald-300 shadow-2xs'
      } ${className}`}
      data-testid="malda-riders-badge"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 shadow-2xs mt-0.5">
            <Bike className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                {isBengali
                  ? 'মালদা নিজস্ব বুক রাইডার্স নেটওয়ার্ক'
                  : 'Malda Express Book Riders Network'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {isBengali ? '২৪ ঘণ্টায় ডেলিভারি' : '24h Delivery'}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-700 mt-0.5 leading-relaxed">
              {isBengali ? (
                <>
                  মালদা শহরের ভেতরে অর্ডারে কোনো থার্ড-পার্টি কুরিয়ারের অপেক্ষা নয়—
                  আমাদের <strong>নিজস্ব লোকাল ডেলিভারি টিম</strong> দিয়ে দ্রুততম সময়ে সরাসরি আপনার হাতে বই পৌঁছে যাবে।
                </>
              ) : (
                <>
                  Orders within Malda Town skip third-party courier bottlenecks—
                  our <strong>dedicated in-house book rider fleet</strong> delivers directly to your hands in under 24 hours.
                </>
              )}
            </p>

            {/* Rider assurances */}
            <div className="mt-2 flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] text-emerald-900 font-medium">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{isBengali ? 'একই দিন / কালকের মধ্যে' : 'Same-Day / Next-Day'}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBengali ? 'রাইডারের সাথে সরাসরি কল' : 'Direct Rider Helpline'}</span>
              </div>
            </div>
          </div>
        </div>

        {showCoverageList && (
          <button
            type="button"
            onClick={() => setShowAreas(!showAreas)}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-0.5 shrink-0 cursor-pointer pt-0.5"
            title={isBengali ? 'কভারেজ এলাকা দেখুন' : 'View Malda Coverage Areas'}
          >
            <span className="hidden sm:inline">
              {isBengali ? 'কভারেজ এলাকা' : 'Coverage'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showAreas ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Malda Rider Coverage Areas Accordion */}
      {showCoverageList && showAreas && (
        <div className="mt-3 pt-2.5 border-t border-emerald-100 text-xs animate-in fade-in duration-150">
          <span className="font-bold text-gray-900 block mb-1.5 text-[11px]">
            {isBengali
              ? 'মালদা শহরের সুপার-ফাস্ট রাইডার কভারেজ এলাকা:'
              : 'Malda Town Express Rider Coverage Hubs:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(isBengali ? MALDA_RIDERS_HUBS : MALDA_RIDERS_HUBS_EN).map((hub) => (
              <span
                key={hub}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900 text-[10px] font-medium border border-emerald-200"
              >
                <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                <span>{hub}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
