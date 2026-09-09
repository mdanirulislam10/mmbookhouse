'use client';

import { useState, useEffect, useCallback } from 'react';
import { DeliveryLocationState, PincodeInfo, FulfillmentMode } from '@/types/header';

const STORAGE_KEY = 'mm_delivery_location';

// Curated list of West Bengal and nearby pincodes for immediate, instant validation
const KNOWN_PINCODES: Record<string, { area: string; district: string; state: string; days: string }> = {
  '732101': { area: 'English Bazar (Malda Town)', district: 'Malda', state: 'West Bengal', days: 'Same-day / 24 Hours' },
  '732102': { area: 'Old Malda', district: 'Malda', state: 'West Bengal', days: '24 Hours' },
  '732103': { area: 'Mangalbari', district: 'Malda', state: 'West Bengal', days: '24 Hours' },
  '732124': { area: 'Chanchal', district: 'Malda', state: 'West Bengal', days: '1-2 Days' },
  '732125': { area: 'Gazole', district: 'Malda', state: 'West Bengal', days: '1-2 Days' },
  '732138': { area: 'Ratua', district: 'Malda', state: 'West Bengal', days: '1-2 Days' },
  '732142': { area: 'Samsi', district: 'Malda', state: 'West Bengal', days: '1-2 Days' },
  '732201': { area: 'Kaliachak', district: 'Malda', state: 'West Bengal', days: '1-2 Days' },
  '734001': { area: 'Siliguri Town', district: 'Darjeeling', state: 'West Bengal', days: '2 Days' },
  '700001': { area: 'Kolkata GPO', district: 'Kolkata', state: 'West Bengal', days: '2-3 Days' },
  '700073': { area: 'College Street (Boipara)', district: 'Kolkata', state: 'West Bengal', days: '2-3 Days' },
  '742101': { area: 'Berhampore', district: 'Murshidabad', state: 'West Bengal', days: '2 Days' },
  '713201': { area: 'Durgapur', district: 'Paschim Bardhaman', state: 'West Bengal', days: '3 Days' },
};

export const DEFAULT_LOCATION: DeliveryLocationState = {
  pincode: '732101',
  area: 'English Bazar (Malda Town)',
  district: 'Malda',
  state: 'West Bengal',
  isDetecting: false,
  source: 'default',
  fulfillmentMode: 'delivery',
};

export function lookupPincode(pincode: string): PincodeInfo | null {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return null;
  }

  const known = KNOWN_PINCODES[clean];
  if (known) {
    return {
      pincode: clean,
      area: known.area,
      district: known.district,
      state: known.state,
      isDeliverable: true,
      isCodAvailable: true,
      estimatedDeliveryText: known.days,
    };
  }

  // Generic valid Indian pincode (delivery available via India Post / Delhivery)
  return {
    pincode: clean,
    area: 'Local Area',
    district: 'India Delivery',
    state: clean.startsWith('7') ? 'West Bengal / Eastern Region' : 'India',
    isDeliverable: true,
    isCodAvailable: true,
    estimatedDeliveryText: '3-5 Days (India Post)',
  };
}

export function useDeliveryLocation() {
  const [location, setLocation] = useState<DeliveryLocationState>(DEFAULT_LOCATION);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DeliveryLocationState;
        if (parsed.pincode && /^[1-9][0-9]{5}$/.test(parsed.pincode)) {
          setLocation({
            ...parsed,
            area: parsed.area || 'Malda',
            district: parsed.district || 'Malda',
            state: parsed.state || 'West Bengal',
            fulfillmentMode: parsed.fulfillmentMode === 'pickup' ? 'pickup' : 'delivery',
          });
          setIsInitialized(true);
          return;
        }
      }
    } catch {
      // LocalStorage access disabled or error
    }

    // Default fallback
    setLocation(DEFAULT_LOCATION);
    setIsInitialized(true);
  }, []);

  // Update pincode and save to localStorage while preserving current fulfillmentMode
  const updatePincode = useCallback((pincode: string, customerName?: string) => {
    const info = lookupPincode(pincode);
    if (!info) {
      return false;
    }

    setLocation((prev) => {
      const newLocation: DeliveryLocationState = {
        pincode: info.pincode,
        area: info.area,
        district: info.district,
        state: info.state,
        isDetecting: false,
        source: customerName ? 'user_profile' : 'user_input',
        customerName: customerName ?? prev.customerName,
        fulfillmentMode: prev.fulfillmentMode || 'delivery',
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
      } catch {
        // Ignore
      }

      return newLocation;
    });

    return true;
  }, []);

  // Task 9: Toggle between 'delivery' and 'pickup' without losing other fields
  const setFulfillmentMode = useCallback((mode: FulfillmentMode) => {
    setLocation((prev) => {
      const updated: DeliveryLocationState = {
        ...prev,
        fulfillmentMode: mode,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setLocation(DEFAULT_LOCATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    location,
    isInitialized,
    updatePincode,
    setFulfillmentMode,
    resetToDefault,
    lookupPincode,
  };
}
