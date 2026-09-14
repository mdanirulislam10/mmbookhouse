'use client';

import React, { useState, useMemo } from 'react';
import { Truck, Zap, Store, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DeliverySpeedId, DeliverySpeedOption } from '@/types/checkout';
import { getAvailableDeliverySpeeds, calculateSpeedAdjustment } from '@/lib/services/deliverySpeedService';

export interface DeliverySpeedSelectorProps {
  pincode: string;
  baseShippingFee: number;
  selectedSpeed?: DeliverySpeedId;
  onSelectSpeed: (speed: DeliverySpeedId, additionalFee: number, finalShippingFee: number) => void;
  onContinueToPayment?: () => void;
  className?: string;
}

/**
 * Module 12 - Task 4: Amazon Delivery Speed & SLA Selector Component (Step 2)
 * 
 * Features:
 * - 3 Shipping Speed Cards: Standard, Same-Day Express, and Store Pickup (Item 23).
 * - Bold Green Calendar Delivery Promise (Item 24).
 * - Live Speed Surcharge & Store Pickup ₹0 Fee Waiver (Item 22).
 * - Pincode Serviceability Awareness: Disables same-day express if outside Malda Town.
 */
export const DeliverySpeedSelector: React.FC<DeliverySpeedSelectorProps> = ({
  pincode,
  baseShippingFee,
  selectedSpeed = 'standard',
  onSelectSpeed,
  onContinueToPayment,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [currentSpeed, setCurrentSpeed] = useState<DeliverySpeedId>(selectedSpeed);

  // Calculate options based on current pincode
  const options = useMemo(() => {
    return getAvailableDeliverySpeeds(pincode || '732101');
  }, [pincode]);

  const handleSelect = (option: DeliverySpeedOption) => {
    if (!option.isAvailableForPincode) return;
    setCurrentSpeed(option.id);
    const { speedFee, finalShippingFee } = calculateSpeedAdjustment(option.id, baseShippingFee);
    onSelectSpeed(option.id, speedFee, finalShippingFee);
  };

  const getSpeedIcon = (id: DeliverySpeedId) => {
    switch (id) {
      case 'express_sameday':
        return <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />;
      case 'store_pickup':
        return <Store className="w-5 h-5 text-blue-600 shrink-0" />;
      default:
        return <Truck className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <div className={`space-y-4 select-none ${className}`}>
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = currentSpeed === opt.id;
          const isDisabled = !opt.isAvailableForPincode;

          return (
            <div
              key={opt.id}
              onClick={() => !isDisabled && handleSelect(opt)}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  !isDisabled && handleSelect(opt);
                }
              }}
              className={`relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                isDisabled
                  ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed'
                  : isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Radio Indicator & Icon */}
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                        {getSpeedIcon(opt.id)}
                        <span>{isBengali ? opt.titleBn : opt.title}</span>
                      </div>

                      {opt.id === 'express_sameday' && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                          {isBengali ? 'সুপারফাস্ট এক্সপ্রেস' : 'EXPRESS'}
                        </span>
                      )}

                      {opt.id === 'store_pickup' && (
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-300">
                          {isBengali ? 'ফ্রি সেলফ-পিকআপ' : 'FREE PICKUP'}
                        </span>
                      )}
                    </div>

                    {/* Bold Green Delivery Promise (Item 24) */}
                    <p className="text-xs sm:text-sm font-black text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{opt.guaranteedDeliveryDateBn}</span>
                    </p>

                    <p className="text-xs text-gray-500">
                      {isBengali ? opt.subtitleBn : opt.subtitle}
                    </p>

                    {/* Cutoff Notice if Same-Day */}
                    {opt.cutoffTimeNoticeBn && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{opt.cutoffTimeNoticeBn}</span>
                      </p>
                    )}

                    {/* Disabled Warning if outside Malda Town */}
                    {isDisabled && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {isBengali
                            ? 'আপনার নির্বাচিত পিনকোডে এক্সপ্রেস পরিষেবা উপলব্ধ নয়'
                            : 'Express delivery not available for this pincode'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Tag */}
                <div className="text-right shrink-0">
                  {opt.id === 'store_pickup' ? (
                    <div>
                      <span className="text-sm font-black text-emerald-700">
                        {isBengali ? 'বিনামূল্যে (₹০)' : 'FREE (₹0)'}
                      </span>
                      <p className="text-[10px] text-gray-400 line-through">
                        ₹{baseShippingFee}
                      </p>
                    </div>
                  ) : opt.fee > 0 ? (
                    <div>
                      <span className="text-sm font-black text-gray-900">
                        +₹{opt.fee}
                      </span>
                      <p className="text-[10px] text-gray-500">
                        {isBengali ? 'গতি সারচার্জ' : 'speed surcharge'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-black text-gray-900">
                        {baseShippingFee > 0 ? `₹${baseShippingFee}` : (isBengali ? 'ফ্রি' : 'FREE')}
                      </span>
                      <p className="text-[10px] text-gray-500">
                        {isBengali ? 'স্ট্যান্ডার্ড ফি' : 'standard fee'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Button to Advance to Step 3 */}
      {onContinueToPayment && (
        <div className="pt-3">
          <button
            type="button"
            onClick={onContinueToPayment}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full font-black text-sm bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200] shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>{isBengali ? 'পেমেন্ট ও অর্ডার রিভিউ ধাপে যান' : 'Continue to Payment & Review'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliverySpeedSelector;
