'use client';

import React from 'react';
import { MapPin, Store } from 'lucide-react';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { useUserAddressSync } from '@/hooks/useUserAddressSync';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface DeliveryLocationProps {
  onOpenModal: () => void;
  className?: string;
}

export const DeliveryLocation: React.FC<DeliveryLocationProps> = ({
  onOpenModal,
  className = '',
}) => {
  const { location, updatePincode } = useDeliveryLocation();
  const { isLoggedIn, fullName } = useAuthSession();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);

  // Task 5: Auto-sync default address if authenticated user is logged in
  useUserAddressSync({
    onAddressFound: (pincode, customerName) => {
      updatePincode(pincode, customerName);
    },
  });

  const isPickup = location.fulfillmentMode === 'pickup';
  const customerDisplayName = isLoggedIn && fullName ? fullName.split(' ')[0] : location.customerName;

  return (
    <button
      type="button"
      onClick={onOpenModal}
      aria-label={
        isPickup
          ? dict.delivery.ariaPickup
          : dict.delivery.ariaDelivery(location.area, location.pincode)
      }
      className={`amazon-nav-box group text-left select-none text-white focus:outline-none cursor-pointer ${className}`}
    >
      {/* Map Marker or Store Icon */}
      <div className="pt-1.5 text-gray-300 group-hover:text-amber-400 transition-colors">
        {isPickup ? (
          <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        )}
      </div>

      {/* Text Container */}
      <div className="flex flex-col leading-tight ml-1 text-left">
        {/* Top Line: Mode / Customer Name */}
        <span className="text-[11px] text-gray-300 font-normal tracking-tight line-clamp-1">
          {isPickup
            ? dict.delivery.pickupMode
            : customerDisplayName
            ? `${dict.delivery.deliveryTo}: ${customerDisplayName}`
            : dict.delivery.deliveryLocation}
        </span>

        {/* Bottom Line: Area or Store Counter */}
        <span className="text-xs sm:text-[13px] font-bold text-white tracking-tight flex items-center gap-1 group-hover:text-amber-300 transition-colors">
          {isPickup ? (
            <span className="text-amber-400 font-medium text-[11px] sm:text-xs whitespace-nowrap">
              {dict.delivery.pickupCounterFree}
            </span>
          ) : (
            <>
              <span className="max-w-[110px] truncate">{location.area}</span>
              <span className="text-amber-400 font-mono text-[11px] sm:text-xs">
                {location.pincode}
              </span>
            </>
          )}
        </span>
      </div>
    </button>
  );
};
