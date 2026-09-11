'use client';

/**
 * Module 11 Task 10: Admin & Seller Merchant Shipping Address Action Card
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 34, 35, 48, 50):
 * - Merchant action dashboard view for customer delivery addresses (Item 48)
 * - 1-Click Google Maps location navigation for delivery rider (Item 48)
 * - 1-Click WhatsApp direct customer messaging with order context (Item 48)
 * - 1-Click Direct Phone Calling for primary & alternate numbers
 * - 1-Click 4x6 Thermal Courier Packaging Label generation (Item 34)
 * - Pre-dispatch address correction trigger with post-dispatch security lock (Item 35)
 * - Highlighting of prominent landmarks to reduce RTO / delivery failures by 90% (Item 50)
 */

import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Printer,
  Edit2,
  Lock,
  ShieldCheck,
  Clock,
  Gift,
  Home,
  Briefcase,
  GraduationCap,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  formatSnapshotForShippingLabel,
  generateNavigationUrls,
  verifyAddressModifiability,
} from '@/lib/services/addressSnapshotService';
import { ShippingLabelPrintView } from '@/components/orders/ShippingLabelPrintView';
import type { AddressSnapshot, AddressType } from '@/types/address';

export interface AdminShippingAddressCardProps {
  /** The frozen immutable address snapshot of the order */
  snapshot: AddressSnapshot;
  /** Current order status (e.g. 'packing', 'dispatched', 'in_transit') */
  orderStatus: string;
  /** Optional tracking / AWB number */
  trackingNumber?: string;
  /** Callback when admin triggers pre-dispatch address edit */
  onEditAddress?: (currentSnapshot: AddressSnapshot) => void;
  /** Callback when admin prints label */
  onPrintLabel?: (snapshot: AddressSnapshot) => void;
  /** Optional custom CSS class */
  className?: string;
}

export const AdminShippingAddressCard: React.FC<AdminShippingAddressCardProps> = ({
  snapshot,
  orderStatus,
  trackingNumber,
  onEditAddress,
  onPrintLabel,
  className = '',
}) => {
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  const modifiability = verifyAddressModifiability(orderStatus);
  const { googleMapsUrl, whatsAppUrl } = generateNavigationUrls(snapshot);
  const labelData = formatSnapshotForShippingLabel(snapshot);

  const handleCopyFullAddress = () => {
    const full = `${snapshot.recipient_name}\n${snapshot.recipient_phone}${snapshot.alternate_phone ? ' / ' + snapshot.alternate_phone : ''}\n${snapshot.street_address}\nLandmark: ${snapshot.landmark}\n${snapshot.city}, ${snapshot.district}, ${snapshot.state} - ${snapshot.pincode}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setHasCopiedAddress(true);
      setTimeout(() => setHasCopiedAddress(false), 2000);
    }
  };

  const renderTypeTag = (type: AddressType) => {
    switch (type) {
      case 'home':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Home className="w-3 h-3 text-blue-600" />
            বাড়ি (Home)
          </span>
        );
      case 'work':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Briefcase className="w-3 h-3 text-purple-600" />
            অফিস (Work)
          </span>
        );
      case 'hostel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <GraduationCap className="w-3 h-3 text-amber-600" />
            মেস/হোস্টেল (Hostel)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <MapPin className="w-3 h-3 text-gray-500" />
            অন্যান্য
          </span>
        );
    }
  };

  return (
    <article
      aria-label="Merchant Shipping Address Card"
      className={`bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Card Header: Order Reference & Zone Badge */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 px-4 sm:px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#007185]" />
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            ডেলিভারি শিপিং ইনফরমেশন (Shipping Information)
          </h3>
          {snapshot.snapshot_version && snapshot.snapshot_version > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              v{snapshot.snapshot_version} (সংশোধিত)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zone Badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              snapshot.zone === 'malda_town'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {snapshot.zone === 'malda_town' ? '⚡ মালদা টাউন লোকাল' : '🚚 কুরিয়ার জোন'}
          </span>

          {/* Tamper-evident Checksum pill */}
          {snapshot.snapshot_checksum && (
            <span
              title={`SHA-256 Checksum: ${snapshot.snapshot_checksum}`}
              className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
            >
              #{snapshot.snapshot_checksum.substring(0, 8)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Recipient & Location Block */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-gray-900 tracking-tight">
                  {snapshot.recipient_name}
                </h4>
                {renderTypeTag(snapshot.address_type)}
              </div>

              {/* Phone Contacts */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-1 font-mono">
                <a
                  href={`tel:${snapshot.recipient_phone}`}
                  className="flex items-center gap-1 font-bold text-[#007185] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 {snapshot.recipient_phone}</span>
                </a>

                {snapshot.alternate_phone && (
                  <a
                    href={`tel:${snapshot.alternate_phone}`}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    <span>বিকল্প: +91 {snapshot.alternate_phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Copy Address Button */}
            <button
              type="button"
              onClick={handleCopyFullAddress}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-all active:scale-95"
            >
              {hasCopiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>ঠিকানা কপি করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Street Address & City */}
          <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200 text-xs sm:text-sm text-gray-800 space-y-1.5">
            <p className="font-medium text-gray-900 break-words leading-relaxed">
              {snapshot.street_address}
            </p>

            {/* Item 18 & 48: Prominent Landmark Callout */}
            {snapshot.landmark && (
              <div className="p-2 rounded bg-amber-50/90 border border-amber-200/90 text-amber-950 font-bold text-xs flex items-center gap-1.5">
                <span className="shrink-0 text-amber-700">🚩</span>
                <span>
                  ল্যান্ডমার্ক (Landmark): <strong>{snapshot.landmark}</strong>
                </span>
              </div>
            )}

            <p className="text-xs font-semibold text-gray-700">
              {snapshot.city}, {snapshot.district}, {snapshot.state} -{' '}
              <strong className="text-gray-900 font-mono text-sm tracking-wider">
                {snapshot.pincode}
              </strong>
            </p>
          </div>
        </div>

        {/* Delivery Instructions Badges (Items 13-18) */}
        {snapshot.delivery_preferences && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {snapshot.delivery_preferences.callBeforeDelivery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                <Phone className="w-3 h-3 text-blue-600" />
                ডেলিভারির পূর্বে কল করতে হবে
              </span>
            )}

            {snapshot.delivery_preferences.leaveWithSecurity && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                কেয়ারটেকার / সিকিউরিটি গেটে জমা দিন
              </span>
            )}

            {snapshot.delivery_preferences.doNotRingBell && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200">
                ডোরবেল বাজাবেন না
              </span>
            )}

            {snapshot.delivery_preferences.isWeekendClosed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-800 text-xs font-bold border border-red-200">
                শনি ও রবিবার অফিস বন্ধ
              </span>
            )}

            {snapshot.delivery_preferences.preferredTimeSlot && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Clock className="w-3 h-3 text-emerald-600" />
                স্লট: {snapshot.delivery_preferences.preferredTimeSlot === 'morning_10_to_1' ? 'সকাল ১০টা - দুপুর ১টা' : 'বিকেল ৪টা - সন্ধ্যা ৭টা'}
              </span>
            )}
          </div>
        )}

        {/* Item 20: Delivery OTP Handover Badge */}
        {snapshot.delivery_otp_required && (
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              সিকিউর হ্যান্ডওভার: পার্সেল দেওয়ার সময় কাস্টমারের কাছ থেকে ৪-ডিজিট ওটিপি ভেরিফাই করতে হবে।
            </span>
          </div>
        )}

        {/* Item 46: Gift Order Banner */}
        {snapshot.is_gift_delivery && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">উপহার অর্ডার (Gift Delivery)</span>
              <span className="text-[11px] text-amber-800 block">
                পার্সেলের ভেতরে দাম গোপন থাকবে। বার্তা: &quot;{snapshot.gift_message || 'শুভেচ্ছা রইল'}&quot;
              </span>
            </div>
          </div>
        )}

        {/* Merchant 1-Click Action Toolbar (Item 48) */}
        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Google Maps Navigation */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg shadow-2xs hover:border-gray-400 active:scale-95 transition-all text-center"
          >
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>গুগল ম্যাপস</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          {/* 2. WhatsApp Customer Chat */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg shadow-2xs active:scale-95 transition-all text-center"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>হোয়াটসঅ্যাপ</span>
          </a>

          {/* 3. Print 4x6 Packaging Label */}
          <button
            type="button"
            onClick={() => {
              setIsLabelModalOpen(true);
              onPrintLabel?.(snapshot);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 text-xs font-bold rounded-lg shadow-2xs border border-[#fcd200] active:scale-95 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-gray-900" />
            <span>৪×৬ লেবেল প্রিন্ট</span>
          </button>

          {/* 4. Pre-dispatch Address Edit (Item 35 & 36) */}
          {modifiability.canModify ? (
            <button
              type="button"
              onClick={() => onEditAddress?.(snapshot)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-[#007185] hover:text-[#c45500] text-xs font-bold rounded-lg shadow-2xs active:scale-95 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>ঠিকানা সংশোধন</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={modifiability.reasonBn || modifiability.reason}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-semibold rounded-lg cursor-not-allowed opacity-80"
            >
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>লকড (ডিসপ্যাচড)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4x6 Printable Shipping Label Modal */}
      <ShippingLabelPrintView
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        labelData={labelData}
      />
    </article>
  );
};

export default AdminShippingAddressCard;
