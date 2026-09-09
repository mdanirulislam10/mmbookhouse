'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowRight, X, RotateCcw } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface PricePreset {
  id: string;
  min?: number;
  max?: number;
  label: string;
  labelBn: string;
}

const PRICE_PRESETS: PricePreset[] = [
  {
    id: 'under-200',
    min: undefined,
    max: 200,
    label: 'Under ₹200',
    labelBn: '₹২০০ এর নিচে',
  },
  {
    id: '200-500',
    min: 200,
    max: 500,
    label: '₹200 – ₹500',
    labelBn: '₹২০০ – ₹৫০০',
  },
  {
    id: '500-1000',
    min: 500,
    max: 1000,
    label: '₹500 – ₹1,000',
    labelBn: '₹৫০০ – ₹১,০০০',
  },
  {
    id: 'over-1000',
    min: 1000,
    max: undefined,
    label: 'Over ₹1,000',
    labelBn: '₹১,০০০ এর বেশি',
  },
];

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  priceCounts?: {
    under200: number;
    from200to500: number;
    from500to1000: number;
    over1000: number;
  };
  isBengali?: boolean;
}

/**
 * Task 19: Hybrid Price Control & Range Filter (হাইব্রিড প্রাইস কন্ট্রোল ও রেঞ্জ ফিল্টার)
 * Combines 1-click preset price brackets, custom Min/Max currency inputs with "Go" button,
 * and a smooth interactive dual range slider.
 */
export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onPriceChange,
  priceCounts,
  isBengali = true,
}) => {
  const [localMin, setLocalMin] = useState<string>(minPrice !== undefined ? String(minPrice) : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice !== undefined ? String(maxPrice) : '');
  const [sliderVal, setSliderVal] = useState<number>(maxPrice !== undefined ? maxPrice : 2000);

  // Sync internal state when external props change
  useEffect(() => {
    setLocalMin(minPrice !== undefined ? String(minPrice) : '');
    setLocalMax(maxPrice !== undefined ? String(maxPrice) : '');
    if (maxPrice !== undefined) {
      setSliderVal(maxPrice);
    }
  }, [minPrice, maxPrice]);

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedMin = localMin ? Math.max(0, parseInt(localMin, 10)) : undefined;
    const parsedMax = localMax ? Math.max(0, parseInt(localMax, 10)) : undefined;

    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      // Swap if min > max
      onPriceChange(parsedMax, parsedMin);
    } else {
      onPriceChange(parsedMin, parsedMax);
    }
  };

  const handlePresetClick = (preset: PricePreset) => {
    const isCurrentlyActive =
      minPrice === preset.min && maxPrice === preset.max;

    if (isCurrentlyActive) {
      // Toggle off
      onPriceChange(undefined, undefined);
    } else {
      onPriceChange(preset.min, preset.max);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderVal(val);
    setLocalMax(String(val));
    onPriceChange(minPrice, val);
  };

  const isPresetActive = (preset: PricePreset) => {
    return minPrice === preset.min && maxPrice === preset.max;
  };

  const hasActivePrice = minPrice !== undefined || maxPrice !== undefined;

  const getCountForPreset = (id: string): number => {
    if (!priceCounts) return 0;
    switch (id) {
      case 'under-200':
        return priceCounts.under200;
      case '200-500':
        return priceCounts.from200to500;
      case '500-1000':
        return priceCounts.from500to1000;
      case 'over-1000':
        return priceCounts.over1000;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-3" role="group" aria-label={isBengali ? 'বইয়ের মূল্য ফিল্টার' : 'Price range filter'}>
      {/* 1. Quick Click Presets */}
      <div className="space-y-1">
        {PRICE_PRESETS.map((preset) => {
          const active = isPresetActive(preset);
          const count = getCountForPreset(preset.id);
          const disabled = priceCounts !== undefined && count === 0;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetClick(preset)}
              className={`w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-xs transition-all text-left select-none ${
                disabled
                  ? 'opacity-35 cursor-not-allowed bg-transparent'
                  : active
                  ? 'bg-amber-50/90 text-amber-950 font-semibold border border-amber-300 shadow-2xs cursor-pointer ring-1 ring-amber-400/40'
                  : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                    active ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="truncate">{isBengali ? preset.labelBn : preset.label}</span>
              </div>

              {priceCounts && (
                <span
                  className={`text-[11px] font-mono tabular-nums shrink-0 ${
                    active ? 'text-amber-800 font-bold' : 'text-gray-400'
                  }`}
                >
                  ({isBengali ? toBengaliNumerals(count) : count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Custom Min & Max Input Form with "Go" Button */}
      <form onSubmit={handleApplyCustom} className="pt-2 border-t border-gray-100">
        <div className="text-[11px] font-bold text-gray-700 mb-1.5">
          {isBengali ? 'কাস্টম প্রাইস রেঞ্জ (₹)' : 'Custom Price Range (₹)'}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Min Input */}
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder={isBengali ? 'শুরু' : 'Min'}
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full pl-5 pr-1.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono bg-white"
            />
          </div>

          <span className="text-gray-400 text-xs">-</span>

          {/* Max Input */}
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder={isBengali ? 'শেষ' : 'Max'}
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full pl-5 pr-1.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono bg-white"
            />
          </div>

          {/* Amazon "Go" button */}
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-md shadow-2xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-0.5 border border-amber-600"
            title={isBengali ? 'প্রয়োগ করুন' : 'Apply'}
          >
            <span>{isBengali ? 'Go' : 'Go'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* 3. Range Slider Control */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>{isBengali ? 'সর্বোচ্চ বাজেট:' : 'Max budget:'}</span>
          <span className="font-bold text-amber-900 font-mono">
            ₹{isBengali ? toBengaliNumerals(sliderVal) : sliderVal}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="2500"
          step="50"
          value={sliderVal}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
        <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5">
          <span>₹১০০</span>
          <span>₹১,০০০</span>
          <span>₹২,৫০০+</span>
        </div>
      </div>

      {/* 4. Clear Price Filter */}
      {hasActivePrice && (
        <button
          type="button"
          onClick={() => {
            setLocalMin('');
            setLocalMax('');
            onPriceChange(undefined, undefined);
          }}
          className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isBengali ? 'মূল্য ফিল্টার মুছুন' : 'Reset price filter'}</span>
        </button>
      )}
    </div>
  );
};
