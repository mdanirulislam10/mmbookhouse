'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Loader2,
  Clock,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { useUserAddressSync } from '@/hooks/useUserAddressSync';
import {
  lookupPincodeServiceability,
  validateIndianPincode,
  normalizePincodeDigits,
  setDeliveryPincodeCookie,
  DEFAULT_PINCODE,
  OFFLINE_FALLBACK_MESSAGE_BN,
  OFFLINE_FALLBACK_MESSAGE_EN,
} from '@/lib/data/pincodeData';
import { PincodeLookupResult, DeliverySpeedOption } from '@/types/delivery';
import { calculateSLA, isMaldaTownPincode } from '@/lib/services/slaEngine';
import { OrderCutoffTimer } from './OrderCutoffTimer';
import { FreeShippingProgressBar } from '../delivery/FreeShippingProgressBar';
import { MaldaExpressOption } from '../delivery/MaldaExpressOption';
import { CodEligibilityBadge } from './CodEligibilityBadge';


export interface PincodeDeliveryWidgetProps {
  bookPrice?: number;
  compact?: boolean;
  className?: string;
  onPincodeChange?: (pincode: string, info: PincodeLookupResult) => void;
  onSpeedOptionChange?: (speed: DeliverySpeedOption) => void;
}

// Known coordinates for graceful offline geocoding fallback (Task 4 & 8)
const GEO_HUBS = [
  { pincode: '732101', lat: 25.0108, lng: 88.1411, name: 'Malda Town' },
  { pincode: '734001', lat: 26.7271, lng: 88.3953, name: 'Siliguri' },
  { pincode: '733129', lat: 25.6173, lng: 88.1252, name: 'Raiganj' },
  { pincode: '733134', lat: 25.2217, lng: 88.7667, name: 'Balurghat' },
  { pincode: '742101', lat: 24.0988, lng: 88.2679, name: 'Berhampore' },
  { pincode: '700073', lat: 22.5726, lng: 88.3639, name: 'Kolkata Boipara' },
];

function findNearestHubPincode(lat: number, lng: number): string {
  let closestPincode = DEFAULT_PINCODE;
  let minDistance = Infinity;

  for (const hub of GEO_HUBS) {
    const dLat = hub.lat - lat;
    const dLng = hub.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closestPincode = hub.pincode;
    }
  }

  return closestPincode;
}

export const PincodeDeliveryWidget: React.FC<PincodeDeliveryWidgetProps> = ({
  bookPrice = 0,
  compact = false,
  className = '',
  onPincodeChange,
  onSpeedOptionChange,
}) => {
  const { isBengali } = useLanguage();
  const { location, updatePincode } = useDeliveryLocation();

  // Active pincode from store or fallback
  const currentPincode = location.pincode || DEFAULT_PINCODE;

  // Local component states
  const [inputVal, setInputVal] = useState(currentPincode);
  const [isEditing, setIsEditing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedSpeed, setSelectedSpeed] = useState<DeliverySpeedOption>('standard');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSpeedChange = (speed: DeliverySpeedOption) => {
    setSelectedSpeed(speed);
    if (onSpeedOptionChange) {
      onSpeedOptionChange(speed);
    }
  };

  // Synchronize inputVal when store location changes (Task 3: Real-time sync with Header)
  useEffect(() => {
    if (!isEditing) {
      setInputVal(location.pincode);
    }
  }, [location.pincode, isEditing]);

  // Online / Offline monitor for graceful resilience (Task 8)
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Task 6: Auth Profile Auto-fill (Initialize from user's primary shipping address if authenticated)
  useUserAddressSync({
    onAddressFound: (pincode, customerName) => {
      if (pincode && pincode !== location.pincode) {
        updatePincode(pincode, customerName);
        setDeliveryPincodeCookie(pincode);
      }
    },
  });

  // Calculate serviceability info for active pincode
  const serviceInfo = lookupPincodeServiceability(currentPincode);
  const slaInfo = calculateSLA(currentPincode, {
    isSuperExpressSelected: selectedSpeed === 'malda_2hr_express',
  });

  // Focus input when inline edit opens (Task 7)
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isEditing]);

  // Submit & validate pincode
  const handleApplyPincode = (pincodeToApply?: string) => {
    const code = pincodeToApply ?? inputVal;
    setErrorText(null);
    setGeoNotice(null);

    // Task 5: Regex validation ^[1-9][0-9]{5}$
    const validation = validateIndianPincode(code);
    if (!validation.isValid) {
      setErrorText(
        isBengali
          ? validation.error || 'সঠিক ৬-ডিজিটের ভারতীয় পিনকোড দিন'
          : 'Please enter a valid 6-digit Indian pincode'
      );
      return;
    }

    const validCode = validation.normalizedPincode;

    // Task 2: Persistence to localStorage & mm_pincode cookie
    // Task 3: Sync with Header store & BroadcastChannel
    const success = updatePincode(validCode);
    if (success) {
      setDeliveryPincodeCookie(validCode);
      setIsEditing(false);
      setIsSuccessFlash(true);
      setTimeout(() => setIsSuccessFlash(false), 1200);

      const updatedInfo = lookupPincodeServiceability(validCode);
      if (onPincodeChange) {
        onPincodeChange(validCode, updatedInfo);
      }
    } else {
      setErrorText(
        isBengali
          ? 'পিনকোডটি যাচাই করা সম্ভব হয়নি'
          : 'Unable to verify pincode'
      );
    }
  };

  // Task 4: Geolocation API Integration ("📍 Use my current location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(
        isBengali
          ? 'আপনার ব্রাউজারে জিওলোকেশন সমর্থিত নয়'
          : 'Geolocation is not supported by your browser'
      );
      return;
    }

    setIsLocating(true);
    setErrorText(null);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedPin: string | null = null;

        try {
          // Attempt reverse geocode via secure internal API route (prevents CORS & 403 Forbidden)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4500);

          const response = await fetch(
            `/api/delivery/reverse-geocode?lat=${latitude}&lon=${longitude}`,
            {
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const resData = await response.json();
            if (resData?.success && resData?.data?.pincode) {
              const validation = validateIndianPincode(resData.data.pincode);
              if (validation.isValid) {
                detectedPin = validation.normalizedPincode;
              }
            }
          }
        } catch {
          // Network error or timeout: fall through to coordinate distance matching
        }

        // Coordinate fallback if reverse-geocode API didn't yield a valid pincode
        if (!detectedPin) {
          detectedPin = findNearestHubPincode(latitude, longitude);
        }

        setIsLocating(false);
        if (detectedPin) {
          setInputVal(detectedPin);
          handleApplyPincode(detectedPin);
          setGeoNotice(
            isBengali
              ? 'লোকেশন অনুযায়ী পিনকোড আপডেট করা হয়েছে'
              : 'Pincode updated based on your location'
          );
          setTimeout(() => setGeoNotice(null), 3000);
        }
      },
      (error) => {
        setIsLocating(false);
        // Graceful error fallback
        let msg = isBengali
          ? 'লোকেশন অ্যাক্সেস পাওয়া যায়নি। ডিফল্ট হিসেবে মালদা নির্বাচন করা হলো।'
          : 'Location access denied. Defaulted to Malda.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = isBengali
            ? 'লোকেশন পারমিশন দেওয়া হয়নি। অনুগ্রহ করে ম্যানুয়ালি পিনকোড দিন।'
            : 'Location permission denied. Please enter pincode manually.';
        }
        setGeoNotice(msg);
        setTimeout(() => setGeoNotice(null), 4000);
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 120000,
      }
    );
  };

  const isFreeDelivery = bookPrice >= (serviceInfo.minOrderFreeShipping || 499);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        isSuccessFlash
          ? 'bg-green-50/70 border-green-400 ring-2 ring-green-100'
          : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-xs'
      } ${compact ? 'p-3 text-xs' : 'p-4 text-sm'} ${className}`}
    >
      {/* Header: Deliver To & Area Display with Inline Edit Link */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <MapPin
            className={`shrink-0 text-[#007185] mt-0.5 ${
              compact ? 'w-3.5 h-3.5' : 'w-4 h-4'
            }`}
          />
          <div className="leading-snug min-w-0">
            <span className="text-gray-500 text-[11px] block font-medium">
              {isBengali ? 'ডেলিভারি গন্তব্য:' : 'Deliver to:'}
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 font-mono tracking-tight">
                {currentPincode}
              </span>
              <span className="text-gray-600 truncate font-medium max-w-[150px] sm:max-w-[200px]">
                • {serviceInfo.area || serviceInfo.postOffice}
              </span>
            </div>
          </div>
        </div>

        {/* Task 7: 1-Click Inline Edit Trigger (Blue "Change / পরিবর্তন" Link) */}
        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setErrorText(null);
            }}
            className="text-[#007185] hover:text-[#005a6a] hover:underline font-bold text-xs shrink-0 cursor-pointer pt-0.5 transition-colors"
          >
            {isBengali ? 'পরিবর্তন' : 'Change'}
          </button>
        )}
      </div>

      {/* Task 7: Inline Edit Form (Revealed when Change is clicked) */}
      {isEditing && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5">
            {/* Slim 6-Digit Input */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={inputVal}
                onChange={(e) => {
                  const cleaned = normalizePincodeDigits(e.target.value)
                    .replace(/\D/g, '')
                    .slice(0, 6);
                  setInputVal(cleaned);
                  if (errorText) setErrorText(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyPincode();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setInputVal(currentPincode);
                    setErrorText(null);
                  }
                }}
                placeholder={isBengali ? '৬ সংখ্যার পিনকোড' : '6-digit pincode'}
                className={`w-full px-2.5 py-1.5 font-mono text-xs font-semibold rounded border outline-none transition-all ${
                  errorText
                    ? 'border-red-500 ring-2 ring-red-100 text-red-900 bg-red-50/30'
                    : 'border-gray-300 focus:border-[#007185] focus:ring-2 focus:ring-sky-100 text-gray-900 bg-gray-50/50'
                }`}
              />
            </div>

            {/* Blue Amazon-Style "Check / Update" Button */}
            <button
              type="button"
              onClick={() => handleApplyPincode()}
              className="px-3 py-1.5 bg-[#007185] hover:bg-[#005a6a] active:bg-[#004855] text-white font-bold text-xs rounded shadow-xs cursor-pointer transition-colors whitespace-nowrap"
            >
              {isBengali ? 'আপডেট' : 'Check'}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setInputVal(currentPincode);
                setErrorText(null);
              }}
              className="px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs rounded cursor-pointer transition-colors"
            >
              {isBengali ? 'বাতিল' : 'Cancel'}
            </button>
          </div>

          {/* Task 4: Geolocation Trigger Button */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1 text-[11px] text-[#007185] hover:text-[#005a6a] hover:underline font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#007185]" />
                  <span>
                    {isBengali ? 'লোকেশন শনাক্ত হচ্ছে...' : 'Detecting location...'}
                  </span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3" />
                  <span>
                    {isBengali
                      ? 'আমার বর্তমান লোকেশন ব্যবহার করুন'
                      : 'Use my current location'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Task 5: Red Error Alert for Invalid Regex */}
      {errorText && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50/80 px-2.5 py-1.5 rounded border border-red-200 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Geolocation feedback notice */}
      {geoNotice && (
        <div className="mt-2 text-[11px] text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200">
          {geoNotice}
        </div>
      )}

      {/* Serviceability & Delivery Date Badge Row (Active State) */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-2">
        {/* Task 11: Amazon Format Exact Delivery Date Promise */}
        <div className="flex items-start gap-1.5 text-gray-800">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold text-gray-900">
              {isBengali ? slaInfo.fullPromiseBn : slaInfo.fullPromiseEn}
            </span>
          </div>
        </div>

        {/* Task 16: Real-time Order Cut-off Timer */}
        <div className="pt-0.5">
          <OrderCutoffTimer pincode={currentPincode} compact={compact} />
        </div>

        {/* Task 12 - 15: SLA Specific Zone Badges */}
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap text-xs font-semibold">
          {slaInfo.zone === 'local_malda' && (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
              <span>{isBengali ? slaInfo.slaBadgeBn : slaInfo.slaBadgeEn}</span>
            </span>
          )}

          {slaInfo.zone === 'regional_north_bengal' && (
            <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              <Truck className="w-3 h-3 text-sky-600" />
              <span>{isBengali ? 'আঞ্চলিক এক্সপ্রেস (১-২ কার্যদিবস)' : 'Regional Express (1-2 Days)'}</span>
            </span>
          )}

          {slaInfo.zone === 'south_bengal' && (
            <span className="inline-flex items-center gap-1 text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              <Truck className="w-3 h-3 text-indigo-600" />
              <span>{isBengali ? 'ওয়েস্ট বেঙ্গল নেটওয়ার্ক (২-৩ দিন)' : 'WB Express Network (2-3 Days)'}</span>
            </span>
          )}

          {slaInfo.zone === 'national' && (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Truck className="w-3 h-3 text-amber-600" />
              <span>{isBengali ? 'অল-ইন্ডিয়া স্পিড ডেলিভারি (৪-৬ কার্যদিবস)' : 'All-India Speed Delivery (4-6 Days)'}</span>
            </span>
          )}
        </div>

        {/* Task 20: Malda Municipality 2-Hour Super-Express Selector */}
        {slaInfo.isExpressOptionAvailable && (
          <div className="pt-1">
            <MaldaExpressOption
              pincode={currentPincode}
              selectedOption={selectedSpeed}
              onChange={handleSpeedChange}
              isFreeStandardShipping={isFreeDelivery}
            />
          </div>
        )}

        {/* Task 19: Amazon Style Free Shipping Progress Bar */}
        {bookPrice > 0 && (
          <div className="pt-1">
            <FreeShippingProgressBar currentAmount={bookPrice} compact={compact} />
          </div>
        )}

        {/* Free Delivery & Shipping Rate Notice */}
        <div className="flex items-center gap-1.5 text-xs">
          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-emerald-800 font-semibold">
            {isFreeDelivery
              ? isBengali
                ? 'বিনামূল্যে ডেলিভারি (FREE Delivery)'
                : 'FREE Delivery'
              : isBengali
              ? 'স্ট্যান্ডার্ড ডেলিভারি: মাত্র ₹৪০ (₹৪৯৯+ অর্ডারে ফ্রি)'
              : 'Standard Delivery: ₹40 (Free on ₹499+)'}
          </span>
        </div>

        {/* Task 21 & 22: COD Eligibility & Transparent Handling Fee Display */}
        <div className="pt-1">
          <CodEligibilityBadge
            pincode={currentPincode}
            isCodAvailable={serviceInfo.isCodAvailable}
            codHandlingFee={serviceInfo.codHandlingFee}
            compact={compact}
            showHandlingFeeNotice={true}
          />
        </div>


        {/* Task 8: Offline / Fallback Notice */}
        {(!isOnline || serviceInfo.isFallback) && (
          <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              {isBengali
                ? OFFLINE_FALLBACK_MESSAGE_BN
                : OFFLINE_FALLBACK_MESSAGE_EN}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
