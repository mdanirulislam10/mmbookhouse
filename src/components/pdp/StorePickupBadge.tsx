'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Store,
  ChevronRight,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';

interface StorePickupBadgeProps {
  stockCount?: number;
  storeName?: string;
  storeAddress?: string;
  className?: string;
  variant?: 'pill' | 'card';
}

/**
 * Task 44: Malda Offline Store Live Counter Stock Pill / Card
 * "📍 নেতাজি সুভাষ রোড দোকানে এই মুহূর্তে ৪ কপি মজুত আছে — আজই সরাসরি সংগ্রহ করতে পারেন।"
 */
export const StorePickupBadge: React.FC<StorePickupBadgeProps> = ({
  stockCount = 4,
  storeName = 'এম.এম বুক হাউস মালদা শোরুম',
  storeAddress = 'নেতাজি সুভাষ রোড (ফোয়ারা মোড় সংলগ্ন), মালদা টাউন - ৭৩২১০১',
  className = '',
  variant = 'pill',
}) => {
  const { isBengali } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const isAvailable = stockCount > 0;

  if (variant === 'pill') {
    return (
      <div className={`relative ${className}`}>
        <div
          onClick={() => setShowDetails(!showDetails)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowDetails(!showDetails)}
          className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
            isAvailable
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 hover:bg-amber-100/50 shadow-2xs'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={isBengali ? 'মালদা শোরুম পিকআপের বিশদ বিবরণ' : 'Malda Store Pickup Details'}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Live Pulsing Dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />

            <div className="text-xs text-amber-950 font-medium truncate">
              {isAvailable ? (
                <>
                  <span className="font-bold text-amber-900">
                    {isBengali ? 'নেতাজি সুভাষ রোড দোকানে ' : 'At NS Road Store: '}
                  </span>
                  <span>
                    {isBengali
                      ? `এই মুহূর্তে ${toBengaliNumerals(stockCount)} কপি মজুত আছে`
                      : `${stockCount} copies available right now`}
                  </span>
                  <span className="hidden sm:inline text-emerald-800 font-bold ml-1.5">
                    {isBengali ? '— আজই সরাসরি সংগ্রহ করুন' : '— Ready for Pickup Today'}
                  </span>
                </>
              ) : (
                <span>
                  {isBengali ? 'দোকানে স্টক শেষ (অনলাইন অর্ডার উপলব্ধ)' : 'Out of stock at offline store'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 shrink-0">
            <span className="hidden md:inline">{isBengali ? 'বিশদ' : 'Details'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {/* Dropdown Details Popover */}
        {showDetails && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 p-4 rounded-xl bg-white border border-amber-300 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">{storeName}</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {isBengali ? 'খোলা আছে' : 'Open Now'}
              </span>
            </div>

            <div className="text-xs text-gray-600 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>{storeAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  {isBengali
                    ? 'সোম – শনি: সকাল ৯:০০ – রাত ৯:৩০ | রবি: সকাল ১০:০০ – দুপুর ২:০০'
                    : 'Mon – Sat: 9:00 AM – 9:30 PM | Sun: 10:00 AM – 2:00 PM'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{isBengali ? 'কাউন্টার হেল্পলাইন: ৯৭৩৩০৮৫০০০' : 'Counter Helpline: +91 97330 85000'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isBengali ? 'কোনো শিপিং চার্জ নেই (₹০)' : 'Zero Shipping Charges (Free)'}
              </span>

              <a
                href="https://maps.google.com/?q=Netaji+Subhash+Road+Malda"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold underline"
              >
                <Navigation className="w-3 h-3" />
                <span>{isBengali ? 'ম্যাপে দেখুন' : 'View on Map'}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Card Variant
  return (
    <div
      className={`p-4 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 shadow-xs space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-amber-900">
            {isBengali ? 'মালদা অফলাইন স্টোর লাইভ কাউন্টার' : 'Malda Store Live Counter'}
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
          {isBengali
            ? `${toBengaliNumerals(stockCount)} কপি মজুত`
            : `${stockCount} In Stock`}
        </span>
      </div>

      <p className="text-xs text-gray-700 leading-relaxed">
        {isBengali ? (
          <>
            📍 <strong>নেতাজি সুভাষ রোড দোকানে</strong> এই মুহূর্তে{' '}
            <strong className="text-amber-900">{toBengaliNumerals(stockCount)} কপি মজুত আছে</strong> —
            আজই সরাসরি শোরুম থেকে সংগ্রহ করতে পারেন কোনো অগ্রিম পেমেন্ট ছাড়া।
          </>
        ) : (
          <>
            📍 Available at <strong>Netaji Subhash Road Store</strong> (<strong>{stockCount} copies</strong>).
            Walk-in and pick up immediately today with zero delivery fees!
          </>
        )}
      </p>

      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-gray-600">
        <span>{isBengali ? 'খোলা থাকে: সকাল ৯:০০ – রাত ৯:৩০' : 'Timing: 9:00 AM – 9:30 PM'}</span>
        <a
          href="tel:9733085000"
          className="text-amber-800 font-bold hover:underline flex items-center gap-1"
        >
          <Phone className="w-3 h-3" />
          <span>{isBengali ? 'কল করুন' : 'Call Store'}</span>
        </a>
      </div>
    </div>
  );
};
