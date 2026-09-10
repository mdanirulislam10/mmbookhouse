'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Bell,
  ShieldCheck,
  FileText,
  Truck,
  Sparkles,
  Ban,
} from 'lucide-react';
import { dpdpCompliance } from '@/lib/auth/dpdpCompliance';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '@/lib/auth/profileService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface WhatsAppOptInCardProps {
  initialOptIn?: boolean;
  phoneNumber?: string;
  onToggle?: (enabled: boolean) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Task 37: WhatsApp Order Shipping & Tracking Consent Opt-In Card
 * Gives customer full control over receiving automated WhatsApp updates,
 * PDF invoices, and delivery boy tracking without marketing spam.
 */
export const WhatsAppOptInCard: React.FC<WhatsAppOptInCardProps> = ({
  initialOptIn,
  phoneNumber: propPhone,
  onToggle,
  compact = false,
  className = '',
}) => {
  const { profile: authProfile } = useAuthSession();

  const [optIn, setOptIn] = useState<boolean>(() => {
    if (typeof initialOptIn === 'boolean') return initialOptIn;
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      return p.whatsappOptIn ?? true;
    }
    return true; // Default opt-in
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const phone = propPhone || authProfile.phoneNumber || '9800123456';

  useEffect(() => {
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      if (typeof p.whatsappOptIn === 'boolean') {
        setOptIn(p.whatsappOptIn);
      }
    }
  }, [authProfile.id]);

  const handleToggle = (checked: boolean) => {
    setOptIn(checked);
    setIsSaving(true);

    const currentUserId = authProfile.id || DEFAULT_CUSTOMER_PROFILE.id;
    const current = profileService.getProfile(currentUserId);
    const updated = {
      ...current,
      whatsappOptIn: checked,
    };

    // Save to profile
    profileService.saveProfile(updated);

    // Save to DPDP compliance consent records
    dpdpCompliance.recordConsent(currentUserId, 'whatsapp_notifications', checked);

    // Broadcast global event
    if (typeof window !== 'undefined') {
      localStorage.setItem('mm_whatsapp_optin_state', String(checked));
      window.dispatchEvent(
        new CustomEvent('mm_whatsapp_optin_changed', { detail: { enabled: checked } })
      );
    }

    if (onToggle) {
      onToggle(checked);
    }

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Compact layout (e.g. for Checkout pages)
  if (compact) {
    return (
      <div className={`p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl font-bengali ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1.5">
                <span>হোয়াটসঅ্যাপে অর্ডারের নিয়মিত আপডেট ও ইনভয়েস পেতে চাই</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded font-semibold">
                  প্রস্তাবিত
                </span>
              </label>
              <p className="text-[11px] text-gray-600 mt-0.5">
                +91 {phone} নম্বরে কুরিয়ার ট্র্যাকিং লিঙ্ক ও ক্যাশ মেমো পাঠানো হবে। কোনো স্প্যাম নেই।
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>
    );
  }

  // Full Rich Dashboard Card layout
  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden font-bengali ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-green-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 leading-tight">
                হোয়াটসঅ্যাপ নোটিফিকেশন ও ট্র্যাকিং সম্মতি
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  optIn
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {optIn ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>সক্রিয় রয়েছে</span>
                  </>
                ) : (
                  <span>নিষ্ক্রিয়</span>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              অর্ডারের লাইভ স্ট্যাটাস, ট্র্যাকিং ও ক্যাশ মেমো সরাসরি হোয়াটসঅ্যাপে পাওয়ার সম্মতি
            </p>
          </div>
        </div>

        {showToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>সম্মতি সফলভাবে আপডেট হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Toggle Switch Bar */}
        <div className="p-4 bg-gray-50/90 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-900 flex items-center gap-2 cursor-pointer">
              <span>✔ হোয়াটসঅ্যাপে অর্ডারের নিয়মিত আপডেট ও ইনভয়েস পেতে চাই</span>
            </label>
            <p className="text-[11px] text-gray-500">
              সংযুক্ত মোবাইল নম্বর: <span className="font-mono font-bold text-gray-800">+91 {phone}</span>
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs">লাইভ পার্সেল ট্র্যাকিং</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                মালদা পোস্ট অফিস বা কুরিয়ারে বই বুকিং হওয়ামাত্র ট্র্যাকিং নম্বর সহ মেসেজ পৌঁছাবে।
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs">ডিজিটাল ক্যাশ মেমো (PDF)</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                বই ডেলিভারির সাথে সাথে অফিশিয়াল ইনভয়েসের পিডিএফ কপি সরাসরি হোয়াটসঅ্যাপে ডাউনলোডযোগ্য।
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs">আউট ফর ডেলিভারি এলার্ট</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                ডেলিভারি বয় আপনার ঠিকানার উদ্দেশ্যে বের হলে ফোন নম্বর ও ডেলিভারি ওটিপি সতর্কবার্তা।
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Ban className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xs">জিরো স্প্যাম নিশ্চয়তা</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                আমরা কোনো অপ্রয়োজনীয় বিজ্ঞাপন বা অবাঞ্ছিত মেসেজ পাঠাই না। শুধুমাত্র জরুরি আপডেটই পাবেন।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>DPDP Act 2023 অনুযায়ী আপনি যেকোনো সময় এই সম্মতি প্রত্যাহার করতে পারেন</span>
          </div>

          <span className="font-bold text-emerald-700">
            {optIn ? 'হোয়াটসঅ্যাপ মেসেজিং সক্রিয়' : 'নোটিফিকেশন বন্ধ'}
          </span>
        </div>
      </div>
    </div>
  );
};
