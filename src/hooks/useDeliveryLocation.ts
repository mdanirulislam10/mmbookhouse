'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DeliveryLocationState, PincodeInfo, FulfillmentMode } from '@/types/header';
import {
  lookupPincodeServiceability,
  getDeliveryPincodeCookie,
  setDeliveryPincodeCookie,
  validateIndianPincode,
  normalizePincodeDigits,
  DEFAULT_PINCODE,
} from '@/lib/data/pincodeData';

const STORAGE_KEY = 'mm_delivery_location';
const CHANNEL_NAME = 'mm_delivery_location_channel';

export const DEFAULT_LOCATION: DeliveryLocationState = {
  pincode: DEFAULT_PINCODE,
  area: 'English Bazar (Malda Town)',
  district: 'Malda',
  state: 'West Bengal',
  isDetecting: false,
  source: 'default',
  fulfillmentMode: 'delivery',
};

/**
 * Normalizes input string by converting any Bengali script digits (০-৯) to ASCII digits (0-9).
 */
export function toEnglishDigits(input: string): string {
  return normalizePincodeDigits(input);
}

/**
 * Pincode validator & lookup returning PincodeInfo for Header & Components
 */
export function lookupPincode(pincode: string): PincodeInfo | null {
  const validation = validateIndianPincode(pincode);
  if (!validation.isValid) {
    return null;
  }

  const result = lookupPincodeServiceability(validation.normalizedPincode);
  return {
    pincode: result.pincode,
    area: result.area,
    district: result.district,
    state: result.state,
    isDeliverable: result.isDeliverable,
    isCodAvailable: result.isCodAvailable,
    estimatedDeliveryText: result.deliveryDateTextBn,
  };
}

let locationBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    locationBroadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    locationBroadcastChannel = null;
  }
}

function notifyTabsOfLocationChange(payload: DeliveryLocationState) {
  if (locationBroadcastChannel) {
    try {
      locationBroadcastChannel.postMessage({
        type: 'LOCATION_UPDATED',
        location: payload,
        timestamp: Date.now(),
      });
    } catch {
      // Ignore broadcast channel errors in restricted environments
    }
  }
}

interface DeliveryLocationStore {
  location: DeliveryLocationState;
  updatePincode: (pincode: string, customerName?: string) => boolean;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
  resetToDefault: () => void;
  setDirectLocation: (newLocation: DeliveryLocationState) => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationStore>()(
  persist(
    (set, get) => ({
      location: DEFAULT_LOCATION,

      updatePincode: (pincode: string, customerName?: string) => {
        const info = lookupPincode(pincode);
        if (!info) {
          return false;
        }

        const prev = get().location;
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

        set({ location: newLocation });
        // Task 2: Synchronize to Cookie (mm_pincode) as well as localStorage
        setDeliveryPincodeCookie(info.pincode);
        // Task 3: Broadcast to Header & Other Tabs
        notifyTabsOfLocationChange(newLocation);
        return true;
      },

      setFulfillmentMode: (mode: FulfillmentMode) => {
        const prev = get().location;
        const updated: DeliveryLocationState = {
          ...prev,
          fulfillmentMode: mode,
        };
        set({ location: updated });
        notifyTabsOfLocationChange(updated);
      },

      resetToDefault: () => {
        set({ location: DEFAULT_LOCATION });
        setDeliveryPincodeCookie(DEFAULT_LOCATION.pincode);
        notifyTabsOfLocationChange(DEFAULT_LOCATION);
      },

      setDirectLocation: (newLocation: DeliveryLocationState) => {
        set({ location: newLocation });
        setDeliveryPincodeCookie(newLocation.pincode);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Cross-tab synchronization listener (Task 3: BroadcastChannel Sync)
if (typeof window !== 'undefined' && locationBroadcastChannel) {
  locationBroadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'LOCATION_UPDATED' && event.data?.location) {
      useDeliveryLocationStore.getState().setDirectLocation(event.data.location);
    }
  };
}

// Initial Sync from Cookie if present on client startup (Task 2)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      const cookiePin = getDeliveryPincodeCookie();
      if (cookiePin) {
        const current = useDeliveryLocationStore.getState().location;
        if (current.pincode !== cookiePin) {
          useDeliveryLocationStore.getState().updatePincode(cookiePin);
        }
      }
    } catch {
      // Quiet fail if cookie reading fails
    }
  }, 50);
}

// Atomic Selectors for Performance & Optimization
export const useDeliveryLocationData = () => useDeliveryLocationStore((state) => state.location);
export const useDeliveryPincode = () => useDeliveryLocationStore((state) => state.location.pincode);
export const useFulfillmentMode = () => useDeliveryLocationStore((state) => state.location.fulfillmentMode);
export const useDeliveryCustomerName = () => useDeliveryLocationStore((state) => state.location.customerName);

/**
 * Unified hook for components
 */
export function useDeliveryLocation() {
  const location = useDeliveryLocationStore((state) => state.location);
  const updatePincode = useDeliveryLocationStore((state) => state.updatePincode);
  const setFulfillmentMode = useDeliveryLocationStore((state) => state.setFulfillmentMode);
  const resetToDefault = useDeliveryLocationStore((state) => state.resetToDefault);

  return {
    location,
    isInitialized: true,
    updatePincode,
    setFulfillmentMode,
    resetToDefault,
    lookupPincode,
  };
}
