'use client';

/**
 * Module 11 Task 3: "Use my current location" Button Component
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Item 8):
 * - One-click GPS location detection button
 * - Visual loading spinner & error toast/alert
 * - Automatic population of Pincode, City, State, Area
 */

import React from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import {
  useGeolocationAddress,
  type DetectedLocationResult,
} from '@/hooks/useGeolocationAddress';

interface CurrentLocationButtonProps {
  onLocationDetected: (location: DetectedLocationResult) => void;
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationDetected,
  className = '',
  variant = 'outline',
}) => {
  const { isLoading, error, isSupported, detectLocation, clearError } =
    useGeolocationAddress();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    clearError();
    const result = await detectLocation();
    if (result) {
      onLocationDetected(result);
    }
  };

  if (!isSupported) {
    return null;
  }

  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-lg text-xs md:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed';

  let variantStyle = 'px-3 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm';
  if (variant === 'primary') {
    variantStyle = 'px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow';
  } else if (variant === 'compact') {
    variantStyle = 'px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        id="btn-use-current-location"
        onClick={handleClick}
        disabled={isLoading}
        aria-label="Use my current location for delivery address"
        className={`${baseStyle} ${variantStyle} ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-amber-600" />
            <span>লোকেশন শনাক্ত হচ্ছে...</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-1.5 text-amber-600 fill-amber-100" />
            <span>📍 Use my current location (বর্তমান লোকেশন ব্যবহার করুন)</span>
          </>
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-md animate-fadeIn"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-400 hover:text-red-600 ml-1 font-bold"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
