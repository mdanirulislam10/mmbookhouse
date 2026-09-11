'use client';

/**
 * Module 11 Task 7: Checkout Delivery Address Selector Component
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 22, 29, 30, 37, 45, 46):
 * - Tap-to-select Amazon-style radio cards with emerald/teal selection highlight (Item 30)
 * - Auto-selection of customer default address (Item 22)
 * - Inline "+ Add a new delivery address" modal trigger without leaving checkout funnel (Item 29)
 * - Live real-time shipping fee & SLA recalculation on address switch (Item 45)
 * - "Billing address same as delivery address" toggle with separate billing support (Item 37)
 * - "This order is a gift" support with gift message (Item 46)
 * - 100% mobile-responsive, touch targets >= 44px, full accessibility
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Plus,
  CheckCircle2,
  Truck,
  Phone,
  Edit2,
  Gift,
  Receipt,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals, formatINR } from '@/lib/utils/currency';
import { calculateAddressShippingFee, type AddressShippingEstimate } from '@/lib/services/pincodeService';
import { addCustomerAddress, updateCustomerAddress } from '@/actions/address';
import { AddressFormModal } from '@/components/account/AddressFormModal';
import type { CustomerAddress, AddressFormData, AddressType } from '@/types/address';

export interface CheckoutAddressSelectorProps {
  /** List of customer's saved addresses */
  addresses: CustomerAddress[];
  /** Currently selected delivery address ID */
  selectedAddressId?: string;
  /** Callback when user selects an address, passing address and updated shipping fee */
  onSelectAddress: (address: CustomerAddress, shippingFee: number) => void;
  /** Order subtotal for live threshold and shipping calculations */
  orderSubtotal?: number;
  /** Callback when an address is added or updated (for parent synchronization) */
  onAddressMutated?: (mutatedAddress: CustomerAddress) => void;
  /** Optional user ID for server actions */
  userId?: string;
  /** Optional custom CSS class */
  className?: string;
  /** Gift order state & toggle */
  isGiftOrder?: boolean;
  onToggleGiftOrder?: (isGift: boolean) => void;
  giftMessage?: string;
  onChangeGiftMessage?: (message: string) => void;
  /** Billing address toggle & selection */
  billingAddressSame?: boolean;
  onChangeBillingAddressSame?: (isSame: boolean) => void;
  selectedBillingAddressId?: string;
  onSelectBillingAddress?: (address: CustomerAddress) => void;
  /** Optional callback when user presses "Deliver to this address" to advance to next checkout step */
  onConfirmAddressStep?: (address: CustomerAddress) => void;
}

export const CheckoutAddressSelector: React.FC<CheckoutAddressSelectorProps> = ({
  addresses,
  selectedAddressId: controlledSelectedId,
  onSelectAddress,
  orderSubtotal = 0,
  onAddressMutated,
  userId,
  className = '',
  isGiftOrder = false,
  onToggleGiftOrder,
  giftMessage = '',
  onChangeGiftMessage,
  billingAddressSame = true,
  onChangeBillingAddressSame,
  selectedBillingAddressId,
  onSelectBillingAddress,
  onConfirmAddressStep,
}) => {
  const { isBengali } = useLanguage();

  // Internal selection fallback
  const [internalSelectedId, setInternalSelectedId] = useState<string>('');
  const [isBillingSame, setIsBillingSame] = useState<boolean>(billingAddressSame);
  const [isGift, setIsGift] = useState<boolean>(isGiftOrder);
  const [giftNote, setGiftNote] = useState<string>(giftMessage);

  // Address Form Modal state for inline "+ Add new delivery address" or "Edit"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Determine active selected ID.
  // User interaction (internal) wins so tapping a card always updates the
  // highlight, even when the parent keeps `selectedAddressId` fixed.
  const activeSelectedId = internalSelectedId || controlledSelectedId || '';

  // Active selected address object
  const activeAddress = useMemo(() => {
    if (!addresses || addresses.length === 0) return null;
    const found = addresses.find((a) => a.id === activeSelectedId);
    if (found) return found;

    // Item 22: Auto-select default address
    const defaultAddr = addresses.find((a) => a.is_default);
    return defaultAddr || addresses[0];
  }, [addresses, activeSelectedId]);

  // Keep the latest onSelectAddress in a ref so the shipping-fee broadcast
  // effect never suffers from a stale closure without re-firing every render.
  const onSelectAddressRef = useRef(onSelectAddress);
  useEffect(() => {
    onSelectAddressRef.current = onSelectAddress;
  }, [onSelectAddress]);

  // Mirror an externally controlled selection into internal state (one-way)
  useEffect(() => {
    if (controlledSelectedId) {
      setInternalSelectedId(controlledSelectedId);
    }
  }, [controlledSelectedId]);

  // Sync initial selection & broadcast shipping fee
  useEffect(() => {
    if (!activeAddress) return;

    if (activeAddress.id !== activeSelectedId) {
      setInternalSelectedId(activeAddress.id);
    }

    const shippingEstimate = calculateAddressShippingFee(activeAddress.pincode, orderSubtotal);
    onSelectAddressRef.current(activeAddress, shippingEstimate.shippingFee);
  }, [activeAddress?.id, activeAddress?.pincode, activeSelectedId, orderSubtotal]);

  // Sync external billing same state
  useEffect(() => {
    setIsBillingSame(billingAddressSame);
  }, [billingAddressSame]);

  // Sync external gift state
  useEffect(() => {
    setIsGift(isGiftOrder);
  }, [isGiftOrder]);

  // Handle address card click
  const handleCardSelect = useCallback(
    (address: CustomerAddress) => {
      setInternalSelectedId(address.id);
      const estimate = calculateAddressShippingFee(address.pincode, orderSubtotal);
      onSelectAddress(address, estimate.shippingFee);
    },
    [onSelectAddress, orderSubtotal]
  );

  // Handle opening modal for new address
  const handleAddNewClick = useCallback(() => {
    setEditingAddress(null);
    setIsModalOpen(true);
  }, []);

  // Handle opening modal for editing an address
  const handleEditClick = useCallback((e: React.MouseEvent, address: CustomerAddress) => {
    e.stopPropagation();
    setEditingAddress(address);
    setIsModalOpen(true);
  }, []);

  // Handle saving new or updated address via modal
  const handleSaveModalAddress = useCallback(
    async (formData: AddressFormData) => {
      try {
        if (editingAddress) {
          const res = await updateCustomerAddress(editingAddress.id, formData, userId);
          if (res.success && res.data) {
            onAddressMutated?.(res.data);
            if (res.data.id === activeSelectedId) {
              const estimate = calculateAddressShippingFee(res.data.pincode, orderSubtotal);
              onSelectAddress(res.data, estimate.shippingFee);
            }
          }
        } else {
          const res = await addCustomerAddress(formData, userId);
          if (res.success && res.data) {
            onAddressMutated?.(res.data);
            // Auto-select newly added address
            setInternalSelectedId(res.data.id);
            const estimate = calculateAddressShippingFee(res.data.pincode, orderSubtotal);
            onSelectAddress(res.data, estimate.shippingFee);
          }
        }
        setIsModalOpen(false);
        setEditingAddress(null);
      } catch (err) {
        console.error('Failed to save address in checkout:', err);
      }
    },
    [editingAddress, userId, onAddressMutated, activeSelectedId, orderSubtotal, onSelectAddress]
  );

  // Address Type Tag helper
  const renderTypeTag = (type: AddressType) => {
    switch (type) {
      case 'home':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Home className="w-3 h-3 text-blue-600" />
            {isBengali ? 'বাড়ি' : 'Home'}
          </span>
        );
      case 'work':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Briefcase className="w-3 h-3 text-purple-600" />
            {isBengali ? 'অফিস / কর্মক্ষেত্র' : 'Work'}
          </span>
        );
      case 'hostel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <GraduationCap className="w-3 h-3 text-amber-600" />
            {isBengali ? 'হোস্টেল / মেস' : 'Hostel / Mess'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <MapPin className="w-3 h-3 text-gray-500" />
            {isBengali ? 'অন্যান্য' : 'Other'}
          </span>
        );
    }
  };

  // Live Shipping Estimate for active selected address
  const activeEstimate: AddressShippingEstimate | null = useMemo(() => {
    if (!activeAddress) return null;
    return calculateAddressShippingFee(activeAddress.pincode, orderSubtotal);
  }, [activeAddress, orderSubtotal]);

  return (
    <section
      aria-label="Delivery Address Selector"
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Step Header */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 px-4 sm:px-6 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#007185] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            1
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              {isBengali ? 'ডেলিভারি ঠিকানা নির্বাচন করুন' : 'Select a delivery address'}
            </h2>
            <p className="text-xs text-gray-500">
              {isBengali
                ? `সংরক্ষিত ঠিকানা: ${toBengaliNumerals(addresses.length)}টি`
                : `${addresses.length} saved address${addresses.length === 1 ? '' : 'es'}`}
            </p>
          </div>
        </div>

        {/* Live Shipping Fee Indicator in Header */}
        {activeEstimate && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {activeEstimate.isFreeShipping
                ? isBengali
                  ? 'ডেলিভারি চার্জ: সম্পূর্ণ ফ্রি'
                  : 'Delivery: FREE'
                : isBengali
                ? `ডেলিভারি চার্জ: ₹${toBengaliNumerals(activeEstimate.shippingFee)} (${activeEstimate.zoneLabelBn})`
                : `Delivery: ${formatINR(activeEstimate.shippingFee)} (${activeEstimate.zoneLabelEn})`}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Empty State */}
        {addresses.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
              {isBengali ? 'কোনো ডেলিভারি ঠিকানা পাওয়া যায়নি' : 'No delivery address saved yet'}
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto mb-4">
              {isBengali
                ? 'অর্ডারটি দ্রুততম সময়ে আপনার ঠিকানায় পৌঁছে দিতে নিচে বোতামে চাপ দিয়ে ঠিকানাটি যোগ করুন।'
                : 'Add your delivery address to proceed with your order smoothly.'}
            </p>
            <button
              type="button"
              onClick={handleAddNewClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 font-bold rounded-lg shadow-sm border border-[#fcd200] active:scale-95 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              {isBengali ? 'নতুন ঠিকানা যোগ করুন' : 'Add New Address'}
            </button>
          </div>
        ) : (
          /* Radio Cards Grid / List (Item 30) */
          <div
            role="radiogroup"
            aria-label="Delivery addresses list"
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
          >
            {addresses.map((addr) => {
              const isSelected = activeAddress?.id === addr.id;
              const estimate = calculateAddressShippingFee(addr.pincode, orderSubtotal);

              return (
                <div
                  key={addr.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => handleCardSelect(addr)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleCardSelect(addr);
                    }
                  }}
                  className={`relative group rounded-xl p-4 sm:p-4.5 cursor-pointer transition-all duration-200 outline-hidden select-none flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                      : 'border border-gray-200 hover:border-gray-400 bg-white hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Radio Checkmark, Name & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Custom Styled Radio Circle */}
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300 group-hover:border-gray-400 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />}
                        </div>

                        {/* Recipient Name */}
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 text-sm sm:text-base truncate block">
                            {addr.recipient_name}
                          </span>
                        </div>
                      </div>

                      {/* Tag Badges */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {renderTypeTag(addr.address_type)}
                        {addr.is_default && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {isBengali ? 'প্রধান' : 'Default'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Street Address & Location */}
                    <div className="pl-7 text-xs sm:text-sm text-gray-700 space-y-1 leading-relaxed">
                      <p className="font-medium text-gray-800 break-words">
                        {addr.address_line1 || addr.street_address}
                        {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                      </p>

                      {/* Landmark */}
                      {addr.landmark && (
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <span className="font-semibold text-gray-700">
                            {isBengali ? 'ল্যান্ডমার্ক:' : 'Landmark:'}
                          </span>
                          <span className="text-gray-600 truncate">{addr.landmark}</span>
                        </p>
                      )}

                      {/* City, State & Pincode */}
                      <p className="text-xs text-gray-600 font-medium">
                        {addr.city}, {addr.state} -{' '}
                        <strong className="text-gray-900 font-mono tracking-wider">
                          {addr.pincode}
                        </strong>
                      </p>

                      {/* Phone */}
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-0.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{addr.recipient_phone}</span>
                        {addr.alternate_phone && (
                          <span className="text-gray-400">({addr.alternate_phone})</span>
                        )}
                      </p>

                      {/* Special Delivery Preferences (Items 13-17) */}
                      {addr.delivery_preferences && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {addr.delivery_preferences.callBeforeDelivery && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700">
                              {isBengali ? '📞 ডেলিভারির আগে কল' : 'Call before delivery'}
                            </span>
                          )}
                          {addr.delivery_preferences.isWeekendClosed && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800">
                              {isBengali ? '🚫 শনি/রবিবার বন্ধ' : 'Weekend closed'}
                            </span>
                          )}
                          {addr.delivery_preferences.leaveWithSecurity && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-700">
                              {isBengali ? '🛡️ গেটে জমা দিন' : 'Leave at gate'}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Live SLA & Delivery Estimate Banner (Item 45) */}
                      <div className="pt-2">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-1.5 ${
                            estimate.isMaldaTown
                              ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                              : 'bg-gray-50 text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="font-semibold truncate">
                              {isBengali ? estimate.deliverySpeedTextBn : estimate.deliverySpeedTextEn}
                            </span>
                          </div>
                          <span className="font-bold shrink-0 font-mono text-[11px]">
                            {estimate.isFreeShipping
                              ? isBengali
                                ? 'ফ্রি'
                                : 'FREE'
                              : `₹${estimate.shippingFee}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pl-7 pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(e, addr)}
                      className="text-xs font-semibold text-[#007185] hover:text-[#c45500] hover:underline flex items-center gap-1 py-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      {isBengali ? 'ঠিকানা এডিট করুন' : 'Edit address'}
                    </button>

                    {isSelected && onConfirmAddressStep && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmAddressStep(addr);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 font-bold rounded-md text-xs shadow-xs border border-[#fcd200] active:scale-95 transition-all"
                      >
                        <span>{isBengali ? 'এই ঠিকানায় ডেলিভারি করুন' : 'Deliver to this address'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Bar: Inline Add Address Button (Item 29) */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddNewClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 shadow-xs hover:border-gray-400 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 text-[#007185]" />
            <span>{isBengali ? '+ নতুন ডেলিভারি ঠিকানা যোগ করুন' : '+ Add a new delivery address'}</span>
          </button>

          {activeAddress && onConfirmAddressStep && (
            <button
              type="button"
              onClick={() => onConfirmAddressStep(activeAddress)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 font-bold rounded-lg shadow-sm border border-[#fcd200] active:scale-98 transition-all text-sm ml-auto"
            >
              <span>
                {isBengali
                  ? `"${activeAddress.recipient_name}"-এর ঠিকানায় ডেলিভারি করুন`
                  : `Deliver to this address`}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Additional Checkout Options: Billing Address & Gift Delivery (Items 37 & 46) */}
        <div className="pt-4 border-t border-gray-200/80 space-y-3">
          {/* Billing Address Toggle (Item 37) */}
          <div className="rounded-lg border border-gray-200 p-3 sm:p-3.5 bg-gray-50/60">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBillingSame}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsBillingSame(val);
                  onChangeBillingAddressSame?.(val);
                }}
                className="mt-0.5 w-4 h-4 rounded text-[#007185] focus:ring-[#007185] border-gray-300 cursor-pointer"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-gray-600" />
                  {isBengali
                    ? 'বিলিং ঠিকানা ও ডেলিভারি ঠিকানা একই (Billing address is same as delivery address)'
                    : 'Use this address as billing address'}
                </span>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {isBengali
                    ? 'কোচিং বা অফিসের জন্য আলাদা বিলিং ইনভয়েস ঠিকানা প্রয়োজন হলে টিক তুলে দিন।'
                    : 'Uncheck if you require a different address for tax invoice or coaching billing.'}
                </p>
              </div>
            </label>

            {/* If Billing address is different */}
            {!isBillingSame && (
              <div className="mt-3 pt-3 border-t border-gray-200 pl-6 space-y-2">
                <p className="text-xs font-bold text-gray-700">
                  {isBengali ? 'পৃথক বিলিং ঠিকানা বেছে নিন:' : 'Select billing address:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addresses.map((addr) => (
                    <label
                      key={`billing-${addr.id}`}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                        selectedBillingAddressId === addr.id
                          ? 'border-[#007185] bg-teal-50/40 text-gray-900 font-semibold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="block font-bold truncate">{addr.recipient_name}</span>
                        <span className="text-gray-500 text-[11px] truncate block">
                          {addr.street_address}, {addr.pincode}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="billing_address_selection"
                        checked={selectedBillingAddressId === addr.id}
                        onChange={() => onSelectBillingAddress?.(addr)}
                        className="text-[#007185] focus:ring-[#007185]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gift Delivery Option (Item 46) */}
          <div className="rounded-lg border border-amber-200/80 p-3 sm:p-3.5 bg-amber-50/30">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsGift(val);
                  onToggleGiftOrder?.(val);
                }}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  {isBengali ? 'এই অর্ডারটি কি উপহার হিসেবে পাঠাচ্ছেন?' : 'This order is a gift'}
                </span>
                <p className="text-[11px] text-gray-600 leading-snug">
                  {isBengali
                    ? 'উপহার অর্ডারে প্যাকেজিংয়ের ভেতর বইয়ের মূল্যের ইনভয়েস গোপন রাখা হবে এবং সুন্দর কার্ডে শুভেচ্ছা বার্তা পৌঁছে দেওয়া হবে।'
                    : 'Prices will be hidden in packaging invoice, and your custom message will be included.'}
                </p>

                {/* Gift Message Input */}
                {isGift && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {isBengali ? 'উপহারের শুভেচ্ছা বার্তা লিখুন:' : 'Gift message:'}
                    </label>
                    <textarea
                      rows={2}
                      value={giftNote}
                      onChange={(e) => {
                        setGiftNote(e.target.value);
                        onChangeGiftMessage?.(e.target.value);
                      }}
                      placeholder={
                        isBengali
                          ? 'যেমন: শুভ জন্মদিন প্রিয় বন্ধু! জীবনের সব পরীক্ষায় সফল হও।'
                          : 'e.g. Wishing you great success in your upcoming exams!'
                      }
                      className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Address Form Modal for Adding/Editing Address inline (Item 29 & 27) */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveModalAddress}
        initialData={editingAddress}
        title={
          editingAddress
            ? isBengali
              ? 'ডেলিভারি ঠিকানা সম্পাদনা করুন'
              : 'Edit Delivery Address'
            : isBengali
            ? 'নতুন ডেলিভারি ঠিকানা যোগ করুন'
            : 'Add a New Delivery Address'
        }
        isFirstAddress={addresses.length === 0}
      />
    </section>
  );
};

export default CheckoutAddressSelector;
