'use client';

import React from 'react';
import { Mail, MessageCircle, Send, MapPin, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { DEFAULT_PINCODE } from '@/lib/data/pincodeData';

export interface RemoteIndiaPostCalloutProps {
  pincode?: string;
  bookTitle?: string;
  bookId?: string;
  isRemoteOnly?: boolean;
  className?: string;
}

/**
 * Task 25: Remote India Post Callout & Direct WhatsApp Booking
 * "কোনো প্রত্যন্ত গ্রামে কুরিয়ার না পৌঁছালে ইন্ডিয়া পোস্ট বুকিং ও সরাসরি হোয়াটসঅ্যাপে যোগাযোগের কলআউট"
 */
export const RemoteIndiaPostCallout: React.FC<RemoteIndiaPostCalloutProps> = ({
  pincode: propPincode,
  bookTitle = 'নির্বাচিত বই',
  bookId,
  isRemoteOnly = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const { location } = useDeliveryLocation();

  const activePincode = propPincode || location.pincode || DEFAULT_PINCODE;

  // Helpline WhatsApp number for M.M Book House Malda
  const whatsappNumber = '919733085000';

  const defaultMsg = isBengali
    ? `নমস্কার M.M Book House Malda, আমার পিনকোড (${activePincode}) কোনো সাধারণ বেসরকারি কুরিয়ার পৌঁছাচ্ছে না। আমি ইন্ডিয়া পোস্ট (স্পিড পোস্ট / রেজিস্টার্ড ডাক / VPP)-এর মাধ্যমে "${bookTitle}" বইটি পেতে চাই। ডেলিভারির প্রক্রিয়া জানিয়ে সাহায্য করুন।`
    : `Hello M.M Book House Malda, my pincode (${activePincode}) is in a rural/remote location. I would like to order "${bookTitle}" via India Post (Speed Post / Registered Post / VPP). Please guide me.`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isRemoteOnly
          ? 'bg-gradient-to-r from-red-50/90 via-white to-amber-50/60 border-red-300 ring-2 ring-red-100 shadow-sm'
          : 'bg-gradient-to-r from-rose-50/60 via-white to-orange-50/40 border-rose-200/80 hover:border-rose-300 shadow-2xs'
      } p-3.5 sm:p-4 space-y-3 ${className}`}
      data-testid="remote-india-post-callout"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-red-600 text-white shrink-0 shadow-2xs mt-0.5">
          <Mail className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-xs sm:text-sm">
              {isBengali
                ? 'ইন্ডিয়া পোস্ট ও গ্রামীণ ভি.পি.পি (VPP) বুকিং'
                : 'India Post & Rural VPP Service'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-red-100 text-red-800 border border-red-200">
              {isBengali ? 'প্রত্যন্ত গ্রামেও পৌঁছাবে' : 'Delivering Everywhere'}
            </span>
          </div>

          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {isBengali ? (
              <>
                কোনো প্রত্যন্ত গ্রামে বা চরাঞ্চলে সাধারণ প্রাইভেট কুরিয়ার না পৌঁছালে চিন্তা নেই!
                আমরা <strong>ইন্ডিয়া পোস্ট স্পিড পোস্ট</strong> অথবা <strong>ভি.পি.পি (VPP - ডাকপিয়নের হাতে টাকা)</strong> ব্যবস্থায়
                সরাসরি আপনার বাড়ির দোরগোড়ায় বই পৌঁছে দিই।
              </>
            ) : (
              <>
                Standard couriers unavailable in your village or remote block? Don&apos;t worry!
                We deliver via <strong>India Post Speed Post</strong> and <strong>VPP (Value Payable Post)</strong> to every postal corner of India.
              </>
            )}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-rose-100">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>
                {isBengali ? `পিনকোড: ${activePincode}` : `Pincode: ${activePincode}`}
              </span>
            </div>

            {/* Direct WhatsApp Callout Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>
                {isBengali
                  ? 'হোয়াটসঅ্যাপে ইন্ডিয়া পোস্ট বুক করুন'
                  : 'Book via WhatsApp Post'}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
