'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  FileText,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Download,
  Printer,
  FileJson,
} from 'lucide-react';
import {
  dpdpCompliance,
  DPO_GRIEVANCE_CONTACT,
  CURRENT_CONSENT_NOTICE_VERSION,
} from '@/lib/auth/dpdpCompliance';
import { dataExportService } from '@/lib/auth/dataExportService';
import { ConsentPurpose, DpdpConsentRecord } from '@/types/auth';

interface DpdpConsentNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

/**
 * Task 30: Digital Personal Data Protection Act (DPDP Act 2023) Consent Notice & Privacy Hub
 */
export const DpdpConsentNoticeModal: React.FC<DpdpConsentNoticeModalProps> = ({
  isOpen,
  onClose,
  userId = 'guest',
}) => {
  const [consents, setConsents] = useState<Record<ConsentPurpose, DpdpConsentRecord>>(() =>
    dpdpCompliance.getConsents(userId)
  );
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConsents(dpdpCompliance.getConsents(userId));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleToggleConsent = (purpose: ConsentPurpose, currentValue: boolean) => {
    if (purpose === 'essential_auth' || purpose === 'order_delivery') {
      // Mandated purposes for core e-commerce functionality
      return;
    }
    const updated = dpdpCompliance.recordConsent(userId, purpose, !currentValue);
    setConsents((prev) => ({
      ...prev,
      [purpose]: updated,
    }));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm font-bengali animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight flex items-center gap-2">
                <span>ডিজিটাল ব্যক্তিগত ডাটা সুরক্ষা (DPDP Act 2023)</span>
                <span className="text-[10px] bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-medium">
                  {CURRENT_CONSENT_NOTICE_VERSION}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                আপনার ব্যক্তিগত তথ্যের গোপনীয়তা ও স্বত্বাধিকার এম.এম বুক হাউসে ১০০% সুরক্ষিত
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-gray-800 text-xs leading-relaxed">
          {/* Toast Notification */}
          {savedToast && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 animate-fadeIn text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>আপনার সম্মতি সফলভাবে আপডেট করা হয়েছে।</span>
            </div>
          )}

          {/* Section 1: Overview */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 space-y-2">
            <h3 className="font-black text-gray-900 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখি?</span>
            </h3>
            <p className="text-gray-600 text-[11px]">
              ভারতীয় <strong>Digital Personal Data Protection Act, 2023</strong> অনুযায়ী, আমরা শুধুমাত্র বই অর্ডার সরবরাহ,
              চালান প্রদান এবং গ্রাহক পরিষেবার জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি। কোনো তৃতীয় পক্ষের কাছে গ্রাহকের ডাটা বিক্রি বা অননুমোদিতভাবে শেয়ার করা হয় না।
            </p>
          </div>

          {/* Section 2: Granular Consent Controls */}
          <div className="space-y-3">
            <h3 className="font-black text-gray-900 text-xs">আপনার ব্যক্তিগত সম্মতি পছন্দসমূহ (Consent Preferences):</h3>

            {/* Essential Auth */}
            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <span>মোবাইল ওটিপি ও অ্যাকাউন্ট নিরাপত্তা</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">অত্যাবশ্যক</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">পাসওয়ার্ড ছাড়া নিরাপদ ওটিপি যাচাই ও কার্ট সংরক্ষণের জন্য আবশ্যক।</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 text-emerald-600 rounded cursor-not-allowed opacity-70"
              />
            </div>

            {/* Order Delivery */}
            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <span>অর্ডার প্রসেসিং ও ডেলিভারি তথ্য</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">অত্যাবশ্যক</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">বই কুরিয়ারে পৌঁছানোর জন্য ঠিকানা ও যোগাযোগ নম্বর সংগ্রহ।</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 text-emerald-600 rounded cursor-not-allowed opacity-70"
              />
            </div>

            {/* WhatsApp Updates */}
            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-300 transition-colors">
              <div>
                <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <span>হোয়াটসঅ্যাপে শিপিং ও লাইভ ট্র্যাকিং আপডেট</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">ঐচ্ছিক</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">পার্সেল রওনা দিলে সরাসরি হোয়াটসঅ্যাপে ট্র্যাকিং লিঙ্ক ও ইনভয়েস পাঠানো।</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.whatsapp_notifications?.isGranted ?? true}
                  onChange={() => handleToggleConsent('whatsapp_notifications', consents.whatsapp_notifications?.isGranted ?? true)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Promotional Updates */}
            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-300 transition-colors">
              <div>
                <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <span>নতুন বই প্রকাশ ও ডিসকাউন্ট অফার বার্তা</span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">ঐচ্ছিক</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">পরীক্ষার বইয়ের বিশেষ ছাড় ও কুপন নোটিফিকেশন।</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.promotional_updates?.isGranted ?? false}
                  onChange={() => handleToggleConsent('promotional_updates', consents.promotional_updates?.isGranted ?? false)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Section 3: Right to Erasure & Data Portability */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-3">
            <div>
              <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                <span>আপনার অধিকার: তথ্য মোছা ও ডেটা পোর্টাবিলিটি (Sec 11 & 12)</span>
              </h4>
              <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                আইন অনুযায়ী আপনি যেকোনো সময় আপনার অ্যাকাউন্ট ডিলিট করতে পারেন অথবা সংগৃহীত সমস্ত ব্যক্তিগত তথ্য ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলার আবেদন জানাতে পারেন। এছাড়াও ধারা ১১ মোতাবেক আপনার সম্পূর্ণ ডাটা ওপেন ফরম্যাটে (JSON ও PDF) ডাউনলোড করার আইনগত অধিকার রয়েছে।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
              <button
                type="button"
                onClick={() => dataExportService.downloadAsJson(userId)}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON ডেটা ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={() => dataExportService.openPrintableReport(userId)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-200" />
                <span>PDF / প্রিন্ট কপি</span>
              </button>
            </div>
          </div>

          {/* Section 4: Grievance Officer & DPO */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="font-bold text-gray-900 text-xs mb-2">ডাটা প্রটেকশন অফিসার ও অভিযোগ প্রতিকার সেল:</h4>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/70 text-[11px] space-y-1 text-gray-600">
              <p className="font-bold text-gray-900">{DPO_GRIEVANCE_CONTACT.name} ({DPO_GRIEVANCE_CONTACT.designation})</p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{DPO_GRIEVANCE_CONTACT.address}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a href={`mailto:${DPO_GRIEVANCE_CONTACT.email}`} className="text-emerald-700 hover:underline">
                  {DPO_GRIEVANCE_CONTACT.email}
                </a>
                <span className="text-gray-400">|</span>
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{DPO_GRIEVANCE_CONTACT.phone}</span>
              </p>
              <p className="text-[10px] text-gray-500 pt-1">
                ⏱️ অভিযোগ পাওয়ার সর্বোচ্চ ৪৮ ঘণ্টার মধ্যে সমাধানের জন্য আমাদের টিম অঙ্গীকারবদ্ধ।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Digital Personal Data Protection Act, 2023 Compliant</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            বুঝেছি ও একমত
          </button>
        </div>
      </div>
    </div>
  );
};
