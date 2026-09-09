'use client';

import React from 'react';
import { Truck, Store } from 'lucide-react';
import { FulfillmentMode } from '@/types/header';

interface PickupToggleProps {
  mode: FulfillmentMode;
  onChange: (mode: FulfillmentMode) => void;
  className?: string;
}

export const PickupToggle: React.FC<PickupToggleProps> = ({
  mode,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200 select-none ${className}`}>
      {/* Home Delivery Option */}
      <button
        type="button"
        onClick={() => onChange('delivery')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
          mode === 'delivery'
            ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
        }`}
      >
        <Truck className={`w-3.5 h-3.5 ${mode === 'delivery' ? 'text-amber-600' : 'text-gray-500'}`} />
        <span>হোম ডেলিভারি</span>
      </button>

      {/* Store Pickup Option */}
      <button
        type="button"
        onClick={() => onChange('pickup')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
          mode === 'pickup'
            ? 'bg-amber-500 text-gray-950 shadow-xs border border-amber-600'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
        }`}
      >
        <Store className={`w-3.5 h-3.5 ${mode === 'pickup' ? 'text-gray-950' : 'text-gray-500'}`} />
        <span>দোকান থেকে সংগ্রহ (ফ্রি)</span>
      </button>
    </div>
  );
};
